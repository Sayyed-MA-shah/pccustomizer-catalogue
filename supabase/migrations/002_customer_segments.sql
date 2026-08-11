-- ============================================================
-- 002_customer_segments.sql
-- Run this in the Supabase SQL editor for the catalogue project
-- ============================================================

-- 1. Add customer_segment (nullable, no default — must start NULL)
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS customer_segment text
  CONSTRAINT chk_customer_segment
    CHECK (customer_segment IN ('retail', 'wholesale', 'trade'));

-- customer_segment is intentionally absent from the authenticated-role
-- UPDATE grant (which only allows: full_name, company_name, company_vat, phone),
-- so customers cannot set or modify their own segment via any client-facing path.


-- 2. Replace approve_access_request to atomically set customer_segment
CREATE OR REPLACE FUNCTION public.approve_access_request(
  p_request_id  uuid,
  p_reviewer_id uuid,
  p_notes       text DEFAULT NULL,
  p_segment     text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Segment is mandatory for approval
  IF p_segment IS NULL OR p_segment NOT IN ('retail', 'wholesale', 'trade') THEN
    RAISE EXCEPTION 'customer_segment is required and must be retail, wholesale, or trade';
  END IF;

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
  SET status           = 'approved',
      customer_segment = p_segment,
      updated_at       = now()
  WHERE id = v_user_id;
END;
$$;


-- 3. New RPC: change_customer_segment
--    Called only via the admin API route, which first verifies
--    admin identity using the authenticated client + RLS on catalogue_admins.
CREATE OR REPLACE FUNCTION public.change_customer_segment(
  p_user_id  uuid,
  p_segment  text,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_segment NOT IN ('retail', 'wholesale', 'trade') THEN
    RAISE EXCEPTION 'Invalid segment: must be retail, wholesale, or trade';
  END IF;

  UPDATE public.customer_profiles
  SET customer_segment = p_segment,
      updated_at       = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'customer % not found', p_user_id;
  END IF;
END;
$$;
