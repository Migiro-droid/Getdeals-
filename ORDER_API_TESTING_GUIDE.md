# Order API Testing Guide

This guide helps you test the order API endpoints after an order is created in the GetDeals Kenya application.

## Quick Start

### Option 1: Run the Automated Test Script

```powershell
# Set your API URL (default is http://localhost:3000)
$env:API_URL = "http://localhost:3000"

# Run the test script
node test-order-api.js
```

### Option 2: Manual Testing with PowerShell

```powershell
# Fetch all orders
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list" -Method GET | ConvertTo-Json -Depth 10

# Fetch orders with status filter
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?status=pending" -Method GET | ConvertTo-Json -Depth 10

# Fetch orders with limit
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?limit=5" -Method GET | ConvertTo-Json -Depth 10

# Search for a specific order
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?search=ORD-12345" -Method GET | ConvertTo-Json -Depth 10
```

### Option 3: Test in Browser DevTools

Open your browser console and run:

```javascript
// Fetch all orders
fetch('/api/orders/list')
  .then(res => res.json())
  .then(data => console.log('Orders:', data));

// Fetch pending orders only
fetch('/api/orders/list?status=pending')
  .then(res => res.json())
  .then(data => console.log('Pending Orders:', data));

// Search for specific order
fetch('/api/orders/list?search=customer@email.com')
  .then(res => res.json())
  .then(data => console.log('Search Results:', data));
```

## API Endpoints

### 1. List Orders

**Endpoint:** `GET /api/orders/list`

**Query Parameters:**
- `limit` (optional): Number of orders to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)
- `status` (optional): Filter by order status (pending, confirmed, preparing, out_for_delivery, delivered, cancelled)
- `search` (optional): Search by order reference, customer name, email, or phone

**Example Response:**
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
      "created_at": "2025-01-28T10:30:00Z",
      "updated_at": "2025-01-28T10:30:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### 2. QuickMart Orders

**Endpoint:** `GET /api/quickmart/orders`

**Query Parameters:**
- `status` (optional): Filter by status
- `search` (optional): Search orders
- `limit` (optional): Limit results

**Example:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/quickmart/orders" -Method GET
```

## Testing Checklist

### After Creating an Order

- [ ] **Order appears in database**
  - Check Supabase orders table
  - Verify all fields are populated correctly

- [ ] **Order is retrievable via API**
  ```powershell
  # Get all orders
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list" -Method GET
  ```

- [ ] **Order data structure is correct**
  - `order_reference` is present
  - `customer_*` fields are populated
  - `items` array contains order items
  - `total_amount` matches calculation
  - `status` is set correctly

- [ ] **Order search works**
  ```powershell
  # Search by customer name
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?search=John" -Method GET
  
  # Search by order reference
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?search=ORD-123" -Method GET
  ```

- [ ] **Order status filtering works**
  ```powershell
  # Get pending orders
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?status=pending" -Method GET
  
  # Get delivered orders
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?status=delivered" -Method GET
  ```

- [ ] **Order items are properly formatted**
  - Each item has: `name`, `quantity`, `price`
  - Items array is not empty
  - Product images are included (if available)

- [ ] **Order totals are correct**
  - Subtotal = sum of (item.price × item.quantity)
  - Total = subtotal + delivery_fee
  - No rounding errors

### Admin Dashboard Tests

- [ ] **Orders appear in admin dashboard**
  - Navigate to `/admin`
  - Verify order count is correct
  - Check recent orders list

- [ ] **Order details modal works**
  - Click on an order
  - Verify all order information displays
  - Check that items list is complete

- [ ] **Order status can be updated**
  - Change order status
  - Verify update persists
  - Check that status change reflects in API

### User Dashboard Tests

- [ ] **User can see their orders**
  - Log in as the customer who placed the order
  - Navigate to orders page
  - Verify order appears in list

- [ ] **Order details are visible**
  - Click on order to view details
  - Verify all information is correct
  - Check that order tracking shows correct status

## Common Issues and Solutions

### Issue: No orders returned

**Solution:**
```powershell
# Check if orders exist in database
# This requires direct Supabase access or checking via Supabase dashboard

# Verify API is running
Test-NetConnection -ComputerName localhost -Port 3000

# Check API response
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list" -Method GET -ErrorAction Stop
```

### Issue: Order data incomplete

**Check:**
1. Order creation function completed without errors
2. All required fields in checkout form were filled
3. Database triggers executed correctly
4. RLS policies allow read access

### Issue: Items array is empty

**Solution:**
- Check that `order_items` table has entries for this order
- Verify the join between `orders` and `order_items` is working
- Check the `orders_with_details` view

### Issue: Permission denied

**Solution:**
- Verify API is using `VITE_SUPABASE_SERVICE_ROLE_KEY`
- Check RLS policies on orders table
- Ensure user has proper authentication

## Testing with curl (Alternative)

```bash
# Fetch all orders
curl http://localhost:3000/api/orders/list

# Fetch with filters
curl "http://localhost:3000/api/orders/list?status=pending&limit=10"

# Search orders
curl "http://localhost:3000/api/orders/list?search=John"
```

## Integration Testing

### Test Order Flow End-to-End

1. **Create Order:**
   - Add items to cart
   - Go to checkout
   - Fill in customer details
   - Select delivery method
   - Select payment method
   - Submit order

2. **Verify Order Creation:**
   ```powershell
   # Get the latest order
   $orders = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?limit=1"
   $latestOrder = $orders.orders[0]
   Write-Host "Latest Order ID: $($latestOrder.order_reference)"
   Write-Host "Status: $($latestOrder.status)"
   Write-Host "Total: KES $($latestOrder.total_amount)"
   ```

3. **Check Order in Admin:**
   - Navigate to `/admin`
   - Verify order appears in dashboard
   - Check order metrics updated

4. **Test Status Updates:**
   - Update order status in admin
   - Verify API reflects the change
   - Check user can see updated status

## Performance Testing

### Load Test

```powershell
# Test API response time
Measure-Command {
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list"
}

# Test with large result set
Measure-Command {
  Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?limit=1000"
}
```

### Expected Performance
- Single order fetch: < 100ms
- List 50 orders: < 200ms
- List 1000 orders: < 1s

## Monitoring

### Check Order Creation Rate

```powershell
# Get orders created today
$today = Get-Date -Format "yyyy-MM-dd"
$orders = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?limit=1000"
$todayOrders = $orders.orders | Where-Object { $_.created_at -like "$today*" }
Write-Host "Orders today: $($todayOrders.Count)"
```

### Check Order Status Distribution

```powershell
$orders = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list?limit=1000"
$statusGroups = $orders.orders | Group-Object status
foreach ($group in $statusGroups) {
    Write-Host "$($group.Name): $($group.Count) orders"
}
```

## Troubleshooting Commands

```powershell
# Check if API server is running
Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Detailed

# Test API health
Invoke-RestMethod -Uri "http://localhost:3000/health.json"

# Check environment variables
Get-ChildItem Env: | Where-Object { $_.Name -like "*SUPABASE*" }

# View detailed error response
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/orders/list"
} catch {
    $_.Exception.Response | ConvertTo-Json
}
```

## Next Steps

After testing the order API:

1. ✅ Verify orders are created correctly
2. ✅ Test all API endpoints
3. ✅ Check order appears in admin dashboard
4. ✅ Verify user can see their orders
5. ✅ Test order status updates
6. ✅ Validate payment integration
7. ✅ Test email notifications (if enabled)
8. ✅ Check order tracking functionality

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review server logs
3. Check Supabase logs
4. Verify environment variables are set correctly
5. Ensure database migrations are up to date
