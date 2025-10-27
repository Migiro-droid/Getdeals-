# 🚨 CRITICAL: Leta Integration Not Working - Diagnostic Report

## Problem Summary

**Status:** ❌ CRITICAL - Leta API integration is completely broken

**Evidence:**
- ✅ 13 speedy delivery orders created
- ❌ 0/13 have `leta_order_id` populated
- ❌ 0/13 have `leta_tracking_url`
- ⚠️ All orders stuck in `leta_status: "pending"`

**Root Cause:** The `createLetaOrder()` function in `/api/orders/create.ts` is either:
1. Not being called
2. Failing silently
3. Not storing the response correctly

---

## Affected Orders

```
✅ 13 Speedy Delivery Orders Found:
  ORD-1761550292097-RXO8  (29 minutes ago)   ← NEWEST
  ORD-1761418351168-J5WT  (8 minutes ago)
  ORD-1761417560520-Z3XP  (21 minutes ago)
  ORD-1761416598239-KM6X  (37 minutes ago)
  ORD-1761415935138-6RW9  (49 minutes ago)
  ORD-1761415258828-0FQ5  (0 minutes ago)
  ORD-1761414168410-8IK3  (18 minutes ago)
  ORD-1761412821065-TYA6  (40 minutes ago)
  ORD-1761412070244-6L0F  (53 minutes ago)   ← Status: "shipped" (but no Lei!)
  ORD-1761411626734-C17O  (0 minutes ago)
  ORD-1761411350111-V8TS  (5 minutes ago)
  ORD-1761410350124-P6BU  (22 minutes ago)
  ORD-1761409419402-JGEH  (37 minutes ago)   ← OLDEST

❌ ALL have: leta_order_id = NULL
❌ ALL have: leta_reference = NULL
❌ ALL have: leta_tracking_url = NULL
```

---

## Diagnosis Steps

### Step 1: Check Lei API Token ✅
```bash
# Check if token is configured
echo $env:LETA_API_TOKEN
echo $env:VITE_LETA_TOKEN

# If empty → TOKEN NOT SET (that's the problem!)
# If has value → Check if it's correct
```

### Step 2: Check Server Logs 🔍
```
Go to: https://vercel.com/dashboard
Select: getdeals-kenya-showcase
Click: Logs
Search for: "INITIATING LETA DELIVERY" or "LETA"
```

**Expected logs (for each order):**
```
🚚 INITIATING LETA DELIVERY FOR ORDER: ORD-1761550292097-RXO8
📍 Sending request to Leta API: https://integrations.leta.ai/orders/add
[Payload JSON]
```

**If these logs DON'T exist:**
- Lei token not configured
- Lei code not executing
- Database not reaching API endpoint

### Step 3: Check if createLetaOrder() is Running
```bash
# In Vercel logs, search for:
"Sending request to Leta API"

# If NOT found → Lei code not executing
# If found → Check response error
```

---

## Most Likely Cause: Missing LETA_API_TOKEN

### How to Fix:

**1. Get your Lei API Token**
```
Contact Lei Support or check Lei dashboard
You should have: Bearer token or API key
```

**2. Set it in Vercel Environment**
```
Go to: https://vercel.com/dashboard
Select: getdeals-kenya-showcase
Settings > Environment Variables
Add:
  Name: LETA_API_TOKEN
  Value: your-actual-token
  Environments: Production, Preview, Development
Save → Redeploy
```

**3. Verify it's set**
```bash
# After deploying, check:
Go to Vercel > Deployments > [Latest]
Click "Logs" tab
Search for: "LETA_API_TOKEN"

Should show: "✅ Token configured"
NOT: "❌ Token missing"
```

**4. Create a test order**
```
- Go to https://getdeals.co.ke
- Add items to cart
- Checkout
- Select "Speedy Delivery"
- Complete payment
- Check if new order has leta_order_id
```

---

## Alternative Issues to Check

### Issue 2: Lei Token is WRONG/EXPIRED

```bash
# Test Lei API with token
curl -X POST "https://integrations.leta.ai/orders/add" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "GD-TEST-123",
    "customer": {"phone_number": "254712345678", "email": "test@test.com", "name": "Test"},
    "depot_code": "getdeals-nairobi",
    "dropoff": {"latitude": -1.286, "longitude": 36.807, "name": "Test"},
    "products": [{"code": "TEST", "quantity": 1, "price": 100}],
    "payment_method": "prepaid"
  }'

# Expected response:
# ✅ { "id": "...", "reference": "GD-TEST-123", ... }

# Error response:
# ❌ { "error": "Invalid token" } → Token wrong
# ❌ { "error": "Token expired" } → Refresh token
```

---

### Issue 3: Network Blocked

```bash
# Test connectivity to Lei
Test-NetConnection -ComputerName integrations.leta.ai -Port 443

# Should show: TcpTestSucceeded: True
# If False → Network issue, check firewall
```

---

### Issue 4: Environment Variable Not Reading Correctly

Check the code in `api/orders/create.ts`:

```typescript
const letaToken = process.env.LETA_API_TOKEN || process.env.VITE_LETA_TOKEN;

if (!letaToken) {
  console.warn('⚠️ LETA_API_TOKEN not configured');
  return { success: false, error: 'Leta token not configured' };
}
```

**If this is logging the warning** → Token not in environment

---

## Fix Priority Order

### 🔴 CRITICAL - Do This First:
1. **Set LETA_API_TOKEN in Vercel environment**
2. **Redeploy application**
3. **Create test order**
4. **Verify leta_order_id is populated**

### 🟡 IMPORTANT - Do This Next:
1. Test all 13 existing orders
2. Verify Lei shows them in Lei dashboard
3. Check tracking links work

### 🟢 OPTIONAL - Polish:
1. Set up monitoring/alerts
2. Document process
3. Test error scenarios

---

## Implementation Plan

### Phase 1: Fix Token (30 minutes)

```
Step 1: Get current token from Lei
        ↓
Step 2: Go to Vercel Dashboard
        ↓
Step 3: Project Settings → Environment Variables
        ↓
Step 4: Add LETA_API_TOKEN = [value]
        ↓
Step 5: Redeploy (Vercel will auto-deploy)
        ↓
Step 6: Wait 5 minutes for deployment
```

### Phase 2: Verify (15 minutes)

```
Step 1: Create test order
        ↓
Step 2: Check Vercel logs for:
        "✅ Lei order created successfully"
        ↓
Step 3: Query database:
        SELECT leta_order_id FROM orders
        WHERE order_reference = 'ORD-...'
        ↓
Step 4: Should see UUID populated
```

### Phase 3: Test Existing Orders (10 minutes)

```
Option A: Manual Retry
  - Can't retry (Lei already tried)
  - Create new orders to test fix

Option B: Clean Up
  - Move existing orders to pickup
  - Or create Lei orders manually via Lei API

Option C: Document
  - These 13 orders as "lei integration not available"
  - New orders will work correctly
```

---

## SQL to Check After Fix

```sql
-- After implementing fix, run this:
SELECT 
  order_reference,
  leta_order_id,
  leta_status,
  created_at
FROM orders
WHERE delivery_method = 'speedy'
  AND created_at > NOW() - INTERVAL 1 HOUR
ORDER BY created_at DESC;

-- Should show newly created orders with:
-- leta_order_id = [UUID]  ← Should be populated!
-- leta_status = 'pending'
```

---

## Verifying the Fix Worked

### Check 1: In Database
```sql
SELECT COUNT(*) as with_leta_id
FROM orders
WHERE delivery_method = 'speedy'
  AND leta_order_id IS NOT NULL
  AND created_at > NOW() - INTERVAL 1 DAY;

-- Before fix: 0
-- After fix: Should increase with new orders
```

### Check 2: In Logs
```
Vercel Logs → Search "LETA ORDER CREATED"
Should see: "✅ Lei order created successfully: id=..."
```

### Check 3: In Lei Dashboard
```
Go to Lei system
Should see new orders appearing
Each with GetDeals reference: GD-[order_reference]
```

---

## Common Mistakes

❌ **Don't:**
- Set token in `.env.local` (only works locally)
- Set token in `.env` file in GitHub (exposed!)
- Forget to redeploy after setting token
- Use wrong token format (should be Bearer token)

✅ **Do:**
- Use Vercel Environment Variables
- Redeploy after setting
- Verify logs show success
- Test with real order creation

---

## Quick Checklist

Before contacting Lei support:

- [ ] LETA_API_TOKEN set in Vercel
- [ ] Application redeployed
- [ ] New order created
- [ ] Vercel logs checked for errors
- [ ] Database shows leta_order_id populated
- [ ] Lei dashboard shows order received

---

## If Still Not Working

### Get Debug Information:

```powershell
# 1. Check what token is being used
# (Add temporary logging to api/orders/create.ts)

# 2. Run manual Lei API test
.\scripts\test-leta-quick.ps1 -SendTestOrder

# 3. Check database
# (Run diagnostic SQL queries)

# 4. Share with Lei support:
- Vercel logs showing error
- Exact token being used
- Error response from Lei API
```

---

## Timeline

**Now (if token exists):**
- 10 min: Set Vercel environment variable
- 5 min: Redeploy
- 5 min: Create test order
- 5 min: Verify in database

**Total: 25 minutes**

**If token missing:**
- Get from Lei support (varies)
- Then follow above timeline

---

## Resources

- Vercel Dashboard: https://vercel.com/dashboard
- Lei Support: [contact info]
- Supabase Dashboard: https://app.supabase.com
- Code: `api/orders/create.ts` (line 224-280 for Lei logic)

---

## Next Action 🎯

**IMMEDIATELY:**
1. **Check if LETA_API_TOKEN is set in Vercel**
   - https://vercel.com → Project Settings → Environment Variables
   
2. **If NOT set:**
   - Get token from Lei support
   - Add to Vercel
   - Redeploy
   - Test

3. **If SET:**
   - Check if value is correct
   - Run test order
   - Check logs for error

**Then reply with:**
- ✅ Token is set / ❌ Token is missing
- ✅ New orders have leta_order_id / ❌ Still NULL
- Any error messages from logs

---

**Report Generated:** October 27, 2025  
**Severity:** 🔴 CRITICAL  
**Status:** AWAITING TOKEN CONFIGURATION  
**ETA to Fix:** 25 minutes (if token available)
