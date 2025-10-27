# Leta API Integration Testing Guide

## Overview

This guide explains how to test whether order data is reaching the Leta APIs correctly. We provide three types of tests:

1. **PowerShell Script** - Quick tests using curl/HTTP requests
2. **TypeScript Script** - Comprehensive automated tests
3. **SQL Queries** - Direct database verification

---

## Quick Test (PowerShell) - 5 minutes

### Best for: Quick verification, no setup required

```powershell
# Navigate to project
cd c:\Users\USER\OneDrive\Desktop\get-deals\getdeals-kenya-showcase

# Run the test script
.\scripts\test-leta-integration.ps1

# Test with specific order
.\scripts\test-leta-integration.ps1 -OrderId "YOUR_ORDER_ID"
```

**Output will show:**
- ✅ Environment variables configured
- ✅ Frontend connectivity
- ✅ Sample payload validation
- ⚠️ / ❌ Any issues found

---

## Database Diagnostic (SQL) - 10 minutes

### Best for: Deep dive into data flow, see actual orders

**Steps:**

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Click **SQL Editor**

2. **Copy and run each section from:** `scripts/test-leta-diagnostic.sql`

3. **Interpret the results:**

#### Query 1: Recent Orders with Leta Integration
```sql
-- Shows last 20 speedy delivery orders
-- Should see: ORDER_REFERENCE | LETA_ORDER_ID | LETA_STATUS

Expected Results:
✅ Order has `leta_order_id` = integration happened
❌ Order has `NULL` for `leta_order_id` = integration failed or pending
⚠️ Order has old date = might be stalled
```

#### Query 2: Order-Payment Linking
```sql
-- Verifies payment → order relationship

Expected Results:
✅ All payments linked to orders
❌ Some payments have NULL order_id = data flow broken
```

#### Query 3: Order Items
```sql
-- Checks if items were saved with order

Expected Results:
✅ Each order has item_count > 0
❌ item_count = 0 or NULL = items not saved
```

#### Query 4: Customer Data Quality
```sql
-- Checks if customer info captured

Expected Results:
✅ All fields populated (name, email, phone)
❌ Missing data = form submission issue
```

#### Query 5: Leta Status Distribution
```sql
-- Shows delivery stages

Expected Results:
pending → assigned → in_transit → delivered
Should see orders progressing through stages
```

---

## Full Automated Test (TypeScript) - 15 minutes

### Best for: Comprehensive testing, CI/CD integration

**Setup:**

1. **Prerequisites:**
   ```bash
   # Ensure environment variables are set
   $env:SUPABASE_URL = "your-supabase-url"
   $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-key"
   $env:VITE_LETA_API_URL = "https://integrations.leta.ai"
   $env:LETA_API_TOKEN = "your-leta-token"
   ```

2. **Run the TypeScript test:**
   ```bash
   npx ts-node scripts/test-leta-integration.ts
   ```

3. **Review test results:**
   - Console output shows each test result
   - `test-results.json` file contains detailed report

### Tests Performed:

| Test | What it checks | Expected Result |
|------|---|---|
| **Configuration** | All env vars set | 4/4 configured |
| **Payload Structure** | Order format valid | All fields present |
| **Leta API Connection** | API accepts order | 200 OK response |
| **Database Orders** | Orders have Leta ID | 5+ orders with leta_order_id |
| **Payments Table** | Payments linked | Most payments linked |
| **Tracking Endpoint** | API returns tracking | 200 with tracking data |

---

## Manual Integration Test - Testing Real Order

### Best for: End-to-end verification with actual order

**Steps:**

1. **Create a test order manually:**
   - Go to https://getdeals.co.ke
   - Add items to cart
   - Proceed to checkout
   - Select "Speedy Delivery" (NOT Pickup)
   - Complete payment with M-Pesa or test card

2. **Get the Order ID from response:**
   - Check browser console (F12)
   - Look for: `order_reference: "ORD-xxxxxx"`
   - Note: `order_id` (UUID)

3. **Test tracking endpoint immediately after order:**
   ```bash
   # Option A: Using curl in PowerShell
   curl "https://getdeals.co.ke/api/orders/{ORDER_ID}/tracking"
   
   # Option B: Browser
   Open: https://getdeals.co.ke/api/orders/{ORDER_ID}/tracking
   ```

4. **Check responses:**

   **Immediate Response (0-5 seconds):**
   ```json
   ❌ { "success": false, "error": "Order not found" }
   → Issue: Database replication lag (use retry logic - already fixed)
   
   ⚠️  { "success": false, "error": "RLS Policy Blocking Access" }
   → Issue: RLS policy missing (apply migration)
   
   ✅ { "success": true, "tracking": { ... } }
   → Good: API found order with tracking
   ```

   **If successful, check tracking data:**
   ```json
   {
     "success": true,
     "tracking": {
       "orderId": "uuid...",
       "orderReference": "ORD-xxxxxx",
       "letaOrderId": "leta-uuid",           ← Should be populated
       "letaStatus": "pending",              ← Should have status
       "trackingUrl": "https://...",         ← Should have URL
       "deliveryOtp": "1234",                ← May be populated later
       "rider": {                            ← May be null initially
         "name": "John Rider",
         "phone": "+254...",
         "latitude": -1.286,
         "longitude": 36.807
       }
     }
   }
   ```

5. **Monitor updates:**
   - Check tracking endpoint every 30 seconds
   - You should see:
     - `letaStatus` changes: pending → assigned → in_transit → delivered
     - `rider` info appears when assigned
     - `deliveryOtp` appears near delivery
     - Location updates in real-time

---

## Troubleshooting Test Failures

### Issue: 404 "Order not found" immediately after creation

**Diagnosis:**
```powershell
# Run quick test
.\scripts\test-leta-integration.ps1

# Check if immediate retry works
$orderid = "YOUR_ORDER_ID"
sleep 2
curl "https://getdeals.co.ke/api/orders/$orderid/tracking"
```

**Solution:**
- ✅ Expected - database replication lag
- ✅ Retry logic should handle this
- Check: `src/components/DeliveryProgressBar.tsx` has retry logic
- Fix: Already implemented (3 retries with exponential backoff)

---

### Issue: 403 "RLS POLICY BLOCKING ACCESS"

**Diagnosis:**
```sql
-- Run in Supabase SQL Editor
SELECT policyname FROM pg_policies WHERE tablename = 'orders';

-- Should show: "Service role full access to orders"
-- If missing → Apply RLS migration
```

**Solution:**
1. Apply migration: `migrations/20251027_fix_rls_policies_for_tracking.sql`
2. Verify: Run above SQL query again
3. Retest: Call tracking endpoint again

---

### Issue: Order created but no `leta_order_id`

**Diagnosis:**
```sql
-- Run in Supabase
SELECT 
  order_reference, 
  delivery_method, 
  leta_order_id, 
  created_at 
FROM orders 
WHERE order_reference = 'ORD-XXXXX';

-- Check:
-- delivery_method = 'speedy' ? (pickup orders don't get Leta)
-- leta_order_id = NULL ? (integration failed or didn't run)
```

**Possible Causes:**

1. **Delivery method is "pickup"** (not "speedy")
   - Solution: Create order with "Speedy Delivery" selected
   - Only speedy delivery uses Leta

2. **Leta token not configured**
   - Solution: Check `env` variables
   ```bash
   echo $env:LETA_API_TOKEN
   echo $env:VITE_LETA_TOKEN
   ```
   - If empty: Set token in `.env.local`

3. **Leta API rejected order**
   - Solution: Check server logs
   ```bash
   # Look for: "🚚 INITIATING LETA DELIVERY"
   # Then: "LETA ORDER CREATION FAILED"
   ```

4. **Network error reaching Leta**
   - Solution: Test connectivity
   ```powershell
   Test-NetConnection -ComputerName integrations.leta.ai -Port 443
   ```

---

### Issue: Payment not linked to order

**Diagnosis:**
```sql
SELECT 
  o.order_reference,
  p.reference as payment_reference,
  o.payment_reference,
  o.id as order_id,
  p.order_id as payment_order_id
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.order_reference = 'ORD-XXXXX';

-- Check: payment_order_id should match order_id
```

**Solution:**
1. Ensure payment completed successfully
2. Check payment reference matches
3. Verify payment record created before order creation

---

### Issue: Tracking data shows NULL for Leta fields

**Diagnosis:**
```sql
SELECT 
  order_reference,
  leta_order_id,
  leta_reference,
  leta_status,
  leta_tracking_url
FROM orders
WHERE order_reference = 'ORD-XXXXX';

-- All should be populated if Lei order was created
```

**Solution:**
1. Order might still be processing → wait 30 seconds
2. Check if Leta webhook hasn't delivered updates yet
3. Verify Leta order exists in Leta dashboard

---

## Checking Logs for Debugging

### API Logs (Vercel)

1. Go to https://vercel.com/dashboard
2. Select project
3. Click **Logs**
4. Search for: `LETA`

**Look for:**
```
✅ INITIATING LETA DELIVERY FOR ORDER: ORD-xxxxx
✅ Leta order payload: {...}
✅ Leta order created successfully: id=...
❌ LETA ORDER CREATION FAILED: error...
```

### Database Logs (Supabase)

1. Go to Supabase Dashboard
2. Click **Logs** (in SQL Editor)
3. Look for:
   - RLS policy denials (403 errors)
   - Query errors
   - Access denied messages

### Browser Logs (F12)

1. Open Developer Tools (F12)
2. Click **Console**
3. Look for:
   - Network errors
   - Tracking endpoint responses
   - WebSocket connection errors

---

## Test Data Checklist

Before investigating issues, verify:

- [ ] Environment variables set correctly
- [ ] Supabase service role key has permissions
- [ ] Leta API token is valid
- [ ] RLS policies applied to orders table
- [ ] Order has `delivery_method = 'speedy'`
- [ ] Customer info complete (name, email, phone)
- [ ] Delivery address provided
- [ ] Payment completed successfully
- [ ] Order visible in Supabase orders table

---

## Quick Reference: Test Execution

| Scenario | Command | Time | Result |
|---|---|---|---|
| Quick check | `.\scripts\test-leta-integration.ps1` | 2 min | ✅/❌/⚠️ |
| Check DB | Run SQL from `test-leta-diagnostic.sql` | 5 min | Detailed data |
| Full test | `npx ts-node scripts/test-leta-integration.ts` | 10 min | JSON report |
| Real order | Create order + test endpoint | 5 min | 🔄 Live tracking |

---

## Success Criteria

Your Leta integration is working when:

✅ **Configuration Test:** All 4 credentials configured
✅ **Payload Test:** All required fields present
✅ **API Test:** Leta API accepts orders (200 OK)
✅ **Database Test:** Orders have `leta_order_id` populated
✅ **Tracking Test:** Endpoint returns 200 with tracking data
✅ **Real Order:** Tracking updates appear in real-time

---

## Next Steps After Successful Test

1. **Monitor for 24 hours:**
   - Check logs for errors
   - Verify tracking updates arriving
   - Monitor delivery completion rate

2. **Set up alerts:**
   - Order creation failures
   - Leta API errors
   - Stalled deliveries (24+ hours in same status)

3. **Customer communication:**
   - Test order tracking link
   - Verify customer receives updates
   - Check SMS/email notifications

4. **Performance monitoring:**
   - Track API response times
   - Monitor database query times
   - Check RLS policy performance

---

## Additional Resources

- `RLS_FIX_GUIDE.md` - How to fix RLS issues
- `TRACKING_FIX.md` - Retry logic details
- `api/orders/create.ts` - Order creation code
- `api/orders/[orderId]/tracking.ts` - Tracking endpoint

---

**Last Updated:** October 27, 2025  
**Status:** Ready for Testing
