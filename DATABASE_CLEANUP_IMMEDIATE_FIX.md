# 🚨 URGENT: Database Cleanup Required

## Problem
The two baskets you added to the **Top Baskets** section are appearing in **New Arrivals** and **Special Deals** sections as well. This means they have **multiple promotional flags set to `true`** in the database.

## Root Cause
The database contains products with multiple promotional flags enabled at the same time:
- `isTopBasket: true`
- `isNewArrival: true`
- `isSpecialDeal: true`

The frontend switches now prevent this for NEW products, but EXISTING products still have the old conflicting data.

## Solution: Run SQL Cleanup

### Step 1: Open Supabase SQL Editor
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Check Current Conflicts (READ-ONLY - SAFE)
Copy and run this query to see which products have multiple promotional flags:

```sql
-- Find all products with multiple promotional flags
SELECT 
  id,
  name,
  "isHotDeal",
  "isNewArrival",
  "isSpecialDeal",
  "isTopBasket"
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1
ORDER BY name ASC;
```

**This will show you exactly which products have conflicts.**

### Step 3: Run the Cleanup (RECOMMENDED FIX)
This query will intelligently keep the FIRST promotional flag it finds for each product, preserving your intent:

**Priority Order:**
1. **Hot Deals** (highest priority)
2. **New Arrivals**
3. **Special Deals**
4. **Top Baskets** (lowest priority)

Copy and run this query:

```sql
-- Intelligent Auto-Fix: Keep first flag per product, clear the rest
UPDATE products
SET 
  "isHotDeal" = CASE 
    WHEN "isHotDeal" = true THEN true
    ELSE false 
  END,
  "isNewArrival" = CASE 
    WHEN "isHotDeal" = true THEN false
    WHEN "isNewArrival" = true THEN true
    ELSE false 
  END,
  "isSpecialDeal" = CASE 
    WHEN "isHotDeal" = true OR "isNewArrival" = true THEN false
    WHEN "isSpecialDeal" = true THEN true
    ELSE false 
  END,
  "isTopBasket" = CASE 
    WHEN "isHotDeal" = true OR "isNewArrival" = true OR "isSpecialDeal" = true THEN false
    WHEN "isTopBasket" = true THEN true
    ELSE false 
  END,
  "updatedAt" = NOW()
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1;
```

**This will only affect products with conflicts - safe to run!**

### Step 4: Verify the Fix (READ-ONLY - SAFE)
Run this to confirm no more conflicts exist:

```sql
-- Check if any product still has multiple promotional flags
SELECT 
  id,
  name,
  "isHotDeal",
  "isNewArrival",
  "isSpecialDeal",
  "isTopBasket",
  (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) as active_flags
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1;
```

**✅ If this returns 0 rows = SUCCESS! No more conflicts.**

### Step 5: Verify in Admin Panel
1. Go to your admin panel
2. Check the two baskets you added - they should now appear ONLY in Top Baskets
3. Create a new product and test:
   - Select "Top Baskets"
   - Switch to "New Arrivals" - should auto-deselect "Top Baskets"
   - Each section should be mutually exclusive

## If Something Goes Wrong: Rollback Plan

If you need to undo, you have the git history. The database change can also be manually fixed by reassigning products through the admin panel one at a time.

## Summary of What This Fixes

| Before | After |
|--------|-------|
| Baskets appear in Top Baskets ❌ | Baskets appear ONLY in Top Baskets ✅ |
| Baskets also in New Arrivals ❌ | Baskets NOT in New Arrivals ✅ |
| Baskets also in Special Deals ❌ | Baskets NOT in Special Deals ✅ |
| Multiple flags per product ❌ | Maximum 1 flag per product ✅ |

---

## Key Points

✅ **Frontend already prevents new conflicts** (switches are mutually exclusive)
⏳ **Database still has old conflicting data** (needs cleanup)
🔧 **SQL cleanup is safe** (only updates products with multiple flags)
✔️ **After cleanup, all products will appear in exactly ONE section**

**Run these 4 queries in order (all in Supabase SQL Editor):**
1. Step 2 - Check conflicts (informational)
2. Step 3 - Run cleanup (the fix)
3. Step 4 - Verify fix (confirmation)
4. Step 5 - Test in admin panel (manual verification)
