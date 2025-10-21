-- Add promotional flag columns to products table
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS "isHotDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isSpecialDeal" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for promotional flags for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_hot_deal ON public.products("isHotDeal");
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON public.products("isNewArrival");
CREATE INDEX IF NOT EXISTS idx_products_is_special_deal ON public.products("isSpecialDeal");

-- Add composite index for querying multiple promotional flags
CREATE INDEX IF NOT EXISTS idx_products_promotional ON public.products("isHotDeal", "isNewArrival", "isSpecialDeal");

-- Add columns to items/image fields that were missing in schema
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS "itemsDetail" JSONB DEFAULT '[]'::jsonb;

-- Make sure category column exists and is indexed
CREATE INDEX IF NOT EXISTS idx_products_category_updated ON public.products(category);
