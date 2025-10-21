-- Migration: Add Promotional Flags to Products Table
-- Date: October 21, 2025
-- Purpose: Fix promotional auto-assignment bug by adding missing database columns
-- Issue: Products were appearing in all sections because database schema lacked promotional flag columns

-- Step 1: Add promotional flag columns
-- These columns store which promotional sections a product should appear in
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS "isHotDeal" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS "isSpecialDeal" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS "isTopBasket" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create indexes for query performance
-- These indexes ensure fast filtering of products by promotional flags
CREATE INDEX IF NOT EXISTS idx_products_is_hot_deal ON public.products("isHotDeal");
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON public.products("isNewArrival");
CREATE INDEX IF NOT EXISTS idx_products_is_special_deal ON public.products("isSpecialDeal");
CREATE INDEX IF NOT EXISTS idx_products_is_top_basket ON public.products("isTopBasket");

-- Step 3: Verify migration success
-- This query should return 4 rows showing all promotional flag columns were created
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name IN ('isHotDeal', 'isNewArrival', 'isSpecialDeal', 'isTopBasket')
ORDER BY column_name;

-- Expected output after running this migration:
-- column_name    | data_type | is_nullable | column_default
-- ─────────────────────────────────────────────────────────
-- isHotDeal      | boolean   | NO          | false
-- isNewArrival   | boolean   | NO          | false
-- isSpecialDeal  | boolean   | NO          | false
-- isTopBasket    | boolean   | NO          | false

-- Step 4: Verify indexes were created (optional)
-- SELECT * FROM pg_indexes 
-- WHERE tablename = 'products' 
-- AND indexname LIKE 'idx_products_is%';
