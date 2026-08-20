-- Migration 006: Special Listings (Faulty/Parts lots + auction-ready schema)
-- Run the FULL contents of this file in Supabase SQL Editor.
-- After running, also create the storage bucket per the instructions at the bottom.

-- ── Listing number sequence (thread-safe) ─────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.listing_number_seq START 1;

CREATE OR REPLACE FUNCTION public.next_listing_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN 'LOT-' || lpad(nextval('public.listing_number_seq')::text, 4, '0');
END;
$$;

-- ── Updated_at helper (create if not already present) ─────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── special_listings ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.special_listings (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_number    text          UNIQUE NOT NULL DEFAULT next_listing_number(),
  title             text          NOT NULL,
  slug              text          UNIQUE NOT NULL,
  short_description text,
  description       text,
  listing_category  text          NOT NULL CHECK (listing_category IN ('faulty_parts', 'refurbished_bulk', 'clearance', 'mixed_lot')),
  sale_method       text          NOT NULL DEFAULT 'fixed_price' CHECK (sale_method IN ('fixed_price', 'auction')),
  status            text          NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold', 'withdrawn')),
  fixed_price       numeric(10,2) CHECK (fixed_price IS NULL OR fixed_price >= 0),
  -- Auction-ready fields (not yet used for public bidding)
  starting_bid      numeric(10,2),
  reserve_price     numeric(10,2),
  bid_increment     numeric(10,2),
  start_at          timestamptz,
  end_at            timestamptz,
  quantity_total    int           NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
  visibility        text          NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'approved_customers_only')),
  customer_notes    text,
  created_by        uuid          NOT NULL REFERENCES auth.users(id),
  published_at      timestamptz,
  sold_at           timestamptz,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER special_listings_updated_at
  BEFORE UPDATE ON public.special_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── special_listing_items ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.special_listing_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id             uuid NOT NULL REFERENCES public.special_listings(id) ON DELETE CASCADE,
  internal_product_id    text NOT NULL,
  internal_sku           text,
  product_title_snapshot text NOT NULL,
  brand_snapshot         text,
  model_snapshot         text,
  condition_snapshot     text,
  quantity               int  NOT NULL CHECK (quantity >= 1),
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS special_listing_items_listing_id_idx ON public.special_listing_items(listing_id);

-- ── special_listing_images ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.special_listing_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.special_listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  alt_text     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS special_listing_images_listing_id_idx ON public.special_listing_images(listing_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.special_listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_listing_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_listing_images ENABLE ROW LEVEL SECURITY;

-- anon + authenticated: read published listings only
CREATE POLICY "public read published listings"
  ON public.special_listings FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "public read published listing items"
  ON public.special_listing_items FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.special_listings l
    WHERE l.id = listing_id AND l.status = 'published'
  ));

CREATE POLICY "public read published listing images"
  ON public.special_listing_images FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.special_listings l
    WHERE l.id = listing_id AND l.status = 'published'
  ));

-- All mutations are via service role in admin API routes (no authenticated INSERT/UPDATE/DELETE policies)

-- ── Storage bucket (PRIVATE — images served via signed URLs only) ─────────────
-- Run this block in SQL Editor after the tables above.
-- If your SQL user cannot INSERT into storage.buckets, create the bucket
-- manually in the Supabase dashboard (Storage > New bucket) with:
--   Name: special-listing-images
--   Public: OFF (private)
--   File size limit: 10 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Then run only the CREATE POLICY statements below in SQL Editor.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'special-listing-images',
  'special-listing-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Service role: full access for admin API routes
CREATE POLICY "service role manage listing images"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'special-listing-images')
  WITH CHECK (bucket_id = 'special-listing-images');

-- No public read policy — clients receive signed URLs generated server-side only

-- ── After running, force PostgREST schema cache refresh ──────────────────────
-- Run this if you still see "table not found" errors after the migration:
-- NOTIFY pgrst, 'reload schema';
