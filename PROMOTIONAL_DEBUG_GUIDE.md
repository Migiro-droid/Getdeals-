# Promotional Sections Debugging Guide

## Current Database State (Verified ✅)

Based on the database query results:
- **Hot Deals**: 3 products
  - Usafi ProMax (essential)
  - Air Fryer 5L (basket)
  - Weekly Essentials ( Sukuma Wiki) (essential)
  
- **New Arrivals**: 0 products
  
- **Special Deals**: 1 product
  - Baby Bliss (essential)

✅ **No products have multiple promotional flags** (working correctly)

## Why Products Might Appear in All Sections

### Issue: Frontend Cache
The ProductsContext might be caching old product data without the promotional flags.

### Solution: Force Refresh
1. **Hard Refresh the Browser**:
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Or `Cmd + Shift + R` (Mac)
   - This clears the cache and forces fresh data from the database

2. **Check Console Logs**:
   Open browser DevTools (F12) and look for these debug messages:
   ```
   🔍 Product with promotional flags loaded: { name: '...', isHotDeal: true, ... }
   🔍 Hot Deals filtered: [...]
   🔍 New Arrivals filtered: [...]
   🔍 Special Deals filtered: [...]
   ```

3. **Verify Data in Browser**:
   In browser console, type:
   ```javascript
   // Check products context
   window.__PRODUCTS_DEBUG__
   ```

## Testing Steps

1. **Go to Admin Panel** (`/admin/products`)
2. **Edit a product** (e.g., "Usafi ProMax")
3. **Check promotional sections**:
   - ✅ Check "Hot Deals"
   - ❌ Uncheck "New Arrivals"  
   - ❌ Uncheck "Special Deals"
4. **Click Save**
5. **Watch Console Logs** for:
   ```
   🔍 Promotional flags being saved: { isHotDeal: true, isNewArrival: false, isSpecialDeal: false, productName: 'Usafi ProMax' }
   ```
6. **Go to Homepage**
7. **Hard Refresh** (`Ctrl + Shift + R`)
8. **Verify**:
   - Product appears ONLY in "Hot Deals" section
   - Product does NOT appear in other sections

## Expected Console Output

When the page loads, you should see:
```
🔍 Hot Deals filtered: [{name: 'Usafi ProMax', ...}, {name: 'Air Fryer 5L', ...}, ...]
🔍 New Arrivals filtered: []
🔍 Special Deals filtered: [{name: 'Baby Bliss', ...}]
```

## If Still Not Working

### Check RLS Policies
The Supabase Row Level Security might be blocking reads of the promotional columns.

Run this SQL in Supabase SQL Editor:
```sql
-- Check if promotional columns are readable
SELECT id, name, "isHotDeal", "isNewArrival", "isSpecialDeal" 
FROM products 
LIMIT 5;
```

### Verify Column Names
Check if column names match (case-sensitive):
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name LIKE '%Deal%' 
  OR column_name LIKE '%Arrival%';
```

## Quick Fix: Reset Promotional Flags

If you want to start fresh, run this in Supabase SQL Editor:
```sql
-- Reset all promotional flags
UPDATE products 
SET "isHotDeal" = false, 
    "isNewArrival" = false, 
    "isSpecialDeal" = false;

-- Then manually set specific products
UPDATE products 
SET "isHotDeal" = true 
WHERE name = 'Usafi ProMax';

UPDATE products 
SET "isSpecialDeal" = true 
WHERE name = 'Baby Bliss';
```
