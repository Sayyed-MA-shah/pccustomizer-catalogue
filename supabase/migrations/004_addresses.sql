-- ── customer_addresses ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid    NOT NULL
                          REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  address_type    text    NOT NULL CHECK (address_type IN ('billing', 'delivery')),
  label           text,                            -- e.g. "Main Warehouse"
  company_name    text,
  contact_name    text,
  address_line_1  text    NOT NULL,
  address_line_2  text,
  city            text    NOT NULL,
  county          text,
  postcode        text    NOT NULL,
  country         text    NOT NULL DEFAULT 'United Kingdom',
  phone           text,
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_id_idx
  ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS customer_addresses_type_idx
  ON public.customer_addresses(customer_id, address_type);
CREATE INDEX IF NOT EXISTS customer_addresses_default_idx
  ON public.customer_addresses(customer_id, address_type)
  WHERE is_default = true;

-- Reuse touch_updated_at from 003_orders.sql (idempotent)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enforce at most one default per (customer, address_type)
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.customer_addresses
  SET    is_default = false
  WHERE  customer_id  = NEW.customer_id
    AND  address_type = NEW.address_type
    AND  id           != NEW.id
    AND  is_default   = true;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ensure_default_address_unique ON public.customer_addresses;
CREATE TRIGGER ensure_default_address_unique
  AFTER INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_address();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers may only see their own addresses
CREATE POLICY "customers_select_own_addresses"
  ON public.customer_addresses FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- customer_id must equal the authenticated user — browser cannot forge ownership
CREATE POLICY "customers_insert_own_addresses"
  ON public.customer_addresses FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "customers_update_own_addresses"
  ON public.customer_addresses FOR UPDATE TO authenticated
  USING  (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "customers_delete_own_addresses"
  ON public.customer_addresses FOR DELETE TO authenticated
  USING (customer_id = auth.uid());

-- ── Address snapshots on orders ────────────────────────────────────────────────
-- Snapshots are immutable once written — historical orders are never affected
-- by later address edits.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS billing_address_snapshot  jsonb,
  ADD COLUMN IF NOT EXISTS delivery_address_snapshot jsonb;

-- ── Update create_order RPC ───────────────────────────────────────────────────
-- Adds optional address snapshot parameters (DEFAULT NULL preserves
-- backwards-compatibility if the old signature was already called).
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_id               uuid,
  p_customer_segment          text,
  p_subtotal                  numeric,
  p_customer_notes            text,
  p_items                     jsonb,
  p_billing_address_snapshot  jsonb DEFAULT NULL,
  p_delivery_address_snapshot jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id     uuid;
  v_order_number text;
  v_item         jsonb;
BEGIN
  IF p_customer_segment NOT IN ('retail', 'wholesale', 'trade') THEN
    RAISE EXCEPTION 'Invalid customer segment: %', p_customer_segment;
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  v_order_number := next_order_number();

  INSERT INTO public.orders (
    order_number, customer_id, customer_segment, status,
    subtotal, customer_notes, submitted_at,
    billing_address_snapshot, delivery_address_snapshot
  ) VALUES (
    v_order_number, p_customer_id, p_customer_segment, 'pending',
    p_subtotal, p_customer_notes, now(),
    p_billing_address_snapshot, p_delivery_address_snapshot
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, sku, product_title, quantity, unit_price, line_total
    ) VALUES (
      v_order_id,
      v_item->>'product_id',
      v_item->>'sku',
      v_item->>'product_title',
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'line_total')::numeric
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
END;
$$;
