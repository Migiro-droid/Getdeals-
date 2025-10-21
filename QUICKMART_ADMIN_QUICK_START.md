# Quickmart Admin Dashboard - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Files Are in Place
All the following files should now exist:

```
src/pages/quickmart/
├── QuickMartAdminDashboard.tsx ✓
├── QuickMartAdminOrders.tsx ✓
├── QuickMartAdminProducts.tsx ✓
└── QuickMartAdminAnalytics.tsx ✓

api/quickmart/orders/
├── index.ts ✓
└── update-status.ts ✓

Root Documentation/
├── QUICKMART_ADMIN_DASHBOARD.md ✓
└── QUICKMART_ADMIN_IMPLEMENTATION_CHECKLIST.md ✓
```

### Step 2: Verify App.tsx Route (Already Done)
The route in `src/App.tsx` should be:
```typescript
<Route 
  path="/quickmart" 
  element={<QuickMartGuard><QuickMartAdminDashboard /></QuickMartGuard>} 
/>
```

### Step 3: Create Test Account
In your auth system, create a test account with:
```json
{
  "email": "quickmart.admin@example.com",
  "password": "SecurePassword123",
  "role": "quickmart",
  "name": "Quickmart Admin"
}
```

### Step 4: Test the Dashboard
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:5173/auth`
3. Sign in with quickmart admin account
4. Go to: `http://localhost:5173/quickmart`
5. You should see the Quickmart Admin Dashboard

### Step 5: Populate Test Data (Optional)
Add sample Quickmart orders to your database:
```sql
INSERT INTO orders (
  order_reference, customer_name, customer_email, customer_phone,
  total_amount_kes, subtotal_kes, delivery_fee_kes, status,
  payment_status, payment_method, delivery_method, vendor,
  branch, created_at, items
) VALUES (
  'QM-001', 'John Doe', 'john@example.com', '+254712345678',
  5000, 4800, 200, 'confirmed',
  'paid', 'mpesa', 'pickup', 'quickmart',
  'Quickmart Lavington', NOW(), '[]'::jsonb
);
```

## 🔑 Key Features Summary

### Orders Tab
- View all Quickmart orders
- Filter by status, search by customer
- Click to see full order details
- Update order status
- Cancel orders

### Products Tab
- Add new products
- Upload product image URL
- Set price and stock
- Assign to branch
- Categorize products
- Delete products
- Bulk upload support

### Analytics Tab
- Total revenue, orders, avg order value
- Branch performance metrics
- 7-day revenue trend
- Top 10 selling products
- Low stock alerts

## 🔒 Security Features

✅ Only `role: 'quickmart'` users can access
✅ Global admins (`role: 'admin'`) are blocked
✅ Other staff/managers are blocked
✅ Unauthenticated users are blocked
✅ All API endpoints filter for Quickmart data only
✅ Order updates check authorization

## 📊 What's Different from Global Admin Panel

| Feature | Global Admin | Quickmart Admin |
|---------|-------------|-----------------|
| Access | `role: admin, manager, staff` | `role: quickmart` ONLY |
| Orders | All orders | Quickmart orders only |
| Products | All products | Quickmart products only |
| Reports | Global metrics | Quickmart & branch metrics |
| User Mgmt | Yes | No |
| Settings | Yes | No |

## 🐛 Troubleshooting

### Dashboard shows "Access Denied"
- [ ] Confirm your account has `role: 'quickmart'`
- [ ] Log out and log back in
- [ ] Check browser console for errors

### Orders not loading
- [ ] Check if API endpoint exists: `/api/quickmart/orders`
- [ ] Verify database has orders with status set
- [ ] Check Network tab in browser DevTools

### Products don't appear
- [ ] Ensure products have `category: 'quickmart'`
- [ ] Check ProductsContext is loading
- [ ] Verify image URLs are valid

### Analytics show no data
- [ ] Add sample orders to database
- [ ] Ensure orders have proper timestamps
- [ ] Check all required fields are populated

## 📞 Support

For questions:
1. Check the full documentation: `QUICKMART_ADMIN_DASHBOARD.md`
2. Review implementation checklist: `QUICKMART_ADMIN_IMPLEMENTATION_CHECKLIST.md`
3. Check browser console for error messages
4. Review API responses in Network tab

## ✨ Next Steps

1. **Test with real Quickmart data**
   - Replace test orders with actual data
   - Verify branch tracking is accurate

2. **Customize branding** (optional)
   - Update dashboard title/colors
   - Add Quickmart logo
   - Customize branch list

3. **Set up notifications** (future)
   - Email alerts for new orders
   - Low stock warnings
   - Status change notifications

4. **Enable analytics exports** (future)
   - CSV export of orders
   - PDF reports
   - Email scheduled reports

## 🎯 Expected Behavior

### When Accessing `/quickmart`

**If User is NOT Authenticated:**
- Shows login required message
- Directs to auth page

**If User is Admin (not Quickmart):**
- Shows "Access Restricted" message
- Displays current role
- Prevents access

**If User is Quickmart Admin:**
- Loads full dashboard
- Shows Orders, Products, Analytics tabs
- Displays all Quickmart data

### Order Management Flow
1. View all orders in table
2. Filter by status or search
3. Click order to open details
4. Update status using workflow
5. Changes save immediately
6. Order list updates in real-time

### Product Management Flow
1. Click "Add Product" button
2. Fill form with product details
3. Select branch and category
4. Submit to create product
5. Product appears in list
6. Can delete using trash icon

### Analytics Flow
1. KPI cards show current metrics
2. Charts update based on data
3. Branch table shows comparison
4. All data filters for Quickmart only
5. Data updates when orders change

## 🎉 Congratulations!

Your Quickmart Admin Dashboard is now fully functional with:
- ✅ Order management
- ✅ Product management
- ✅ Performance analytics
- ✅ Branch tracking
- ✅ Role-based access control
- ✅ Real-time data updates

Happy selling! 🚀
