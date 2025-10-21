# How to Apply the Promotional Flags Migration

The migration file `supabase/migrations/20251020_add_promotional_flags.sql` has been created but needs to be applied to your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com
2. Select your GetDeals Kenya project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire content below:

```sql
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
```

6. Click **Run** (or press Ctrl+Enter)
7. Wait for the query to complete successfully

## What This Migration Does

✅ **Adds three promotional flag columns to products table:**
- `isHotDeal` - Boolean flag for Hot Deals section
- `isNewArrival` - Boolean flag for New Arrivals section
- `isSpecialDeal` - Boolean flag for Special Deals section

✅ **Creates performance indexes** for each promotional flag

✅ **Adds composite index** for querying multiple flags together

✅ **Adds itemsDetail column** for storing individual item details as JSON

✅ **Indexes category column** for faster filtering by category

## After Migration

Once the migration is applied:

1. ✅ Admin can assign products to promotional sections via checkboxes
2. ✅ Products will ONLY appear in the selected promotional sections
3. ✅ Hot Deals section will show products where `isHotDeal = true`
4. ✅ New Arrivals section will show products where `isNewArrival = true`
5. ✅ Special Deals section will show products where `isSpecialDeal = true`

## Testing

After migration is applied:

1. Go to Admin → Products
2. Add or edit a product
3. Select promotional section checkboxes (e.g., only "Hot Deals")
4. Save the product
5. Go to homepage and verify product appears ONLY in the Hot Deals section

---

**Status:** Migration ready to apply  
**File:** `supabase/migrations/20251020_add_promotional_flags.sql`  
**Date:** October 20, 2025
