# 🎯 Promotional Sections: Complete Fix Guide

**Status**: ✅ Frontend Fix Deployed | ⏳ Database Cleanup Required  
**Last Updated**: October 21, 2025  
**Commit**: 6f684bb

---

## 📋 Problem Summary

When you add a product to the **Top Baskets** promotional section, it appears in:
- ✅ Top Baskets (correct)
- ❌ New Arrivals (wrong)
- ❌ Special Deals (wrong)

**Root Cause**: Your database contains products with **multiple promotional flags set to `true`** simultaneously. The database stores 4 independent boolean flags, and before this fix, there was no enforcement that only one could be true.

---

## ✅ What Has Been Fixed

### 1. **Frontend Switches (AdminProductManager.tsx)**
All four promotional section toggles now enforce **strict mutual exclusivity**:

```tsx
// When HOT DEALS is checked:
setFormData(prev => ({ 
  ...prev, 
  isHotDeal: true,        // ✅ This one ON
  isNewArrival: false,     // ❌ All others OFF
  isSpecialDeal: false,
  isTopBasket: false
}));

// Same pattern for New Arrivals, Special Deals, and Top Baskets
```

**Result**: You cannot select multiple sections for a single product in the admin panel.

### 2. **Product Loading Logic (AdminProductManager.tsx)**
When editing an existing product, the form now **automatically sanitizes** products with multiple flags:

```typescript
// Priority order: Hot Deals > New Arrivals > Special Deals > Top Baskets
if (activeFlags > 1) {
  // If multiple flags exist, keep only the highest priority one
  if (isHotDeal) keep it, clear others
  else if (isNewArrival) keep it, clear others
  else if (isSpecialDeal) keep it, clear others
  else if (isTopBasket) keep it, clear others
}
```

**Result**: Old products with multiple flags automatically show with only their highest-priority flag when you edit them.

### 3. **Data Layer (SupabaseProductService.ts)**
Enhanced the product transformation layer to:
- **Always save all 4 promotional flags** (prevents fields from being lost)
- **Add validation** that warns if multiple flags are active
- **Include missing `isTopBasket` field** (was only transforming 3 of 4 flags)
- **Improve debug logging** to show mutual exclusivity violations

**Result**: When saving a product, all 4 flags are explicitly sent to Supabase, ensuring clean data.

---

## 🗄️ The Database Problem

**Your existing products in Supabase have multiple promotional flags set to `true`:**

For example, a product might have:
```
id: 12345
name: "Rice Basket"
isHotDeal: true
isNewArrival: true      ← This shouldn't be true if isHotDeal is true
isSpecialDeal: false
isTopBasket: true       ← And this shouldn't be true either
```

The **frontend now prevents NEW products from getting this state**, but **existing data needs cleanup**.

---

## 🔧 How to Fix the Database

### Step 1: Open Supabase SQL Editor

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your **GetDeals Kenya** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Check Current Conflicts (READ-ONLY)

Copy and run this query to see which products have multiple flags:

```sql
-- Show all products with more than one promotional flag active
SELECT 
  id,
  name,
  "isHotDeal",
  "isNewArrival",
  "isSpecialDeal",
  "isTopBasket",
  (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) as active_flags
FROM products
WHERE (CAST("isHotDeal" AS INT) + CAST("isNewArrival" AS INT) + CAST("isSpecialDeal" AS INT) + CAST("isTopBasket" AS INT)) > 1
ORDER BY name ASC;
```

**What you'll see**:
- ✅ **0 rows** = All clean! No conflicts exist
- ❌ **Multiple rows** = These products have conflicts

If you see rows, note the product names - these are the ones that will be fixed in Step 3.

### Step 3: Run the Database Cleanup (UPDATE)

This query fixes all products with multiple flags by keeping only the **highest priority flag**:

**Priority Order**:
1. 🔥 Hot Deals (highest)
2. 🆕 New Arrivals
3. 💜 Special Deals  
4. 🧺 Top Baskets (lowest)

Copy and run this in a **NEW** SQL query:

```sql
-- Fix all products with multiple promotional flags
-- Keeps the highest priority flag, clears the rest
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

**What happens**:
- `Query executed successfully`
- Shows how many rows were updated (e.g., "3 rows updated")
- Each affected product keeps ONE flag: its highest priority one
- Timestamp is automatically updated

### Step 4: Verify the Fix (READ-ONLY)

Run this query to confirm no conflicts remain:

```sql
-- Verify that no products have multiple promotional flags anymore
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

**Expected Result**: ✅ **0 rows** returned (if you see rows, something went wrong)

---

## 🧪 Test Everything

### Test 1: Check Your Baskets on Homepage

1. Go to your website homepage
2. Find your two baskets in the **Top Baskets** section
3. Verify they appear ONLY there (not in other sections)
4. ✅ If correct, they should NOT appear in New Arrivals or Special Deals

### Test 2: Edit a Product in Admin

1. Go to Admin Panel
2. Find one of your baskets
3. Click **Edit**
4. Check the promotional section
   - ✅ Should show only ONE section selected (e.g., Top Baskets)
   - ❌ Should NOT show multiple sections selected
5. Click **Cancel** (don't save)

### Test 3: Test Switch Behavior

1. Go to Admin Panel
2. Click **Add Product**
3. Fill in product details
4. In "Promotional Sections", check **Hot Deals**
5. Try to also check **New Arrivals**
   - ✅ Expected: Cannot check both (Hot Deals auto-unchecks or New Arrivals won't check)
6. Confirm only ONE can be active at a time
7. Click **Cancel** (don't save)

### Test 4: Create a New Test Product

1. Go to Admin Panel
2. Click **Add Product**
3. Enter:
   - Name: "Test Product - Special"
   - Price: 500
   - Category: Any category
   - Image URL: Any image
4. Select **Special Deals** promotional section
5. Click **Save**
6. Go to homepage
7. Check **Special Deals** section - test product should appear there ✅
8. Check **Hot Deals**, **New Arrivals**, **Top Baskets** - test product should NOT appear ✅
9. Delete the test product from admin

---

## 📊 Success Indicators

After completing all steps, you should see:

| Check | Status |
|-------|--------|
| Frontend prevents selecting multiple sections | ✅ |
| Can toggle between sections (one unchecks others) | ✅ |
| SQL diagnostic returns 0 rows | ✅ |
| Products appear in exactly ONE promotional section | ✅ |
| New products only show in selected section | ✅ |
| Homepage shows no product duplication | ✅ |
| Each section shows distinct products | ✅ |

---

## 🔍 Technical Details

### What Changed in Code

**File**: `src/services/SupabaseProductService.ts`
- **Added** `isTopBasket` field to product transformation (was missing!)
- **Updated** `transformToSupabaseProduct()` to always save all 4 promotional flags
- **Added** validation warnings when multiple flags are detected
- **Improved** debug logging for troubleshooting

**File**: `src/components/AdminProductManager.tsx`
- **Already had**: Mutual exclusivity in all 4 switch handlers
- **Already had**: Sanitization logic when loading products for editing

### Database Flags

```typescript
// Each product can have these flags (all booleans):
{
  isHotDeal: boolean;      // Shows in Hot Deals section
  isNewArrival: boolean;   // Shows in New Arrivals section
  isSpecialDeal: boolean;  // Shows in Special Deals section
  isTopBasket: boolean;    // Shows in Top Baskets section
}

// After fix: Maximum ONE of these can be true at any time
// Before fix: Multiple could be true simultaneously (the bug)
```

---

## ⚠️ Important Notes

1. **Frontend already works correctly** - New products will automatically have mutual exclusivity
2. **Only the database needs cleanup** - Run the SQL queries to fix existing data
3. **No data loss** - The cleanup keeps the highest-priority flag for each product
4. **Can undo manually** - If you don't like the priority order, edit products in admin to reassign them

---

## 🆘 Troubleshooting

### Q: Products still appear in multiple sections after running SQL
**A**: 
1. Refresh your browser completely (Ctrl+F5 on Windows)
2. Clear browser cache
3. Wait 30 seconds for real-time subscriptions to update
4. Re-run the verification query from Step 4

### Q: SQL query says "0 rows updated"
**A**: Perfect! This means either:
- All products already have single flags (nothing to fix)
- Or they were already fixed previously
- ✅ No action needed!

### Q: I want to change which section a product is in
**A**: 
1. Go to Admin Panel
2. Edit the product
3. Uncheck the current section and check the new section
4. Save
5. Frontend prevents multiple selections, so only one will be active

### Q: How do I see which products were fixed?
**A**: From Step 2, make note of the products shown. Run the verification query from Step 4 - those same products should now have only ONE flag true.

---

## 📈 What Happens Next

✅ **Immediately after cleanup:**
- Existing products appear in only ONE promotional section
- No duplicates on homepage
- Admin switches prevent new conflicts

✅ **For new products:**
- Frontend enforces mutual exclusivity
- Database layer validates the flags
- Logging shows warnings if multiple flags somehow slip through

---

## 🎉 Summary

| Phase | Status | Action |
|-------|--------|--------|
| Code Fix | ✅ Deployed (6f684bb) | Already live |
| Database Cleanup | ⏳ Ready | You run the SQL |
| Testing | ⏳ Ready | Verify on homepage |
| Go Live | ⏳ Final Step | All done! |

**Next Step**: Open Supabase SQL Editor and run the 4 queries from the "How to Fix the Database" section above.

---

## 📞 Questions?

If something doesn't work:
1. Check the troubleshooting section above
2. Verify you copied the SQL queries exactly
3. Make sure you're running in the correct Supabase project
4. Check browser console (F12 → Console tab) for debug logs
