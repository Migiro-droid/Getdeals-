-- Migration: Add isTopBasket column to products table
-- Purpose: Enable Top Baskets promotional section management
-- Created: [Current Date]
-- Target: Supabase PostgreSQL database

-- Add the isTopBasket column to the products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS "isTopBasket" BOOLEAN NOT NULL DEFAULT false;

-- Create an index for efficient filtering of Top Baskets
CREATE INDEX IF NOT EXISTS idx_products_is_top_basket
ON products("isTopBasket");

-- Optional: Update existing records (all will default to false via DEFAULT clause)
-- This query is not necessary but shown for reference
-- UPDATE products SET "isTopBasket" = false WHERE "isTopBasket" IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'isTopBasket';
