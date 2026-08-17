-- Migration 005: Guest Orders
-- Run this in the Supabase SQL Editor.

-- 1. Make customer_id nullable (guest orders have no account)
ALTER TABLE public.orders
  ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Guest contact snapshot fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_full_name    text,
  ADD COLUMN IF NOT EXISTS guest_email        text,
  ADD COLUMN IF NOT EXISTS guest_phone        text,
  ADD COLUMN IF NOT EXISTS guest_company_name text;

-- 3. Secure guest order lookup token (UUID string — 122 bits of entropy)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_token text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_guest_token_unique
  ON public.orders(guest_token)
  WHERE guest_token IS NOT NULL;

-- 4. Constraint: every order must belong either to a customer account OR contain guest contact info
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_customer_or_guest;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_or_guest CHECK (
    customer_id IS NOT NULL
    OR (guest_full_name IS NOT NULL AND guest_email IS NOT NULL)
  );

-- 5. RPC: create_guest_order
--    SECURITY DEFINER so it can INSERT without requiring an authenticated session.
--    Caller passes pre-resolved website_price per item (server validates before calling).
CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_guest_full_name           text,
  p_guest_email               text,
  p_subtotal                  numeric,
  p_items                     jsonb,
  p_guest_phone               text            DEFAULT NULL,
  p_guest_company_name        text            DEFAULT NULL,
  p_customer_notes            text            DEFAULT NULL,
  p_billing_address_snapshot  jsonb           DEFAULT NULL,
  p_delivery_address_snapshot jsonb           DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id     uuid;
  v_order_number text;
  v_guest_token  text;
  v_item         jsonb;
BEGIN
  -- Basic input guards
  IF p_guest_full_name IS NULL OR trim(p_guest_full_name) = '' THEN
    RAISE EXCEPTION 'guest_full_name is required';
  END IF;
  IF p_guest_email IS NULL OR trim(p_guest_email) = '' THEN
    RAISE EXCEPTION 'guest_email is required';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  v_order_number := next_order_number();
  v_guest_token  := gen_random_uuid()::text;

  INSERT INTO public.orders (
    order_number, customer_id, customer_segment, status,
    subtotal, customer_notes, submitted_at,
    guest_full_name, guest_email, guest_phone, guest_company_name,
    guest_token,
    billing_address_snapshot, delivery_address_snapshot
  ) VALUES (
    v_order_number, NULL, NULL, 'pending',
    p_subtotal, p_customer_notes, now(),
    trim(p_guest_full_name), lower(trim(p_guest_email)),
    NULLIF(trim(p_guest_phone), ''),
    NULLIF(trim(p_guest_company_name), ''),
    v_guest_token,
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

  RETURN jsonb_build_object(
    'id',           v_order_id,
    'order_number', v_order_number,
    'guest_token',  v_guest_token
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_guest_order TO anon;
