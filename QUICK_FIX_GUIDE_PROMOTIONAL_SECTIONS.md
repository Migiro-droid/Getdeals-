# 🎯 Quick Start: Fix Your Promotional Sections

**Status**: Code fix deployed ✅ | Database cleanup required ⏳  
**What's Done**: Frontend automatically prevents new conflicts  
**What's Next**: Run SQL to clean up existing products with multiple flags

---

## 🚀 Quick Summary

Your two baskets are appearing in multiple sections because the **database has multiple promotional flags set to true** for the same product.

**The fix has two parts:**
1. ✅ **Frontend (DONE)**: AdminProductManager now sanitizes data when editing - keeps highest priority flag
2. ⏳ **Database (YOU DO THIS)**: Run SQL query to clean up existing products

---

## 📝 Part 1: Verify the Frontend Fix is Working

### Test: Create a New Product
1. Go to your Admin Panel
2. Click "Add Product"
3. Fill in product details
4. Scroll to "Promotional Sections"
5. Check "Top Baskets"
6. Try to also check "New Arrivals"
   - ✅ **Expected**: New Arrivals should not be checkable (or auto-uncheck Top Baskets)
7. Save product
8. Go to homepage
9. Check Top Baskets section
10. **Verify**: Product appears ONLY in Top Baskets, not in any other section

✅ If this works, the frontend fix is good!

---

## 🗄️ Part 2: Clean Up Existing Products in Database

**This is a ONE-TIME action to fix the existing products with multiple promotional flags.**

### Step 1: Go to Supabase
1. Visit [app.supabase.com](https://app.supabase.com)
2. Log in to your account
3. Select your GetDeals Kenya project
4. Click **SQL Editor** in the left sidebar
5. Click **New Query** (top-right)

### Step 2: Run Diagnostic (See Current Conflicts) ⚠️ READ-ONLY ✅
Copy this entire query and paste it into the SQL Editor:

```sql
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

Click **Run** (or Ctrl+Enter)

**What to look for**:
- If no rows returned: ✅ Great! No conflicts exist, skip to Step 4
- If rows returned: Show you products with multiple flags like:
  ```
  id              | name      | isHotDeal | isNewArrival | isSpecialDeal | isTopBasket
  uuid-123-...    | Basket A  | true      | true         | false         | true
  uuid-456-...    | Basket B  | false     | true         | true          | false
  ```
  These need cleanup (next step)

### Step 3: Run the Cleanup (FIX CONFLICTS) ⚠️ UPDATE STATEMENT
Copy this entire query and paste it into a NEW SQL Editor tab:

```sql
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

Click **Run** (or Ctrl+Enter)

**What to expect**:
- Message: "Query executed successfully" ✅
- Shows number of rows updated (e.g., "3 rows updated")
- This fixes all products with multiple flags

**What this does**:
- Finds products with more than 1 promotional flag active
- Keeps the HIGHEST PRIORITY flag (Hot Deals > New Arrivals > Special Deals > Top Baskets)
- Clears all other flags
- Updates timestamp

### Step 4: Verify Cleanup (Check No Conflicts Remain) ⚠️ READ-ONLY ✅
Copy this query and paste it into a NEW SQL Editor tab:

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

Click **Run**

**Expected Result**:
- ✅ **0 rows** = SUCCESS! All conflicts resolved
- ❌ **Any rows** = Something went wrong, try again or contact support

---

## 🧪 Part 3: Test Everything

### Test 1: View Your Baskets
1. Go to your website homepage
2. Scroll to **Top Baskets** section
3. Find your two baskets
4. **Verify**: They appear ONLY here, not in New Arrivals or Special Deals ✅

### Test 2: Check Homepage Sections
1. Check **Hot Deals** section - products should show ONLY there
2. Check **New Arrivals** section - products should show ONLY there
3. Check **Special Deals** section - products should show ONLY there
4. Check **Top Baskets** section - products should show ONLY there
5. **Verify**: NO product appears in more than one section ✅

### Test 3: Edit Your Baskets in Admin
1. Go to Admin Panel
2. Find your first basket
3. Click **Edit**
4. Check the promotional section - only ONE should be checked ✅
5. Try checking a different section (e.g., "New Arrivals")
6. **Verify**: "Top Baskets" automatically unchecks ✅
7. Click **Cancel** (don't save)

### Test 4: Create a New Product
1. Go to Admin Panel
2. Click **Add Product**
3. Fill in details
4. Under "Promotional Sections", check "Special Deals"
5. Try to also check "Hot Deals"
6. **Verify**: Can't check both at same time (one unchecks the other) ✅
7. Save the product
8. Go to homepage
9. Check "Special Deals" section - new product should appear there ✅
10. Check other sections - new product should NOT appear ✅

---

## ✅ Success Indicators

After completing all steps, you should see:

| Indicator | Status |
|-----------|--------|
| Product appears in only ONE promotional section | ✅ |
| Cannot check multiple promotional toggles at once | ✅ |
| Switching sections auto-deselects previous one | ✅ |
| Database cleanup query returns 0 rows | ✅ |
| Creating new products prevents overlaps | ✅ |
| Homepage shows no product duplication | ✅ |

---

## 🆘 Troubleshooting

### Q: Product STILL appears in multiple sections after cleanup
**A**: 
1. Refresh your browser (Ctrl+F5 to clear cache)
2. Go back to SQL diagnostic and check if conflicts still exist
3. May need to refresh the page/app to see changes

### Q: The cleanup query says "0 rows updated"
**A**: ✅ Good news! This means either:
- All products already have single flags (no conflicts)
- Or you already ran cleanup successfully
- No action needed!

### Q: How do I know if the fix worked?
**A**: Run the diagnostic query from Step 2. If it returns 0 rows, you're done! ✅

### Q: Can I undo the cleanup?
**A**: You can use Git to revert, but a simpler approach:
- Edit each product in admin panel
- Reassign to correct section
- The frontend now prevents conflicts anyway

### Q: One of my products has flags I want to keep
**A**: No problem:
1. Decide which flag you want to keep (Hot Deals, New Arrivals, Special Deals, or Top Baskets)
2. Edit product in admin panel
3. Uncheck all other flags, keep only the one you want
4. Save
5. Frontend will prevent conflicts going forward

---

## 📊 What Changed

### In Your Code
- `src/components/AdminProductManager.tsx`: 
  - Added smart data sanitization when editing products
  - Now automatically keeps highest priority flag if multiple exist
  - Frontend switches prevent new conflicts

### In Your Database
- Products with multiple promotional flags → cleaned to have only 1 flag
- Uses priority: Hot Deals > New Arrivals > Special Deals > Top Baskets

### Result
✅ Each product in exactly ONE promotional section  
✅ No duplication on homepage  
✅ Admin panel prevents future conflicts  

---

## 🎯 Next Steps

1. ✅ Create new test product → verify it appears in only 1 section
2. ⏳ Run SQL diagnostic → see which products have conflicts
3. ⏳ Run SQL cleanup → fix all conflicts
4. ⏳ Run SQL verification → confirm no conflicts remain
5. ✅ Test all sections on homepage → verify no duplication
6. 🎉 Done! Your promotional sections are fixed

**Estimated Time**: 10 minutes total

---

## 💡 Need Help?

If anything goes wrong:
1. Check the detailed guide: `PROMOTIONAL_SECTION_COMPLETE_FIX.md`
2. Database cleanup scripts: `PROMOTIONAL_SECTION_CLEANUP_CORRECTED.sql`
3. Column name reference: `SQL_COLUMN_CASING_FIX.md`

All files are in your project root directory.
