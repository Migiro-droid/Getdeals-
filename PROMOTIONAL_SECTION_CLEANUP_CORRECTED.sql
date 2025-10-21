-- 🧹 PROMOTIONAL SECTION CLEANUP SCRIPT - CORRECTED
-- Purpose: Reset conflicting promotional flags and ensure data integrity
-- Date: October 21, 2025
-- Status: ✅ Ready to run - FIXED COLUMN NAME CASING
-- Database: Supabase PostgreSQL

-- ⚠️ IMPORTANT: Column names MUST be quoted due to camelCase
-- PostgreSQL is case-sensitive, so "isHotDeal" != ishotdeal

---
-- STEP 1: DIAGNOSTIC - Check current state (READ ONLY - SAFE TO RUN)
---

-- Shows all products with multiple promotional flags active
SELECT 
  id,
  name,
  "isHotDeal",
  "isNewArrival",
  "isSpecialDeal",
  "isTopBasket",
  (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) as active_sections
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1
ORDER BY active_sections DESC;

---
-- STEP 2: DIAGNOSTIC - Count products per section (READ ONLY - SAFE TO RUN)
---

SELECT 
  'Hot Deals' as section, 
  COUNT(*) as count 
FROM products 
WHERE "isHotDeal" = true

UNION ALL

SELECT 'New Arrivals', COUNT(*) 
FROM products 
WHERE "isNewArrival" = true

UNION ALL

SELECT 'Special Deals', COUNT(*) 
FROM products 
WHERE "isSpecialDeal" = true

UNION ALL

SELECT 'Top Baskets', COUNT(*) 
FROM products 
WHERE "isTopBasket" = true

UNION ALL

SELECT 'No Promotional Section', COUNT(*) 
FROM products 
WHERE "isHotDeal" = false 
  AND "isNewArrival" = false 
  AND "isSpecialDeal" = false 
  AND "isTopBasket" = false;

---
-- STEP 3: OPTIONAL - Reset ALL promotional flags to false
-- Use this for a complete clean slate
-- ⚠️ WARNING: This will remove ALL promotional assignments
-- All products will need to be manually reassigned via admin panel
---

-- UPDATE products
-- SET 
--   "isHotDeal" = false,
--   "isNewArrival" = false,
--   "isSpecialDeal" = false,
--   "isTopBasket" = false,
--   "updatedAt" = NOW()
-- WHERE true;

---
-- STEP 4: RECOMMENDED - Intelligent Auto-Fix (Preserve first flag)
-- This keeps ONE promotional assignment per product
-- Priority: Hot Deals > New Arrivals > Special Deals > Top Baskets
-- ⚠️ WARNING: This WILL modify your database - test in staging first
---

-- UPDATE products
-- SET 
--   "isHotDeal" = CASE 
--     WHEN "isHotDeal" = true THEN true
--     ELSE false 
--   END,
--   "isNewArrival" = CASE 
--     WHEN "isHotDeal" = true THEN false
--     WHEN "isNewArrival" = true THEN true
--     ELSE false 
--   END,
--   "isSpecialDeal" = CASE 
--     WHEN "isHotDeal" = true OR "isNewArrival" = true THEN false
--     WHEN "isSpecialDeal" = true THEN true
--     ELSE false 
--   END,
--   "isTopBasket" = CASE 
--     WHEN "isHotDeal" = true OR "isNewArrival" = true OR "isSpecialDeal" = true THEN false
--     WHEN "isTopBasket" = true THEN true
--     ELSE false 
--   END,
--   "updatedAt" = NOW()
-- WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1;

---
-- STEP 5: VERIFICATION - Check cleanup results (READ ONLY - SAFE TO RUN)
---

-- Should show products with exactly 0 or 1 flag active now
SELECT 
  id,
  name,
  "isHotDeal",
  "isNewArrival",
  "isSpecialDeal",
  "isTopBasket",
  (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) as active_sections
FROM products
ORDER BY active_sections DESC, name ASC;

---
-- STEP 6: FINAL CHECK - Confirm no conflicts (READ ONLY - SAFE TO RUN)
---

-- Should return 0 rows (if cleanup worked successfully)
SELECT 
  id,
  name,
  (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) as active_sections
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1
ORDER BY active_sections DESC;

-- If this returns 0 rows, cleanup was successful! ✅

---
-- USAGE INSTRUCTIONS:
---

-- 1. Copy the read-only diagnostic queries (Steps 1-2) and run them in Supabase SQL Editor
--    This shows you the current state of your data
--
-- 2. If you find products with multiple flags:
--    - Choose cleanup strategy:
--      Option A: Complete Reset (Step 3) - Clear all, then reassign manually
--      Option B: Intelligent Fix (Step 4) - Keep first flag, auto-clear others
--
-- 3. Uncomment and run the chosen cleanup query
--
-- 4. Run verification queries (Steps 5-6) to confirm
--
-- 5. Test in admin panel:
--    - Create a new product
--    - Try selecting multiple promotional sections
--    - Verify only ONE can be active at a time
--
-- 6. If successful, products should now:
--    - Appear in ONLY ONE promotional section
--    - NOT appear in multiple sections simultaneously

-- ✅ EXPECTED OUTCOME:
-- - Each product has 0 or 1 promotional section assigned
-- - No product appears in multiple promotional areas
-- - Frontend prevents future overlaps automatically
-- - Products can be moved between sections via admin panel

