-- ============================================================
-- 001_initial_schema.sql
-- Catalogue Supabase project — initial schema
-- Run this in the Supabase SQL editor or via Supabase CLI
-- ============================================================


-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE public.catalogue_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  full_name    text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  company_vat  text,
  phone        text,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.access_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  business_info jsonb NOT NULL DEFAULT '{}',
  notes        text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid REFERENCES public.catalogue_admins(user_id)
);

-- Indexes
CREATE INDEX idx_customer_profiles_status ON public.customer_profiles(status);
CREATE INDEX idx_access_requests_user_id  ON public.access_requests(user_id);
CREATE INDEX idx_access_requests_status   ON public.access_requests(status);

-- Unique: only one pending request per user at a time
CREATE UNIQUE INDEX idx_access_requests_one_pending
  ON public.access_requests(user_id)
  WHERE status = 'pending';


-- ── updated_at trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.customer_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_admins   ENABLE ROW LEVEL SECURITY;

-- customer_profiles: read own row only
CREATE POLICY "customers_select_own"
  ON public.customer_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- customer_profiles: customers may update only non-status fields
-- Column-level grants enforce this at the database level
CREATE POLICY "customers_update_own"
  ON public.customer_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Column-level privilege: strip UPDATE entirely, then re-grant only safe columns
-- (status is intentionally omitted — only SECURITY DEFINER RPCs may change it)
REVOKE UPDATE ON public.customer_profiles FROM authenticated;
GRANT  UPDATE (full_name, company_name, company_vat, phone)
  ON public.customer_profiles TO authenticated;

-- access_requests: read own requests only
CREATE POLICY "customers_select_own_requests"
  ON public.access_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- catalogue_admins: authenticated users may check whether they themselves are admin
CREATE POLICY "admins_select_own"
  ON public.catalogue_admins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ── DB trigger: auto-create profile + request on sign-up ────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, company_name, company_vat, phone, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'company_vat', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    'pending'
  );

  INSERT INTO public.access_requests (user_id, status, business_info)
  VALUES (
    NEW.id,
    'pending',
    jsonb_build_object(
      'email',        NEW.email,
      'full_name',    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'company_name', COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      'company_vat',  NEW.raw_user_meta_data->>'company_vat',
      'phone',        NEW.raw_user_meta_data->>'phone'
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── Atomic admin RPC functions ───────────────────────────────
-- All run as SECURITY DEFINER (postgres role) to bypass RLS
-- and update both tables in a single transaction.

CREATE OR REPLACE FUNCTION public.approve_access_request(
  p_request_id  uuid,
  p_reviewer_id uuid,
  p_notes       text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.access_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'access_request % not found or not pending', p_request_id;
  END IF;

  UPDATE public.access_requests
  SET status      = 'approved',
      reviewed_at = now(),
      reviewed_by = p_reviewer_id,
      notes       = p_notes
  WHERE id = p_request_id;

  UPDATE public.customer_profiles
  SET status     = 'approved',
      updated_at = now()
  WHERE id = v_user_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.reject_access_request(
  p_request_id  uuid,
  p_reviewer_id uuid,
  p_notes       text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.access_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'access_request % not found or not pending', p_request_id;
  END IF;

  UPDATE public.access_requests
  SET status      = 'rejected',
      reviewed_at = now(),
      reviewed_by = p_reviewer_id,
      notes       = p_notes
  WHERE id = p_request_id;

  UPDATE public.customer_profiles
  SET status     = 'rejected',
      updated_at = now()
  WHERE id = v_user_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.revoke_customer_access(
  p_user_id     uuid,
  p_reviewer_id uuid,
  p_notes       text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.customer_profiles
  SET status     = 'revoked',
      updated_at = now()
  WHERE id = p_user_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'customer % not found or not currently approved', p_user_id;
  END IF;
END;
$$;
