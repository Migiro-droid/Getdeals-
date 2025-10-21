-- 🧹 PROMOTIONAL SECTION CLEANUP SCRIPT
-- Purpose: Reset conflicting promotional flags and ensure data integrity
-- Date: October 21, 2025
-- Status: Ready to run

-- ⚠️ WARNING: This script will reset all promotional flags. Products will need to be reassigned.

-- Step 1: Check for products with multiple promotional flags set (DIAGNOSTIC ONLY)
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

-- Step 2: Show products by promotional section (DIAGNOSTIC ONLY)
-- Hot Deals
SELECT id, name, 'Hot Deals' as section FROM products WHERE "isHotDeal" = true;

-- New Arrivals
SELECT id, name, 'New Arrivals' as section FROM products WHERE "isNewArrival" = true;

-- Special Deals
SELECT id, name, 'Special Deals' as section FROM products WHERE "isSpecialDeal" = true;

-- Top Baskets
SELECT id, name, 'Top Baskets' as section FROM products WHERE "isTopBasket" = true;

-- Step 3: CLEANUP - Reset all promotional flags to false
-- Run this if you want to completely reset and reassign all products
-- UPDATE products
-- SET 
--   "isHotDeal" = false,
--   "isNewArrival" = false,
--   "isSpecialDeal" = false,
--   "isTopBasket" = false,
--   "updatedAt" = NOW();

-- Step 4: Alternative - Keep only the first flag found for each product (AUTO-FIX)
-- This preserves one promotional assignment per product
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

-- Step 5: Verify cleanup (DIAGNOSTIC ONLY)
SELECT 
  'Hot Deals' as section, COUNT(*) as count FROM products WHERE "isHotDeal" = true
UNION ALL
SELECT 'New Arrivals' as section, COUNT(*) as count FROM products WHERE "isNewArrival" = true
UNION ALL
SELECT 'Special Deals' as section, COUNT(*) as count FROM products WHERE "isSpecialDeal" = true
UNION ALL
SELECT 'Top Baskets' as section, COUNT(*) as count FROM products WHERE "isTopBasket" = true
UNION ALL
SELECT 'No Promotional Section' as section, COUNT(*) as count FROM products 
WHERE "isHotDeal" = false AND "isNewArrival" = false AND "isSpecialDeal" = false AND "isTopBasket" = false;

-- Step 6: Check for products still with multiple flags (should return 0 rows after cleanup)
SELECT 
  id,
  name,
  (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) as active_sections
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1
ORDER BY active_sections DESC;

-- 📝 USAGE INSTRUCTIONS:
-- 1. First, run Steps 1-2 (SELECT statements) to diagnose the current state
-- 2. Review which products have multiple promotional flags
-- 3. Choose your cleanup strategy:
--    - Option A: Reset all (Step 3) - Reassign via admin panel
--    - Option B: Keep first flag (Step 4) - Automatic intelligent fix
-- 4. Run the chosen cleanup
-- 5. Run Step 5 to verify the cleanup worked
-- 6. Run Step 6 to confirm no overlapping flags remain

-- ✅ After cleanup:
-- - Re-open admin panel
-- - New products will respect mutual exclusivity automatically
-- - Existing products should now have 0 or 1 flag each
-- - Frontend will prevent future overlaps
