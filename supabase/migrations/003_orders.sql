-- ── Sequence: concurrency-safe order number generation ──────────────────────
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'PC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
END;
$$;

-- ── orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text          UNIQUE NOT NULL DEFAULT next_order_number(),
  customer_id      uuid          NOT NULL REFERENCES public.customer_profiles(id),
  customer_segment text          NOT NULL CHECK (customer_segment IN ('retail', 'wholesale', 'trade')),
  status           text          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  subtotal         numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  customer_notes   text,
  admin_notes      text,
  submitted_at     timestamptz   NOT NULL DEFAULT now(),
  confirmed_at     timestamptz,
  rejected_at      timestamptz,
  reviewed_by      uuid          REFERENCES public.catalogue_admins(user_id),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

-- ── order_items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    text          NOT NULL,
  sku           text,
  product_title text          NOT NULL,
  quantity      int           NOT NULL CHECK (quantity >= 1),
  unit_price    numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total    numeric(10,2) NOT NULL CHECK (line_total >= 0),
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS orders_customer_id_idx  ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx        ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_submitted_at_idx  ON public.orders(submitted_at DESC);
CREATE INDEX IF NOT EXISTS orders_order_number_idx  ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- ── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers SELECT their own orders only
CREATE POLICY "customers_select_own_orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Customers SELECT their own order_items via ownership
CREATE POLICY "customers_select_own_order_items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE/DELETE by customers — all via API routes using service role

-- ── RPC: create_order ────────────────────────────────────────────────────────
-- Called by /api/orders after full server-side validation.
-- Returns jsonb {id, order_number}.
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_id      uuid,
  p_customer_segment text,
  p_subtotal         numeric,
  p_customer_notes   text,
  p_items            jsonb   -- [{product_id, sku, product_title, quantity, unit_price, line_total}]
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
    subtotal, customer_notes, submitted_at
  ) VALUES (
    v_order_number, p_customer_id, p_customer_segment, 'pending',
    p_subtotal, p_customer_notes, now()
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

-- ── RPC: confirm_order ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_order(
  p_order_id uuid,
  p_admin_id uuid,
  p_notes    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status       = 'confirmed',
      confirmed_at = now(),
      reviewed_by  = p_admin_id,
      admin_notes  = COALESCE(p_notes, admin_notes),
      updated_at   = now()
  WHERE id = p_order_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in pending status';
  END IF;
END;
$$;

-- ── RPC: reject_order ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_order(
  p_order_id uuid,
  p_admin_id uuid,
  p_notes    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status      = 'rejected',
      rejected_at = now(),
      reviewed_by = p_admin_id,
      admin_notes = COALESCE(p_notes, admin_notes),
      updated_at  = now()
  WHERE id = p_order_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in pending status';
  END IF;
END;
$$;

-- ── RPC: cancel_order ─────────────────────────────────────────────────────────
-- Called by /api/orders/[id] after verifying the customer owns the order.
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id    uuid,
  p_customer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status     = 'cancelled',
      updated_at = now()
  WHERE id          = p_order_id
    AND customer_id = p_customer_id
    AND status      = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found, not owned by customer, or not cancellable';
  END IF;
END;
$$;
