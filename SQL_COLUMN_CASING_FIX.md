# ⚡ QUICK REFERENCE - SQL COLUMN NAME CASING FIX

## The Error You Encountered

```
ERROR:  42703: column "ishotdeal" does not exist
LINE 4:   isHotDeal,
HINT:  Perhaps you meant to reference the column "products.isHotDeal".
```

## Why It Happened

PostgreSQL (Supabase's database) is **case-sensitive** for column names.

- ❌ `isHotDeal` without quotes = PostgreSQL converts to lowercase `ishotdeal` → NOT FOUND
- ✅ `"isHotDeal"` with quotes = PostgreSQL preserves case → FOUND

## The Fix

**Always quote column names that have mixed case (camelCase):**

```sql
-- ❌ WRONG - Gets converted to lowercase
SELECT isHotDeal FROM products;

-- ✅ CORRECT - Preserves the case
SELECT "isHotDeal" FROM products;
```

## All Promotional Columns (Must Be Quoted)

```sql
"isHotDeal"      -- Must have quotes
"isNewArrival"   -- Must have quotes
"isSpecialDeal"  -- Must have quotes
"isTopBasket"    -- Must have quotes
```

## Correct Query Examples

### ✅ Check products with overlaps
```sql
SELECT 
  id,
  name,
  "isHotDeal",
  "isNewArrival",
  "isSpecialDeal",
  "isTopBasket"
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1;
```

### ✅ Count per section
```sql
SELECT 
  'Hot Deals' as section, COUNT(*) as count 
FROM products 
WHERE "isHotDeal" = true;
```

### ✅ Auto-fix conflicts
```sql
UPDATE products
SET 
  "isHotDeal" = CASE WHEN "isHotDeal" = true THEN true ELSE false END,
  "isNewArrival" = CASE WHEN "isHotDeal" = true THEN false WHEN "isNewArrival" = true THEN true ELSE false END,
  "isSpecialDeal" = CASE WHEN "isHotDeal" = true OR "isNewArrival" = true THEN false WHEN "isSpecialDeal" = true THEN true ELSE false END,
  "isTopBasket" = CASE WHEN "isHotDeal" = true OR "isNewArrival" = true OR "isSpecialDeal" = true THEN false WHEN "isTopBasket" = true THEN true ELSE false END,
  "updatedAt" = NOW()
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1;
```

## Rule of Thumb

**When in doubt, quote it!**

In Supabase SQL Editor:
- Single words: `id`, `name` (no quotes needed)
- camelCase: `"isHotDeal"`, `"updatedAt"`, `"createdAt"` (quotes required)
- snake_case: `updated_at`, `created_at` (no quotes needed)

## Files Updated

- ✅ `PROMOTIONAL_SECTION_CLEANUP.sql` - Fixed all column names to use quotes
- ✅ `PROMOTIONAL_SECTION_CLEANUP_CORRECTED.sql` - New cleaner version with better instructions

## Next Steps

1. Open `PROMOTIONAL_SECTION_CLEANUP_CORRECTED.sql`
2. Copy diagnostic queries (Steps 1-2) → Run in Supabase
3. Review results
4. Choose cleanup option (Step 3 or 4)
5. Run chosen update query
6. Verify with Step 5-6 queries
7. Test in admin panel

**Status**: ✅ Ready to run correctly now!
