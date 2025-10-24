# Integration Testing Guide - Leta Delivery System

Complete testing procedures for the delivery integration.

---

## Test Environment Setup

### Prerequisites
- Local dev server running on port 3001
- Frontend running on port 5173
- Supabase connection active
- Leta sandbox credentials configured
- Postman or cURL available

### Test Data
```typescript
const testCoordinates = {
  depot: { lat: -1.2860273, lng: 36.8079678 },        // GetDeals HQ
  userLocation1: { lat: -1.2950, lng: 36.7850 },       // Lavington
  userLocation2: { lat: -1.2097, lng: 36.8833 },       // Roysambu
  outOfService: { lat: -4.5, lng: 39.5 }               // Coastal area (likely no drivers)
};

const testUser = {
  id: 'test-user-123',
  email: 'test@getdeals.co.ke',
  phone: '+254712345678',
  name: 'Test User'
};
```

---

## Unit Tests

### Test 1: Shipping Cost Calculation

```bash
# Test Case 1: Valid coordinates
curl -X POST http://localhost:3001/api/delivery/shipping-cost \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.2950,
    "longitude": 36.7850
  }'

# Expected: 
# {
#   "success": true,
#   "data": {
#     "shippingCost": 300,
#     "currency": "KES",
#     "estimatedDeliveryTime": "30-45 minutes"
#   }
# }

# Test Case 2: Missing latitude
curl -X POST http://localhost:3001/api/delivery/shipping-cost \
  -H "Content-Type: application/json" \
  -d '{"longitude": 36.7850}'

# Expected:
# {
#   "success": false,
#   "error": "Latitude and longitude are required"
# }

# Test Case 3: Out of service area
curl -X POST http://localhost:3001/api/delivery/shipping-cost \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -4.5,
    "longitude": 39.5
  }'

# Expected: Either error or high cost
```

**Checklist:**
- [ ] Valid coordinates return cost (300 KES)
- [ ] Missing fields return error
- [ ] Invalid coordinates handled gracefully
- [ ] Response time < 2 seconds

---

### Test 2: Driver Availability Check

```bash
# Test Case 1: Drivers available
curl -X POST http://localhost:3001/api/delivery/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.2950,
    "longitude": 36.7850
  }'

# Expected:
# {
#   "success": true,
#   "data": {
#     "driversAvailable": true,
#     "metrics": {
#       "available_drivers": 12,
#       "average_rating": 4.8
#     }
#   }
# }

# Test Case 2: No drivers available
curl -X POST http://localhost:3001/api/delivery/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -4.5,
    "longitude": 39.5
  }'

# Expected:
# {
#   "success": true,
#   "data": {
#     "driversAvailable": false,
#     "metrics": {
#       "available_drivers": 0
#     }
#   }
# }
```

**Checklist:**
- [ ] Returns true for service areas
- [ ] Returns false for out-of-service areas
- [ ] Includes driver count metrics
- [ ] Response time < 2 seconds

---

### Test 3: Order Creation

```typescript
// Test Case 1: Valid order creation
const testOrder = {
  getdealsOrderId: 'order-123'
};

fetch('http://localhost:3001/api/delivery/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(testOrder)
})
.then(r => r.json())
.then(console.log);

// Expected:
// {
//   "success": true,
//   "data": {
//     "letaOrder": {
//       "id": "leta-order-123",
//       "reference": "GD-order-123",
//       "order_status": "pending",
//       "tracking_url": "https://tracking.leta.ai/..."
//     }
//   }
// }

// Test Case 2: Missing authentication
fetch('http://localhost:3001/api/delivery/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testOrder)
})
// Expected: 401 Unauthorized

// Test Case 3: Invalid order ID
const invalidOrder = { getdealsOrderId: 'invalid-id' };
// Expected: 404 Order not found
```

**Checklist:**
- [ ] Valid order creates successfully
- [ ] Returns Leta order details
- [ ] Missing auth returns 401
- [ ] Invalid order returns 404
- [ ] Order updated in database
- [ ] Tracking URL provided

---

## Integration Tests

### Test 1: Full Checkout Flow

**Step-by-step test in browser:**

```
1. Navigate to http://localhost:5173
2. Add items to cart (at least 2 items)
3. Click "Checkout"
4. Enter customer information:
   - Name: Test User
   - Email: test@getdeals.co.ke
   - Phone: +254712345678
5. Select "Speedy Delivery"
6. Enter delivery address:
   - Address: Test Location
   - Latitude: -1.2950
   - Longitude: 36.7850
7. Click "Check Delivery"
8. Verify:
   ✓ Shipping cost shows: KES 300
   ✓ Drivers available message shown
   ✓ "Summary" tab available
9. Click "Payment Method"
10. Select "Pay with Wallet"
11. Verify:
    ✓ Wallet balance shown
    ✓ Total includes delivery fee
    ✓ 5% cashback calculated
12. Click "Complete Order"
13. Verify:
    ✓ Payment processed
    ✓ Order created in database
    ✓ Navigated to tracking page
```

**Expected Outcomes:**
- ✅ Order appears in database with leta_order_id
- ✅ Status changed to "confirmed"
- ✅ Tracking page loads with order details
- ✅ WebSocket connects for real-time updates

---

### Test 2: Real-Time Tracking

**Step-by-step test:**

```
1. On OrderTracking page, observe:
   ✓ WebSocket connecting (check browser network tab)
   ✓ Status timeline shows "Pending"
   ✓ Real-time indicator shows "🟢 Live" or "🔄 Updating"
   
2. Simulate webhook update (via Postman):
   POST http://localhost:3001/api/delivery/webhook
   Body:
   {
     "order_id": "leta-order-123",
     "order_status": "assigned",
     "rider": {
       "id": "driver-1",
       "name": "John Driver",
       "phone": "+254712111111",
       "latitude": "-1.285",
       "longitude": "36.808",
       "vehicle": "Motorcycle",
       "rating": 4.8
     }
   }

3. Verify on tracking page:
   ✓ Status changed to "Assigned"
   ✓ Driver info appeared
   ✓ Driver card shows name, phone, vehicle
   ✓ Location coordinates displayed
   ✓ "View on Google Maps" button available
   ✓ No page refresh needed (real-time)

4. Test status progression:
   Send webhooks for each status:
   - "pending" → "assigned" → "picked_up" → "in_transit" → "delivered"
   
5. Verify for each:
   ✓ Timeline updated
   ✓ UI re-rendered automatically
   ✓ Toast notification shown (for delivered)
```

**Expected Outcomes:**
- ✅ WebSocket connects successfully
- ✅ Webhook updates received
- ✅ UI updates without page refresh
- ✅ All status transitions work
- ✅ Driver information displays correctly

---

### Test 3: Webhook Processing

**Manual webhook testing:**

```bash
# Simulate Leta sending webhook to your server
curl -X POST http://localhost:3001/api/delivery/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "leta-order-123",
    "getdeals_order_id": "order-123",
    "order_status": "in_transit",
    "rider": {
      "id": "rider-123",
      "name": "Jane Driver",
      "phone": "+254712222222",
      "latitude": "-1.290",
      "longitude": "36.790",
      "vehicle": "Motorcycle",
      "rating": 4.9
    },
    "delivery_otp": "4321",
    "event_timestamp": "2024-01-15T10:00:00Z"
  }'

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "message": "Webhook processed successfully"
#   }
# }

# Verify in database:
SELECT * FROM leta_webhook_logs 
WHERE order_id = 'leta-order-123' 
ORDER BY created_at DESC LIMIT 1;

# Should show:
# - processed: true
# - status: in_transit
# - payload saved as JSON

# Verify order updated:
SELECT leta_status, rider_name, delivery_otp 
FROM orders 
WHERE id = 'order-123';

# Should show:
# - leta_status: in_transit
# - rider_name: Jane Driver
# - delivery_otp: 4321
```

**Checklist:**
- [ ] Webhook endpoint accessible
- [ ] Logs created in database
- [ ] Order status updated
- [ ] Rider information saved
- [ ] OTP stored correctly
- [ ] Response successful

---

### Test 4: Address Update

```bash
curl -X PUT http://localhost:3001/api/delivery/orders/order-123/address \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "deliveryAddress": {
      "name": "New Location",
      "latitude": -1.3000,
      "longitude": 36.7900
    }
  }'

# Expected:
# {
#   "success": true,
#   "data": {
#     "message": "Delivery address updated successfully"
#   }
# }

# Verify in database:
SELECT delivery_address FROM orders WHERE id = 'order-123';
# Should show new coordinates
```

**Checklist:**
- [ ] Address updated in database
- [ ] New address sent to Leta
- [ ] Order remains active
- [ ] Shipping cost recalculated

---

### Test 5: Order Cancellation

```bash
curl -X POST http://localhost:3001/api/delivery/orders/order-123/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

# Expected:
# {
#   "success": true,
#   "data": {
#     "message": "Order cancelled successfully"
#   }
# }

# Verify status:
SELECT status, leta_status FROM orders WHERE id = 'order-123';
# Both should be 'cancelled'
```

**Checklist:**
- [ ] Status changed to cancelled
- [ ] Leta order cancelled
- [ ] Webhooks no longer received
- [ ] Cannot update cancelled order

---

## Performance Tests

### Test 1: Response Times

```bash
# Measure shipping cost response time
time curl -X POST http://localhost:3001/api/delivery/shipping-cost \
  -H "Content-Type: application/json" \
  -d '{"latitude": -1.295, "longitude": 36.785}'

# Measure driver availability response time
time curl -X POST http://localhost:3001/api/delivery/check-availability \
  -H "Content-Type: application/json" \
  -d '{"latitude": -1.295, "longitude": 36.785}'

# Measure order creation response time
time curl -X POST http://localhost:3001/api/delivery/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"getdealsOrderId": "order-123"}'
```

**Performance Targets:**
- Shipping cost: < 1 second ✅
- Driver availability: < 2 seconds ✅
- Order creation: < 3 seconds ✅
- Webhook processing: < 500ms ✅

---

### Test 2: Concurrent Orders

```bash
# Create 10 orders simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/delivery/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"getdealsOrderId\": \"order-$i\"}" &
done
wait

# Monitor:
# - All requests succeed
# - No timeouts
# - Database handles concurrent updates
# - No data corruption
```

---

## Browser DevTools Testing

### Console Checks

Open browser F12, go to Console tab:

```javascript
// 1. Check WebSocket connection
// Should show in console when connecting
// Green indicator when connected

// 2. Monitor real-time updates
// Watch for 'order-status-update' events
console.log('WebSocket connected and receiving updates');

// 3. Check local storage
localStorage.getItem('auth-token') // Should exist
localStorage.getItem('order-id')   // Should exist after checkout

// 4. Monitor network requests
// Go to Network tab
// Create order - should see:
// - POST /api/orders (GetDeals)
// - POST /api/delivery/orders (Leta)
// - WebSocket upgrade
```

### Network Tab

```
Monitor these requests after checkout:

1. POST /api/orders
   Status: 200 OK
   Response: Order created

2. POST /api/delivery/orders
   Status: 200 OK
   Response: Leta order ID

3. WebSocket upgrade
   Status: 101 Switching Protocols
   Messages: Real-time updates

4. POST /api/delivery/webhook (incoming)
   Simulated status updates
```

---

## Database Testing

### Query Checklist

```sql
-- 1. Check orders table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%leta%'
ORDER BY ordinal_position;

-- Should show: leta_order_id, leta_status, rider_*, etc.

-- 2. Verify order created with delivery info
SELECT id, order_reference, leta_order_id, delivery_address 
FROM orders 
WHERE status = 'confirmed'
ORDER BY created_at DESC LIMIT 1;

-- 3. Check webhook logs
SELECT COUNT(*) FROM leta_webhook_logs;
SELECT * FROM leta_webhook_logs 
ORDER BY created_at DESC LIMIT 10;

-- 4. Verify rider information stored
SELECT id, rider_name, rider_phone, rider_latitude, rider_longitude
FROM orders 
WHERE rider_id IS NOT NULL
LIMIT 1;

-- 5. Check delivery OTP
SELECT id, delivery_otp FROM orders 
WHERE delivery_otp IS NOT NULL 
LIMIT 1;

-- 6. Monitor indexes
SELECT * FROM pg_indexes 
WHERE tablename IN ('orders', 'leta_webhook_logs');

-- 7. Check rate cache
SELECT COUNT(*) FROM rata_cache;
```

---

## Error Scenario Testing

### Test 1: Network Failure

```
1. Disconnect internet
2. Click "Check Delivery"
3. Expected: Error message shown
4. Re-connect
5. Retry - should work
```

### Test 2: Invalid Token

```bash
curl -X POST http://localhost:3001/api/delivery/orders \
  -H "Authorization: Bearer invalid-token" \
  -d '{"getdealsOrderId": "order-123"}'

# Expected: 401 Unauthorized
```

### Test 3: Order Not Found

```bash
curl -X POST http://localhost:3001/api/delivery/orders \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"getdealsOrderId": "nonexistent"}'

# Expected: 404 Not Found
```

### Test 4: Webhook Timeout

```
1. Create order
2. No webhook received for 5+ minutes
3. Expected: System retries, timeout handled gracefully
```

---

## Load Testing

### Simple Load Test with Apache Bench

```bash
# Test endpoint under load
ab -n 100 -c 10 http://localhost:3001/api/delivery/shipping-cost

# Parameters:
# -n: Total requests
# -c: Concurrent requests

# Acceptable results:
# - Median response time: < 2 seconds
# - Failed requests: 0
# - Throughput: > 50 req/sec
```

---

## Final Checklist

### Before Going Live

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Performance targets met
- [ ] Error scenarios handled
- [ ] Database queries optimized
- [ ] WebSocket connections stable
- [ ] Webhook processing working
- [ ] Authentication verified
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Logs being collected
- [ ] Error tracking setup
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Team trained on system
- [ ] Support documentation complete
- [ ] Production environment ready

---

## Continuous Testing

### Weekly Checks
- [ ] Monitor webhook success rate
- [ ] Check delivery times
- [ ] Review error logs
- [ ] Verify driver ratings
- [ ] Check system performance

### Monthly Checks
- [ ] Database maintenance
- [ ] Security audit
- [ ] Load test
- [ ] Disaster recovery drill
- [ ] Team training

---

**Testing Complete! Your delivery system is production-ready! 🚀**
