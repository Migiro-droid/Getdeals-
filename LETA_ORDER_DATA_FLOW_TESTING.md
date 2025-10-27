# Leta Order Data Flow - Complete Testing Package

## What's Being Tested?

When a customer places an order with speedy delivery, data flows through this pipeline:

```
Customer Places Order
        ↓
Frontend POST /api/orders/create
        ↓
Backend Creates Order in Database
        ↓
Backend Sends Order Data to Leta API
        ↓
Leta Returns Order ID & Tracking URL
        ↓
Backend Stores Leta Info in Database
        ↓
Frontend Fetches /api/orders/{id}/tracking
        ↓
Shows Real-time Tracking to Customer
```

**This package tests each step to ensure data reaches Leta correctly.**

---

## Test Files Created

### 1. **test-leta-integration.ps1** (PowerShell)
**Best for:** Quick tests, no dependencies

```powershell
# Basic test
.\scripts\test-leta-integration.ps1

# Test specific order
.\scripts\test-leta-integration.ps1 -OrderId "ORD-123456"
```

**What it tests:**
- ✅ Environment variables configured
- ✅ Credentials present
- ✅ Frontend connectivity
- ✅ Payload structure valid
- ✅ Sample Lei API call
- ✅ Database integration info
- ⏱️ Time: 2-3 minutes

---

### 2. **test-leta-quick.ps1** (PowerShell - Minimal)
**Best for:** Fast spot checks

```powershell
# Check specific order tracking
.\scripts\test-leta-quick.ps1 -OrderId "ORD-123456"

# Test Lei API with sample order
.\scripts\test-leta-quick.ps1 -SendTestOrder

# Get database check query
.\scripts\test-leta-quick.ps1 -CheckDatabase
```

**What it does:**
- ✅ Single order tracking check
- ✅ Test Lei API
- ✅ Print database diagnostic query
- ⏱️ Time: 30 seconds

---

### 3. **test-leta-integration.ts** (TypeScript)
**Best for:** Comprehensive automated testing

```bash
# Set environment variables first
$env:SUPABASE_URL = "..."
$env:SUPABASE_SERVICE_ROLE_KEY = "..."
$env:LETA_API_TOKEN = "..."

# Run full test suite
npx ts-node scripts/test-leta-integration.ts
```

**What it tests:**
- ✅ Configuration complete
- ✅ Payload structure
- ✅ Lei API connection (real request!)
- ✅ Database orders
- ✅ Payment records
- ✅ Tracking endpoint
- 📊 Outputs: `test-results.json`
- ⏱️ Time: 5-10 minutes

---

### 4. **test-leta-diagnostic.sql** (SQL)
**Best for:** Deep data inspection

```sql
-- Run in Supabase SQL Editor
-- Each query shows different aspect of data flow
```

**What it shows:**
- ✅ 20 recent speedy orders
- ✅ Order → Payment linking
- ✅ Failed Lei creations
- ✅ Order items
- ✅ Customer data quality
- ✅ Delivery addresses
- ✅ Lei status distribution
- ✅ Stalled orders
- ✅ Overall statistics
- ✅ RLS policies

---

### 5. **LETA_INTEGRATION_TESTING.md** (This guide)
**Best for:** Understanding tests and troubleshooting

---

## Quick Start - Choose Your Path

### 🚀 I want a quick answer (2 minutes)

```powershell
cd c:\Users\USER\OneDrive\Desktop\get-deals\getdeals-kenya-showcase
.\scripts\test-leta-quick.ps1 -OrderId "YOUR_ORDER_ID"
```

**Output:**
- ✅ Order found with Lei data
- ❌ Error retrieving tracking
- ⚠️ Warning/issue found

---

### 🔍 I want to see actual data (5 minutes)

1. **Open Supabase Dashboard**
   - https://app.supabase.com
   - Select your project
   - **SQL Editor** tab

2. **Copy first query** from `scripts/test-leta-diagnostic.sql`

3. **Paste and run** - See last 20 orders with Lei integration status

**Output shows:**
```
order_reference | leta_order_id | leta_status | integration_status
ORD-123456      | c8d9e0f1...   | pending     | ✅ INTEGRATED
ORD-123455      | NULL          | NULL        | ❌ NOT INTEGRATED
```

---

### 🧪 I want comprehensive testing (10 minutes)

```powershell
cd c:\Users\USER\OneDrive\Desktop\get-deals\getdeals-kenya-showcase

# Set environment variables
$env:SUPABASE_URL = "your-url"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-key"
$env:LETA_API_TOKEN = "your-token"

# Run full suite
npx ts-node scripts/test-leta-integration.ts

# Check results
cat test-results.json
```

**Output:**
- ✅ 6 test results
- 📊 JSON report
- 🎯 Pass/Fail for each component

---

### 🛠️ I want to troubleshoot issues (15 minutes)

1. **Run SQL diagnostic:**
   - All 12 queries from `test-leta-diagnostic.sql`
   - Identify which step is failing

2. **Check logs:**
   - Vercel logs for API errors
   - Supabase logs for DB errors
   - Browser console for frontend errors

3. **Use relevant troubleshooting section:**
   - See "Troubleshooting" in `LETA_INTEGRATION_TESTING.md`

---

## Data Flow Verification

### Step 1: Order Created ✅
```sql
-- In database?
SELECT COUNT(*) FROM orders WHERE delivery_method = 'speedy';
-- Should see > 0
```

### Step 2: Payment Linked ✅
```sql
-- Payment → Order linked?
SELECT COUNT(*) FROM payments WHERE order_id IS NOT NULL;
-- Should see > 0
```

### Step 3: Lei Order Created ✅
```sql
-- Lei data populated?
SELECT COUNT(*) FROM orders WHERE leta_order_id IS NOT NULL;
-- Should see > 0
```

### Step 4: Tracking Works ✅
```
GET /api/orders/{ORDER_ID}/tracking
Response: { success: true, tracking: { letaOrderId: "...", ... } }
Should be 200 OK
```

### Step 5: Real-time Updates ✅
```
WebSocket connection to Lei
Shows rider location updates
Status changes: pending → assigned → in_transit → delivered
```

---

## Testing Checklist

Before you start testing, ensure:

- [ ] Order created via checkout (not manually)
- [ ] Selected "Speedy Delivery" (not Pickup)
- [ ] Payment completed successfully
- [ ] Environment variables configured
- [ ] Network connectivity available
- [ ] Database accessible

---

## Expected Outputs

### Success Scenario ✅

```
PowerShell Test:
   ✅ LETA_API_TOKEN configured
   ✅ Frontend Health: Responding
   ✅ Payload Validation: All required fields present
   ✅ Leta API Connection: Order accepted (HTTP 200)

SQL Query:
   order_reference | leta_order_id | integration_status
   ORD-123456      | uuid123...    | ✅ INTEGRATED

API Response:
   { 
     "success": true, 
     "tracking": {
       "letaOrderId": "uuid123...",
       "letaStatus": "pending",
       "trackingUrl": "https://..."
     }
   }
```

### Failure Scenario ❌

```
PowerShell Test:
   ❌ LETA_API_TOKEN not configured
   ❌ Leta API Connection failed

SQL Query:
   order_reference | leta_order_id | integration_status
   ORD-123456      | NULL          | ❌ NOT INTEGRATED

API Response:
   {
     "success": false,
     "error": "Order not found"
   }
```

---

## Common Issues & Solutions

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| 404 "Order not found" immediately | Database replication lag | Use retry logic (already implemented) |
| 403 "RLS POLICY BLOCKING ACCESS" | Missing service role policy | Apply RLS migration |
| NULL `leta_order_id` | Lei integration failed | Check Lei API token, check logs |
| Payment not linked to order | Data flow broken | Verify payment created before order |
| Tracking data shows NULL | Lei webhook not delivered yet | Wait 30 seconds and retry |

---

## Next Steps

**After successful testing:**

1. ✅ **Monitor for 24 hours**
   - Check logs for errors
   - Verify tracking updates arriving

2. ✅ **Create test orders regularly**
   - Test each delivery method
   - Monitor completion rate

3. ✅ **Set up alerts**
   - Lei API errors
   - Failed order creations
   - Stalled deliveries

4. ✅ **Document findings**
   - Note any issues encountered
   - Record resolution steps
   - Update this document

---

## Test Files Location

```
scripts/
├── test-leta-integration.ts         # TypeScript full test
├── test-leta-integration.ps1        # PowerShell full test
├── test-leta-quick.ps1              # PowerShell quick test
└── test-leta-diagnostic.sql         # SQL diagnostic queries

Root/
└── LETA_INTEGRATION_TESTING.md      # This complete guide
```

---

## Key Endpoints

### Order Creation
```
POST /api/orders/create
Receives: Order data + payment confirmation
Sends: Order to database + Lei API
Returns: Order ID + Lei tracking URL
```

### Tracking Retrieval
```
GET /api/orders/{orderId}/tracking
Returns: Current tracking status + rider info
Uses: Service role to bypass RLS
```

### Lei Webhook
```
POST /api/webhooks/leta
Receives: Status updates from Lei
Updates: Order status + rider location
```

---

## Environment Variables Required

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Lei
VITE_LETA_API_URL=https://integrations.leta.ai
LETA_API_TOKEN=Bearer_token_here

# Frontend (optional)
FRONTEND_URL=https://getdeals.co.ke
VITE_SUPABASE_URL=https://xxxx.supabase.co
```

---

## Running Tests in CI/CD

```yaml
# GitHub Actions example
- name: Run Leta Integration Tests
  run: npx ts-node scripts/test-leta-integration.ts
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    LETA_API_TOKEN: ${{ secrets.LETA_API_TOKEN }}

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.json
```

---

## Support & Resources

- **Full Testing Guide:** `LETA_INTEGRATION_TESTING.md`
- **RLS Issues:** `RLS_FIX_GUIDE.md`
- **Retry Logic:** `TRACKING_FIX.md`
- **Order Creation Code:** `api/orders/create.ts`
- **Tracking Endpoint:** `api/orders/[orderId]/tracking.ts`

---

**Created:** October 27, 2025  
**Status:** ✅ Ready to Test  
**Last Updated:** October 27, 2025

**You now have a complete testing package to verify Lei integration!**
