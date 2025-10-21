# Quickmart Admin Dashboard Implementation Guide

## Overview

The Quickmart Admin Dashboard is a specialized admin interface that provides Quickmart administrators with complete control over their orders, products, and performance metrics. Unlike the global `/admin` panel (which is restricted to global admins), the Quickmart dashboard is exclusively for Quickmart admins only.

## Features Implemented

### 🎯 1. Order Management (QuickMartAdminOrders.tsx)
- **View All Orders**: Display Quickmart-specific orders in a filterable table
- **Status Filtering**: Filter orders by status (Pending, Confirmed, Shipped, Delivered, Cancelled)
- **Order Search**: Search by order reference, customer name, email, or phone
- **Order Sorting**: Sort by newest, oldest, highest total, or lowest total
- **Order Details Modal**: Click any order to see:
  - Customer information
  - Delivery/pickup location and branch
  - Order items with quantities and prices
  - Order status workflow with ability to transition through statuses
  - Payment information
  - Complete breakdown of subtotal, delivery fee, and total
- **Status Management**: Update order status through an intuitive workflow

**Access Point**: `/api/quickmart/orders` (GET)
**Update Point**: `/api/quickmart/orders/update-status` (PUT)

### 📦 2. Product Management (QuickMartAdminProducts.tsx)
- **Add Products**: Create new products with:
  - Product name, price, original price (for discounts)
  - Product image URL
  - Category selection (Vegetables, Fruits, Dairy, Meat, etc.)
  - Branch assignment
  - Stock quantity
  - Product description
- **Bulk Upload**: Upload multiple products at once
- **Product Search**: Search products by name or branch
- **Stock Tracking**: Visual indicators for:
  - In Stock (green)
  - Low Stock <10 (yellow)
  - Out of Stock (red)
- **Product List**: Display all Quickmart products with current stock levels
- **Delete Products**: Remove products from the catalog
- **Edit Products**: Edit product details (coming soon)

**Context Used**: `ProductsContext` for local product management
**Features**: Validation, error handling, success notifications

### 📊 3. Performance Analytics (QuickMartAdminAnalytics.tsx)

#### Key Performance Indicators (KPIs)
- **Total Revenue**: Sum of all Quickmart orders
- **Total Orders**: Count of all Quickmart orders
- **Average Order Value**: Revenue / Number of orders
- **Low Stock Items**: Count of products with stock < 10

#### Branch Performance
- **Bar Chart**: Revenue by branch visualization
- **Performance Summary Table**: Shows for each branch:
  - Number of orders
  - Total revenue
  - Average order value
- Helps identify which branches are performing best

#### Daily Revenue Trend
- **Line Chart**: 7-day revenue trend
- Shows daily revenue and order count
- Helps identify trends and peak sales days

#### Top Selling Products
- **Horizontal Bar Chart**: Top 10 products by units sold
- Shows which products move fastest
- Helps with inventory planning

#### Branch Performance Summary
- Detailed breakdown of each branch's metrics
- Quick reference for branch comparison

## Security & Access Control

### Authentication Guard
The dashboard includes multi-level access control:

```typescript
// Only allows users with role === 'quickmart'
function QuickMartGuard({ children }: { children: JSX.Element }) {
  // 1. Checks if user is authenticated
  // 2. Checks if user's role is exactly 'quickmart'
  // 3. Rejects global admins, staff, and other users
}
```

### Key Access Rules
✅ **Allowed**: Users with `role: 'quickmart'`
❌ **Not Allowed**:
- Global admins (`role: 'admin'`)
- Staff members (`role: 'staff'`)
- Managers (`role: 'manager'`)
- Guest users
- Any other vendor type

### Backend Filters
All API endpoints filter data:
```typescript
// Only returns orders where:
// - vendor === 'quickmart' OR
// - branch is set to a Quickmart location
```

## Database Schema

### Orders Table (Filtered)
For Quickmart orders, these fields are used:
```sql
- order_reference (unique ID)
- customer_name
- customer_email
- customer_phone
- total_amount_kes
- subtotal_kes
- delivery_fee_kes
- status (pending, confirmed, shipped, delivered, cancelled)
- payment_status
- payment_method
- delivery_method (speedy, pickup)
- delivery_address
- pickup_location
- branch (new field for Quickmart branch)
- vendor (filter: 'quickmart')
- items (order items array)
- created_at
- updated_at
```

### Products (Filtered from Products Context)
```typescript
{
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  category: 'quickmart' (always)
  branch?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

## API Endpoints

### GET /api/quickmart/orders
Fetch Quickmart-specific orders with pagination and filtering.

**Query Parameters:**
- `limit` (default: 50) - Records per page
- `offset` (default: 0) - Pagination offset
- `status` (optional) - Filter by status
- `search` (optional) - Search orders

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100,
    "hasMore": true
  },
  "stats": {
    "total": 100,
    "pending": 20,
    "confirmed": 30,
    "shipped": 25,
    "delivered": 20,
    "cancelled": 5,
    "totalRevenue": 500000
  }
}
```

### PUT /api/quickmart/orders/update-status
Update an order's status.

**Request Body:**
```json
{
  "orderId": "QM-001234",
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": "QM-001234",
    "status": "confirmed",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Component Structure

```
QuickMartAdminDashboard (Main Container)
├── Header
│   ├── Welcome message
│   ├── User info display
│   └── Logout button
├── Tab Navigation
│   ├── Orders Tab → QuickMartAdminOrders
│   ├── Products Tab → QuickMartAdminProducts
│   └── Analytics Tab → QuickMartAdminAnalytics
└── Content Area (Tab-based)
```

## Usage Guide

### For Quickmart Admins

1. **Login**
   - Navigate to `/auth`
   - Sign in with your Quickmart admin account
   - Your account must have `role: 'quickmart'`

2. **Access Dashboard**
   - Go to `/quickmart`
   - If not authorized, you'll see an access denied message

3. **Manage Orders**
   - Click the "Orders" tab
   - View all orders in table format
   - Use filters to find specific orders
   - Click any order row to see full details
   - Update order status through the workflow

4. **Manage Products**
   - Click the "Products" tab
   - Click "+ Add Product" to create new products
   - Fill in all required fields
   - Track stock levels (green/yellow/red indicators)
   - Delete products using the trash icon
   - Use "Bulk Upload" to add multiple products at once

5. **View Analytics**
   - Click the "Analytics" tab
   - See KPI cards at the top
   - View branch performance comparison
   - Check daily revenue trends
   - Identify top-selling products
   - Review branch performance summary

## Installation & Setup

### 1. File Structure
```
src/
├── pages/quickmart/
│   ├── QuickMartAdminDashboard.tsx (Main dashboard)
│   ├── QuickMartAdminOrders.tsx (Orders management)
│   ├── QuickMartAdminProducts.tsx (Products management)
│   └── QuickMartAdminAnalytics.tsx (Analytics)
├── App.tsx (Updated with route and guard)
│
api/
├── quickmart/
│   └── orders/
│       ├── index.ts (GET orders)
│       └── update-status.ts (PUT status update)
```

### 2. Route Setup (Already Done in App.tsx)
```typescript
<Route 
  path="/quickmart" 
  element={<QuickMartGuard><QuickMartAdminDashboard /></QuickMartGuard>} 
/>
```

### 3. Environment Variables (Required)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Columns (Optional - for enhanced filtering)
If you want to add branch tracking to orders:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor VARCHAR(50);
```

## Testing

### Test Access Control
1. Create a test account with `role: 'quickmart'`
2. Try accessing `/quickmart` - should load dashboard
3. Try with `role: 'admin'` - should show access denied
4. Try without authentication - should show login required

### Test Order Management
1. Add sample orders to the database
2. Filter by different statuses
3. Search for specific orders
4. Update order status and verify changes

### Test Product Management
1. Add products with bulk upload
2. Verify stock indicators update correctly
3. Delete a product and verify removal
4. Search products by name/branch

### Test Analytics
1. Generate several orders with different branches
2. Verify branch metrics are calculated correctly
3. Check daily revenue chart updates
4. Verify top products are sorted correctly

## Future Enhancements

- [ ] Export orders/products to CSV
- [ ] Email notifications on order status changes
- [ ] Automated stock alerts for low inventory
- [ ] Revenue forecasting based on trends
- [ ] Customer analytics (repeat customers, top customers)
- [ ] Product edit functionality
- [ ] Multi-branch reporting
- [ ] Order receipt generation/printing
- [ ] Webhook integration for real-time updates
- [ ] Mobile app version

## Troubleshooting

### "Access Denied" message
- Verify your account has `role: 'quickmart'`
- Check that you're logged in to the correct account
- Clear browser cache and try again

### Orders not loading
- Check API endpoint `/api/quickmart/orders` is accessible
- Verify database has orders with `vendor: 'quickmart'`
- Check browser console for error messages

### Products not appearing
- Ensure products have `category: 'quickmart'`
- Check ProductsContext is properly loaded
- Verify images URLs are valid

### Analytics showing no data
- Confirm orders exist in the database
- Verify orders have proper status values
- Check that timestamps are recent enough

## Support & Documentation

For issues or feature requests, check:
- Error messages in browser console
- API response details in Network tab
- Database query logs
- Component prop types and context definitions
