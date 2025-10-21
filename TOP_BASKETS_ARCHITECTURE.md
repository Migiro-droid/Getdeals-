# Top Baskets Feature Architecture Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            ADMIN WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: ADMIN OPENS PRODUCT EDITOR
┌──────────────────────────┐
│  Admin Dashboard         │
│  → Products              │
│  → [Create/Edit]         │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│  AdminProductManager Component Loads            │
│  ├─ Form initialized                             │
│  └─ isTopBasket: false (default)                │
└──────────────────────────────────────────────────┘


STEP 2: ADMIN FILLS FORM
┌──────────────────────────────────────────────────┐
│  Product Form                                    │
│  ├─ Name: "Premium Basket"                      │
│  ├─ Price: 5000 KES                             │
│  ├─ Category: "Baskets"                         │
│  └─ Image URL: "..."                            │
└──────────────────────────────────────────────────┘


STEP 3: ADMIN ASSIGNS TO TOP BASKETS ✓ NEW
┌──────────────────────────────────────────────────┐
│  Promotional Tags Section (Admin UI)            │
│  ┌────────────────────────────────────────────┐ │
│  │ [●] Hot Deals                              │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │ [●] New Arrivals                           │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │ [●] Special Deals                          │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │ ◄─ NEW!
│  │ [●] Top Baskets    ◄─── ADMIN CLICKS HERE │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
            │
            ▼ (Form State Updated)
┌──────────────────────────────────────────────────┐
│  formData.isTopBasket = true                    │
└──────────────────────────────────────────────────┘


STEP 4: ADMIN CLICKS SAVE
┌──────────────────────────────────────────────────┐
│  Admin clicks [Save Product] button              │
│                                                  │
│  ProductFormData = {                            │
│    name: "Premium Basket",                      │
│    price: 5000,                                 │
│    ...                                          │
│    isTopBasket: true  ◄─── KEY VALUE           │
│  }                                              │
└──────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│  Form Validation                                │
│  ├─ Check required fields ✓                    │
│  ├─ Validate types ✓                           │
│  └─ isTopBasket is boolean ✓                   │
└──────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│  Save to Database                              │
│  via SupabaseProductService                    │
└──────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                 │
└─────────────────────────────────────────────────────────────────────────┘

STEP 5: DATABASE STORES DATA ✓ NEEDS MIGRATION
┌──────────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ products TABLE                                             │ │
│  ├──────────┬────────┬────────┬──────────┬──────────────────┤ │
│  │ id       │ name   │ price  │ category │ isTopBasket      │ │
│  ├──────────┼────────┼────────┼──────────┼──────────────────┤ │
│  │ 123      │Premium │ 5000   │ Baskets  │ TRUE  ◄─ NEW! │ │
│  │ 124      │ Budget │ 2000   │ Baskets  │ FALSE          │ │
│  │ 125      │ Deluxe │ 8000   │ Baskets  │ TRUE  ◄─ NEW! │ │
│  └──────────┴────────┴────────┴──────────┴──────────────────┘ │
│                                                                 │
│  Migration Required: ✓ MIGRATION_ADD_TOP_BASKETS.sql          │
│  ├─ ALTER TABLE products ADD COLUMN isTopBasket...            │
│  └─ CREATE INDEX on isTopBasket                               │
└──────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                  │
└─────────────────────────────────────────────────────────────────────────┘

STEP 6: SERVICE TRANSFORMS DATA ✓ NEEDS UPDATE
┌──────────────────────────────────────────────────────────────────┐
│  SupabaseProductService.ts                                       │
│                                                                  │
│  transformSupabaseProduct(row)                                   │
│  ├─ Takes database row                                          │
│  ├─ Adds: isTopBasket: row.isTopBasket || false  ◄─ UPDATE!   │
│  └─ Returns: Product object                                    │
│                                                                  │
│  transformToSupabaseProduct(product)                            │
│  ├─ Takes Product object                                        │
│  ├─ Adds: isTopBasket: product.isTopBasket === true ◄─UPDATE! │
│  └─ Returns: Database format                                   │
└──────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                                   │
└─────────────────────────────────────────────────────────────────────────┘

STEP 7: HOMEPAGE DISPLAYS TOP BASKETS ✓ NEEDS UPDATE
┌──────────────────────────────────────────────────────────────────┐
│  HomePageRedesign.tsx                                            │
│                                                                  │
│  1. Fetch all products                                          │
│     all = [Product[], Product[], ...]                          │
│                                                                  │
│  2. Filter for Top Baskets ◄─ UPDATE NEEDED!                  │
│     topBaskets = all.filter(p => p.isTopBasket === true)      │
│     Result: [Premium Basket, Deluxe Basket]                   │
│                                                                  │
│  3. Display in section                                         │
│     Show top 5 products                                        │
│     Grid: lg:grid-cols-5 (already updated)                   │
└──────────────────────────────────────────────────────────────────┘
            │
            ▼

STEP 8: USER SEES TOP BASKETS ON HOMEPAGE
┌─────────────────────────────────────────────────────────────────┐
│                      🌐 HOMEPAGE                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Top Baskets                                    ◄─ NEW!   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  [Image] Premium   [Image] Deluxe    [Image] Budget      │ │
│  │  5000 KES         8000 KES           2000 KES           │ │
│  │  [Add to Cart]    [Add to Cart]      [Add to Cart]      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── AdminDashboard
│   └── AdminProductManager ◄─── MODIFIED
│       ├── ProductForm
│       │   ├── Basic Fields
│       │   │   ├── Name Input
│       │   │   ├── Description Input
│       │   │   └── Price Input
│       │   │
│       │   ├── Promotional Tags ◄─── NEW SECTION!
│       │   │   ├── Hot Deals Checkbox
│       │   │   ├── New Arrivals Checkbox
│       │   │   ├── Special Deals Checkbox
│       │   │   └── Top Baskets Checkbox ◄─── NEW!
│       │   │
│       │   └── Image Management
│       │       └── Image URL Input
│       │
│       └── Form Actions
│           ├── [Save] Button
│           └── [Cancel] Button
│
└── HomePage
    └── HomePageRedesign ◄─── NEEDS UPDATE
        ├── Hero Section
        ├── Hot Deals Section
        ├── New Arrivals Section
        ├── Special Deals Section
        └── Top Baskets Section ◄─── NEW!
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  ADMIN UI (React)                       │
│                                                         │
│  formData                                              │
│  ├─ name: string                                       │
│  ├─ price: number                                      │
│  ├─ isHotDeal: boolean                                │
│  ├─ isNewArrival: boolean                             │
│  ├─ isSpecialDeal: boolean                            │
│  └─ isTopBasket: boolean ◄─── NEW                    │
└────────────────┬──────────────────────────────────────┘
                 │ (Save)
                 ▼
┌─────────────────────────────────────────────────────────┐
│         SupabaseProductService                          │
│                                                         │
│  transformToSupabaseProduct({                          │
│    ...                                                 │
│    isTopBasket: true ◄─── NEW                        │
│  })                                                    │
└────────────────┬──────────────────────────────────────┘
                 │ (POST/UPDATE)
                 ▼
┌─────────────────────────────────────────────────────────┐
│         Supabase API                                    │
│                                                         │
│  POST /products or                                     │
│  PUT /products/:id                                     │
└────────────────┬──────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│      PostgreSQL Database                               │
│                                                         │
│  INSERT/UPDATE products SET isTopBasket = true        │
└────────────────┬──────────────────────────────────────┘
                 │ (SELECT)
                 ▼
┌─────────────────────────────────────────────────────────┐
│      Data Retrieval (Homepage)                          │
│                                                         │
│  SELECT * FROM products                               │
│  WHERE isTopBasket = true                             │
│  LIMIT 5                                              │
└────────────────┬──────────────────────────────────────┘
                 │ (Transform)
                 ▼
┌─────────────────────────────────────────────────────────┐
│      SupabaseProductService                            │
│                                                         │
│  transformSupabaseProduct({                           │
│    ...                                                 │
│    isTopBasket: true ◄─── NEW                        │
│  })                                                    │
└────────────────┬──────────────────────────────────────┘
                 │ (Type: Product[])
                 ▼
┌─────────────────────────────────────────────────────────┐
│      HomePageRedesign (React)                          │
│                                                         │
│  const topBaskets = products.filter(               │
│    p => p.isTopBasket === true                    │
│  )                                                    │
│                                                     │
│  Render: {topBaskets.map(p => <Card>{p}</Card>)} │
└────────────────┬──────────────────────────────────────┘
                 │ (Display)
                 ▼
┌─────────────────────────────────────────────────────────┐
│      User Browser (Homepage)                            │
│                                                         │
│  ╔═════════════════════════════════════════════╗     │
│  ║  Top Baskets Section                        ║     │
│  ├─────────────────────────────────────────────┤     │
│  ║  [Product1]  [Product2]  [Product3]  ...  ║     │
│  ╚═════════════════════════════════════════════╝     │
└─────────────────────────────────────────────────────────┘
```

---

## Color System

```
┌─────────────────────────────────────────────────────────┐
│        PROMOTIONAL SECTIONS COLOR SCHEME                │
└─────────────────────────────────────────────────────────┘

Hot Deals (Blue)
├─ Container: bg-blue-50
├─ Border: border-blue-200
├─ Label: text-blue-900
├─ Description: text-blue-700
└─ Section Badge: Blue

New Arrivals (Green)
├─ Container: bg-green-50
├─ Border: border-green-200
├─ Label: text-green-900
├─ Description: text-green-700
└─ Section Badge: Green

Special Deals (Purple)
├─ Container: bg-purple-50
├─ Border: border-purple-200
├─ Label: text-purple-900
├─ Description: text-purple-700
└─ Section Badge: Purple

Top Baskets (Amber) ◄─── NEW!
├─ Container: bg-amber-50
├─ Border: border-amber-200
├─ Label: text-amber-900
├─ Description: text-amber-700
└─ Section Badge: Amber
```

---

## Implementation Phases

```
┌────────────────────────────────────────────────────────────────┐
│                     PHASE 1: ADMIN UI                          │
│                         ✅ COMPLETE                            │
└────────────────────────────────────────────────────────────────┘
├─ Add isTopBasket to Product interface
├─ Add checkbox to AdminProductManager
├─ Update form state management
├─ Add color scheme (Amber)
└─ Result: Checkbox appears in admin form


┌────────────────────────────────────────────────────────────────┐
│                  PHASE 2: DATABASE LAYER                       │
│                       ⏳ PENDING (5 min)                       │
└────────────────────────────────────────────────────────────────┘
├─ Execute migration: ADD COLUMN isTopBasket
├─ Create index for performance
├─ Verify column in database
└─ Result: Data can be persisted


┌────────────────────────────────────────────────────────────────┐
│                   PHASE 3: SERVICE LAYER                       │
│                       ⏳ PENDING (10 min)                      │
└────────────────────────────────────────────────────────────────┘
├─ Update transformSupabaseProduct()
├─ Update transformToSupabaseProduct()
├─ Handle undefined → false conversion
└─ Result: Data transforms correctly


┌────────────────────────────────────────────────────────────────┐
│                  PHASE 4: HOMEPAGE DISPLAY                     │
│                       ⏳ PENDING (15 min)                      │
└────────────────────────────────────────────────────────────────┘
├─ Add filter: isTopBasket === true
├─ Add display section to homepage
├─ Use grid layout: lg:grid-cols-5
├─ Show up to 5 products
└─ Result: Top Baskets section visible on homepage


┌────────────────────────────────────────────────────────────────┐
│                    PHASE 5: TESTING                            │
│                       ⏳ PENDING (15 min)                      │
└────────────────────────────────────────────────────────────────┘
├─ Create test product
├─ Check Top Baskets checkbox
├─ Save and verify in database
├─ Verify appears on homepage
├─ Toggle and verify update
└─ Result: Feature fully functional


┌────────────────────────────────────────────────────────────────┐
│                    PHASE 6: DEPLOY                             │
│                       ⏳ PENDING (5 min)                       │
└────────────────────────────────────────────────────────────────┘
├─ Run build: npm run build
├─ Deploy to production
├─ Verify in production
└─ Result: Feature live for all users
```

---

## Status Summary

```
┌──────────────────────────────────────────────────────────┐
│  IMPLEMENTATION STATUS                                   │
├──────────────────────────────────────────────────────────┤
│  Admin UI Component        ✅ COMPLETE                   │
│  Type Safety              ✅ COMPLETE                   │
│  Form Handling            ✅ COMPLETE                   │
│  Checkbox UI              ✅ COMPLETE                   │
│                                                          │
│  Database Column          ⏳ MIGRATION READY            │
│  Service Transformations  ⏳ READY TO CODE              │
│  Homepage Display         ⏳ READY TO CODE              │
│  End-to-End Testing       ⏳ READY TO TEST              │
│                                                          │
│  Overall Progress         ✅ 28% (Admin UI)            │
│                           ⏳ 72% (Integration)          │
└──────────────────────────────────────────────────────────┘
```

---

## Next Steps Flow

```
NOW: Admin UI Ready
  ↓
  1. Open Supabase → SQL Editor
  2. Run MIGRATION_ADD_TOP_BASKETS.sql
  3. Update SupabaseProductService (2 functions)
  4. Update HomePageRedesign (Add filter + display)
  5. Test: Create product → Check Top Baskets → Verify on homepage
  6. Deploy
  ↓
DONE: Feature complete and live!
```

---

**Current Status**: ✅ Phase 1 Complete | ⏳ Phases 2-6 Pending
**Estimated Time**: ~45 minutes to completion
**Complexity**: Medium (straightforward integration)
**Risk Level**: Low (no breaking changes)
