# Quick Order API Testing Guide

## Prerequisites

1. **Start your development server first:**
   ```powershell
   npm run dev
   # or
   bun dev
   ```

2. **Wait for server to start** (usually shows "Local: http://localhost:5173")

## Option 1: Test in Browser Console

1. Open your app in browser: http://localhost:5173
2. Open DevTools (F12)
3. Go to Console tab
4. Run these commands:

### Test All Orders
```javascript
fetch('/api/orders/list')
  .then(r => r.json())
  .then(d => {
    console.log(`✓ Found ${d.orders.length} orders`);
    console.table(d.orders.slice(0, 5));
  });
```

### Test Pending Orders Only
```javascript
fetch('/api/orders/list?status=pending')
  .then(r => r.json())
  .then(d => console.log('Pending orders:', d.orders));
```

### Search for an Order
```javascript
fetch('/api/orders/list?search=ORD-123')
  .then(r => r.json())
  .then(d => console.log('Search results:', d.orders));
```

## Option 2: Test in PowerShell (When Server is Running)

Open a NEW PowerShell window and run:

```powershell
# Test 1: Get all orders
Invoke-RestMethod -Uri "http://localhost:5173/api/orders/list" | ConvertTo-Json

# Test 2: Get pending orders
Invoke-RestMethod -Uri "http://localhost:5173/api/orders/list?status=pending" | ConvertTo-Json

# Test 3: Get last 5 orders
Invoke-RestMethod -Uri "http://localhost:5173/api/orders/list?limit=5" | ConvertTo-Json

# Test 4: Search orders
Invoke-RestMethod -Uri "http://localhost:5173/api/orders/list?search=John" | ConvertTo-Json
```

## Option 3: Test After Making an Order

### Step 1: Create a Test Order
1. Go to http://localhost:5173
2. Add items to cart
3. Go to checkout
4. Fill in:
   - Name: Test Customer
   - Email: test@example.com
   - Phone: +254712345678
   - Delivery method: Speedy
   - Payment: M-Pesa
5. Click "Place Order"

### Step 2: Verify Order in API
Open console and run:
```javascript
fetch('/api/orders/list?limit=1')
  .then(r => r.json())
  .then(d => {
    const order = d.orders[0];
    console.log('Latest Order:');
    console.log(`  ID: ${order.order_reference}`);
    console.log(`  Customer: ${order.customer_name}`);
    console.log(`  Total: KES ${order.total_amount}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Items: ${order.items.length}`);
  });
```

### Step 3: Check in Admin Dashboard
1. Go to http://localhost:5173/admin
2. Log in (if required)
3. Verify order appears in dashboard
4. Click on order to see details

## Option 4: Direct Database Check (Supabase)

1. Go to https://supabase.com
2. Open your project
3. Go to Table Editor
4. Open `orders` table
5. Look for your recent orders
6. Check the `items` field (should be JSON array)

## Common Issues

### "Unable to connect to the remote server"
**Solution:** Start your dev server first with `npm run dev` or `bun dev`

### "No orders found"
**Solution:** 
1. Create a test order through the website
2. Check Supabase to confirm order was created
3. Try the API again

### "401 Unauthorized"
**Solution:** 
- The API uses service role key, so this shouldn't happen
- Check your `.env` file has `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Orders missing items
**Solution:**
- Check `order_items` table in Supabase
- Verify the join in `/api/orders/list.ts`

## Automated Testing

Once server is running, use the automated scripts:

```powershell
# Simple quick test
.\test-orders-simple.ps1

# Or full test (Node.js)
node test-order-api.js
```

## Expected Response Format

```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid-here",
      "order_reference": "ORD-20250128-ABC123",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "+254712345678",
      "delivery_method": "speedy",
      "payment_method": "mpesa",
      "status": "pending",
      "total_amount": 1500,
      "subtotal": 1300,
      "delivery_fee": 200,
      "items": [
        {
          "product_id": "prod-123",
          "name": "Essential Basket",
          "quantity": 1,
          "price": 1300
        }
      ],
      "created_at": "2025-01-28T10:30:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

## Next Steps

After confirming orders API works:

1. ✅ Test order creation flow
2. ✅ Verify order appears in admin
3. ✅ Test order status updates
4. ✅ Check order tracking
5. ✅ Test payment integration
6. ✅ Verify email notifications

## Quick Reference

**API Endpoints:**
- GET `/api/orders/list` - List all orders
- GET `/api/orders/list?status=pending` - Filter by status
- GET `/api/orders/list?limit=10` - Limit results
- GET `/api/orders/list?search=keyword` - Search orders
- GET `/api/quickmart/orders` - QuickMart orders

**Order Statuses:**
- `pending` - Just created
- `confirmed` - Confirmed by admin
- `preparing` - Being prepared
- `out_for_delivery` - Out for delivery
- `delivered` - Completed
- `cancelled` - Cancelled
