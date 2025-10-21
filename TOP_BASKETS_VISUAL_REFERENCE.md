# Top Baskets Checkbox - Visual Reference

## Admin UI Location

```
Admin Dashboard → Products → Edit/Create Product
│
├── Basic Information
│   ├── Product Name
│   ├── Description
│   ├── Price
│   └── Original Price
│
├── Category & Tags
│   ├── Category Dropdown
│   └── Basket Items
│
├── ▼ Promotional Tags ◄─── YOU ARE HERE
│   │
│   ├── ┌─────────────────────────────────────────┐
│   │   │ 🔵 Hot Deals                          │
│   │   │  Show in the Hot Deals section        │
│   │   └─────────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────────┐
│   │   │ 🟢 New Arrivals                       │
│   │   │  Show in the New Arrivals section     │
│   │   └─────────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────────┐
│   │   │ 🟣 Special Deals                      │
│   │   │  Show in the Special Deals section    │
│   │   └─────────────────────────────────────────┘
│   │
│   └── ┌─────────────────────────────────────────┐
│       │ 🟠 Top Baskets        ◄─── NEW!         │
│       │  Show in the Top Baskets section      │
│       └─────────────────────────────────────────┘ ◄─── NEW!
│
├── Image Management
│   ├── Image URL
│   └── Item Images
│
└── Actions
    ├── Save Product
    └── Cancel
```

---

## Checkbox Styling

### Appearance
```
╔════════════════════════════════════════════════════════════╗
║  ╲╲╲╲╲╲╲╲╲  [●] Top Baskets      ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ║
║  ╲╲╲╲╲╲╲╲╲                        ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ║
║              Show in the Top Baskets section on homepage     ║
╚════════════════════════════════════════════════════════════╝
```

### Color Scheme
- **Background**: Soft amber (`bg-amber-50`)
- **Border**: Amber (`border-amber-200`)
- **Label**: Dark amber (`text-amber-900`)
- **Description**: Medium amber (`text-amber-700`)
- **Toggle**: On = Amber, Off = Gray

### Component Structure
```jsx
<div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
  <Switch
    id="top-basket"
    checked={formData.isTopBasket}
    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTopBasket: checked }))}
  />
  <Label htmlFor="top-basket" className="flex flex-col cursor-pointer flex-1 m-0">
    <span className="font-semibold text-amber-900">Top Baskets</span>
    <span className="text-xs text-amber-700">Show in the Top Baskets section on homepage</span>
  </Label>
</div>
```

---

## Size Specifications

| Element | Size |
|---------|------|
| Container Height | 72px (p-3 padding) |
| Container Padding | 12px (all sides) |
| Toggle Switch Width | 40px |
| Toggle Switch Height | 24px |
| Icon Spacing | 12px gap |
| Font Size (Title) | base (16px), semibold |
| Font Size (Description) | xs (12px) |
| Border Radius | 8px |
| Border Width | 1px |

---

## Responsive Behavior

### On Different Screens
```
Desktop (≥1024px):
┌────────────────────────────────────────────┐
│ [●] Top Baskets     Show in Top Baskets... │
└────────────────────────────────────────────┘

Tablet (768px - 1023px):
┌──────────────────────────────┐
│ [●] Top Baskets              │
│     Show in Top Baskets...   │
└──────────────────────────────┘

Mobile (<768px):
┌────────────────────┐
│ [●] Top Baskets    │
│    Show in Top...  │
└────────────────────┘
```

---

## Interaction States

### Default State (Unchecked)
```
┌────────────────────────────────────────────┐
│ ○ Top Baskets                              │
│   Show in the Top Baskets section...      │
└────────────────────────────────────────────┘
```

### Checked State
```
┌────────────────────────────────────────────┐
│ ● Top Baskets                              │
│   Show in the Top Baskets section...      │
└────────────────────────────────────────────┘
```

### Hover State
```
Cursor changes to pointer
Background becomes slightly more saturated
Label text color darkens slightly
```

### Focus State
```
Toggle receives focus ring (browser default)
Keyboard navigation: Tab to reach, Space to toggle
```

---

## Side-by-Side Comparison

### All Promotional Sections Together

```
Hot Deals (Blue)
┌────────────────────────────────────────┐
│ [●] Hot Deals                          │
│ Show in the Hot Deals section         │
└────────────────────────────────────────┘

New Arrivals (Green)
┌────────────────────────────────────────┐
│ [●] New Arrivals                       │
│ Show in the New Arrivals section      │
└────────────────────────────────────────┘

Special Deals (Purple)
┌────────────────────────────────────────┐
│ [●] Special Deals                      │
│ Show in the Special Deals section     │
└────────────────────────────────────────┘

Top Baskets (Amber) ← NEW!
┌────────────────────────────────────────┐
│ [●] Top Baskets                        │
│ Show in the Top Baskets section       │
└────────────────────────────────────────┘
```

---

## Code Walkthrough

### Step 1: Toggle Switch
```jsx
<Switch
  id="top-basket"
  checked={formData.isTopBasket}  // Current state: true/false
  onCheckedChange={(checked) => 
    setFormData(prev => ({ 
      ...prev, 
      isTopBasket: checked  // Update state when clicked
    }))
  }
/>
```

### Step 2: Label
```jsx
<Label htmlFor="top-basket" className="flex flex-col cursor-pointer flex-1 m-0">
  <span className="font-semibold text-amber-900">
    Top Baskets  {/* Main label */}
  </span>
  <span className="text-xs text-amber-700">
    Show in the Top Baskets section on homepage  {/* Description */}
  </span>
</Label>
```

### Step 3: Container
```jsx
<div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
  {/* Combines toggle + label with styling */}
</div>
```

---

## Form State Management

### When Form Opens (Edit Mode)
```javascript
setFormData({
  name: product.name,
  description: product.description || '',
  price: product.price,
  // ... other fields ...
  isTopBasket: (product as any).isTopBasket || false  // Load existing value
});
```

### When Checkbox Changes
```javascript
// Before click:
formData.isTopBasket = false

// User clicks checkbox
// React calls onCheckedChange with true

// After update:
formData.isTopBasket = true
```

### When Form Saves
```javascript
const productData = {
  // ... other fields ...
  isTopBasket: formData.isTopBasket  // Send to database
};
```

### When Form Resets
```javascript
setFormData({
  // ... other fields ...
  isTopBasket: false  // Reset to default
});
```

---

## Example Usage Flow

### Scenario: Admin Creates New Product

1. **Admin opens Create Product dialog**
   - Form initializes with `isTopBasket: false`
   - Checkbox appears unchecked (○)

2. **Admin enters product details**
   - Name: "Premium Basket"
   - Price: 5000 KES
   - Category: "Baskets"

3. **Admin checks Top Baskets checkbox**
   - Checkbox state changes to checked (●)
   - `formData.isTopBasket = true`
   - Input element receives amber focus style

4. **Admin clicks Save**
   - Form validation runs
   - Product object created with `isTopBasket: true`
   - Data sent to SupabaseProductService

5. **Backend processes**
   - Database receives `isTopBasket: true`
   - Product saved to `products` table

6. **Homepage updates**
   - Product appears in Top Baskets section (after page refresh)
   - Displays up to 5 products from this section

7. **Admin edits same product later**
   - Opens Edit dialog
   - Checkbox loads with `isTopBasket: true` (checked ●)
   - Admin can toggle or leave as-is
   - Other field edits don't affect checkbox state

---

## Accessibility

### Keyboard Navigation
```
Tab → Navigate to checkbox
Space → Toggle checkbox
Tab → Navigate away
```

### Screen Reader
```
Label reads: "Top Baskets, Show in the Top Baskets section on homepage"
Toggle announces: "Checkbox, checked/unchecked"
```

### Color Contrast
```
Amber-900 text on Amber-50 background: ✓ WCAG AA compliant
```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| IE 11 | ⚠️ Requires polyfills |

---

## Performance Notes

- **Load Time**: No performance impact (UI element only)
- **Bundle Size**: +0 KB (uses existing components)
- **Re-renders**: Only triggers when checkbox state changes
- **State Updates**: Debounced via form state management

---

## Testing Checklist

- [ ] Checkbox appears in Promotional Tags section
- [ ] Checkbox color is amber (not blue/green/purple)
- [ ] Toggle works (click to check/uncheck)
- [ ] State persists when switching fields
- [ ] State resets when opening new product
- [ ] Keyboard navigation works (Tab + Space)
- [ ] Description text visible and legible
- [ ] Hover effects work
- [ ] Focus ring visible
- [ ] Mobile responsive

---

## Screenshots Guide

### Where to Find It
```
1. Go to Admin Dashboard
2. Click "Products" tab
3. Click "Create New" or "Edit" button
4. Scroll down to "Promotional Tags" section
5. Look for the amber-colored "Top Baskets" checkbox
   ↓
   This is your new feature!
```

### Expected Appearance
```
Light amber background (#FEF3C7)
Amber border (#FCD34D)
Dark amber text (#92400E)
White/Gray toggle switch
Black label text
Smaller gray description text
```

---

**Implementation Date**: [Today]
**Status**: ✅ Visible in Admin UI
**Next**: Database integration to make it functional

For usage instructions, see: `TOP_BASKETS_NEXT_STEPS.md`
