# Top Baskets Feature - Next Steps Quick Reference

## Status: ✅ Admin UI Complete

The admin interface for managing Top Baskets is **ready to use**. Products can now be assigned to the "Top Baskets" section via a checkbox in the product editor.

---

## Immediate Action Items (In Priority Order)

### 1️⃣ Execute Database Migration (5 minutes)
**What**: Add `isTopBasket` column to products table

**Steps**:
1. Open Supabase dashboard → SQL Editor
2. Copy and paste content from `MIGRATION_ADD_TOP_BASKETS.sql`
3. Click "Run"
4. Verify: "✓ Success" appears

**Verification**:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'isTopBasket';
```

---

### 2️⃣ Update SupabaseProductService (10 minutes)
**File**: `src/services/SupabaseProductService.ts`

**Changes Required**:

**A) transformSupabaseProduct() method**
```typescript
// Find this method and add isTopBasket to the return object:
isTopBasket: row.isTopBasket || false,
```

**B) transformToSupabaseProduct() method**
```typescript
// Find this method and add isTopBasket to the return object:
isTopBasket: product.isTopBasket === true,
```

**C) Check for any partial update logic**
- If there's a function that handles partial updates, ensure it includes `isTopBasket`

---

### 3️⃣ Update HomePageRedesign (15 minutes)
**File**: `src/pages/HomePageRedesign.tsx`

**Changes Required**:

**A) Add filter for Top Baskets**
Around line ~700, add:
```typescript
// Get products marked for Top Baskets section
const topBaskets = all?.filter(p => (p as any).isTopBasket === true) || [];
```

**B) Update rendering logic**
Find where products are currently being displayed and add Top Baskets section.
Should follow same pattern as Hot Deals/New Arrivals/Special Deals sections.

**C) Update grid layout**
Ensure the grid is `lg:grid-cols-5` (already updated) and displays up to 5 items:
```tsx
{topBaskets.slice(0, 5).map(product => (
  <ProductCard key={product.id} product={product} />
))}
```

---

### 4️⃣ Test Complete Flow (15 minutes)

**Test Steps**:
1. Open Admin Dashboard
2. Create a new product (or edit existing)
3. Check "Top Baskets" checkbox
4. Save product
5. Go to homepage
6. Refresh with Ctrl+Shift+R
7. Verify product appears in Top Baskets section
8. Return to admin, uncheck Top Baskets
9. Save and verify it disappears from section

---

## File Summary

| File | Status | Action |
|------|--------|--------|
| `src/data/products.ts` | ✅ Done | isTopBasket added to interface |
| `src/components/AdminProductManager.tsx` | ✅ Done | UI checkbox added, form handling complete |
| `MIGRATION_ADD_TOP_BASKETS.sql` | ✅ Ready | Execute in Supabase |
| `src/services/SupabaseProductService.ts` | ⏳ Pending | Add transformations |
| `src/pages/HomePageRedesign.tsx` | ⏳ Pending | Add filter and display logic |
| `src/pages/AdminSettings.tsx` | 🔷 Optional | Add section toggle (if desired) |

---

## Common Issues & Solutions

**Q: Checkbox doesn't appear in admin form**
- A: Verify lines 764-777 in AdminProductManager.tsx exist
- Run: `npm run build` to check for errors

**Q: Product appears in Top Baskets immediately after saving**
- A: This is expected. Check that the product has `isTopBasket: true`
- Run: Query database to verify: `SELECT id, name, "isTopBasket" FROM products LIMIT 5`

**Q: Products not appearing in Top Baskets even with checkbox checked**
- A: Database migration not executed OR SupabaseProductService not updated
- Check: Is `isTopBasket` column in database?
- Check: Is HomePageRedesign filtering correctly?

**Q: Checkbox unchecks itself when saving**
- A: Verify ProductFormData type includes isTopBasket
- Check: Form reset function includes isTopBasket: false
- Verify: Edit modal loading function loads isTopBasket value

---

## Code Snippets Ready to Copy

### SupabaseProductService Update
```typescript
// In transformSupabaseProduct method, add:
isTopBasket: row.isTopBasket || false,

// In transformToSupabaseProduct method, add:
isTopBasket: product.isTopBasket === true,
```

### HomePageRedesign Update
```typescript
// Add filter:
const topBaskets = all?.filter(p => (p as any).isTopBasket === true) || [];

// Add display:
{topBaskets.slice(0, 5).map(product => (
  <ProductCard key={product.id} product={product} />
))}
```

---

## Expected Timeline

| Task | Time | Difficulty |
|------|------|-----------|
| Database Migration | 5 min | Easy |
| SupabaseProductService | 10 min | Medium |
| HomePageRedesign | 15 min | Medium |
| Testing | 15 min | Easy |
| **Total** | **~45 min** | **Medium** |

---

## Post-Completion

Once complete, users will be able to:
✅ Assign products to Top Baskets via admin checkbox
✅ See assigned products in Top Baskets section on homepage
✅ Toggle assignment on/off without affecting other product fields
✅ Manage up to 5 Top Basket items

---

**Implementation Status**: ✅ Admin UI Ready | ⏳ Backend Integration Required

For detailed implementation info, see: `TOP_BASKETS_IMPLEMENTATION.md`
