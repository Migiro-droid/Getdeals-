# RLS Fix - Visual Quick Start Guide

## The Problem Visualized

### What's Happening When You Get 404

```
User Creates Order via Checkout
         ↓
Payment Succeeds
         ↓
Order Created in Database ✓
         ↓
Frontend calls: /api/orders/{orderId}/tracking
         ↓
Backend receives request with SERVICE ROLE KEY
         ↓
Supabase Database
    ├─ Check: Does order exist?
    │  └─ YES ✓ (Order is there)
    │
    └─ Check: Does SERVICE ROLE have access?
       ├─ If RLS policy says YES → ✅ Return order data
       └─ If RLS policy missing → ❌ Return 404 "Permission Denied"
```

---

## The RLS Policy Missing Issue

### Current (Broken) State

```
RLS POLICIES ON ORDERS TABLE:
├─ ✅ "Authenticated users view own orders"
├─ ✅ "Authenticated users can create orders"
└─ ❌ "Service role full access" ← MISSING!

Result:
- User queries work (they have a policy)
- Service role queries fail (no policy = no access)
- Database query works directly (no RLS when you connect directly)
- API fails (uses service role key, no matching policy)
```

### After Fix (Correct State)

```
RLS POLICIES ON ORDERS TABLE:
├─ ✅ "Service role full access" ← ADDED!
├─ ✅ "Authenticated users view own orders"
├─ ✅ "Authenticated users can create orders"
├─ ✅ "Authenticated users can update own orders"
└─ ✅ "Authenticated users can delete own orders"

Result:
- User queries work ✓
- Service role queries work ✓
- API calls succeed ✓
- Direct DB queries work ✓
```

---

## How Service Role Access Works

### Before Migration

```
API Call (with service role key)
    ↓
┌─────────────────────────────────────┐
│ Supabase (Check RLS Policies)       │
│                                      │
│ Looking for policy where:            │
│   - role = "service_role"           │
│   - action = "SELECT"               │
│   - table = "orders"                │
│                                      │
│ Found policies:                      │
│   1. "Authenticated users view..." ❌ (role=authenticated)
│   2. "Authenticated users can..." ❌ (role=authenticated)
│   ✘ NO MATCH ❌                      │
│                                      │
│ Result: DENY (401 Unauthorized)     │
└─────────────────────────────────────┘
    ↓
❌ 404 Response "Order not found"
```

### After Migration

```
API Call (with service role key)
    ↓
┌─────────────────────────────────────┐
│ Supabase (Check RLS Policies)       │
│                                      │
│ Looking for policy where:            │
│   - role = "service_role"           │
│   - action = "SELECT"               │
│   - table = "orders"                │
│                                      │
│ Found policies:                      │
│   0. "Service role full access" ✅  │
│   1. "Authenticated users..." ❌     │
│   2. "Authenticated users..." ❌     │
│   ✓ MATCH FOUND ✅                   │
│                                      │
│ Result: ALLOW (access granted)      │
└─────────────────────────────────────┘
    ↓
✅ 200 Response with order data
```

---

## The SQL Fix Explained

### The Key Policy (Most Important)

```sql
CREATE POLICY "Service role full access to orders" ON public.orders
  FOR ALL                                    -- All operations
  USING (auth.role() = 'service_role')      -- Only for service role
  WITH CHECK (auth.role() = 'service_role');-- For INSERT/UPDATE
```

**What this does:**
- ✅ Gives service role unrestricted access
- ✅ Bypasses all other restrictions
- ✅ Used only by backend APIs (never in frontend)
- ✅ Completely safe with proper key management

### User Access Policy (Also Important)

```sql
CREATE POLICY "Authenticated users view own orders" ON public.orders
  FOR SELECT                                              -- Read only
  USING (auth.uid()::text = user_id::text);             -- Own orders only
```

**What this does:**
- ✅ Let users see their own orders
- ✅ `::text` ensures proper UUID comparison
- ✅ Other users cannot see their orders
- ✅ Secure by design

---

## Step-by-Step Fix Process

### Step 1: Check Current RLS Status
```
🔍 Verify RLS is enabled
   Run: SELECT rowsecurity FROM pg_tables WHERE tablename='orders'
   Expected: t (true)
   Status: ✓
```

### Step 2: List Current Policies
```
🔍 See what policies exist
   Run: SELECT policyname FROM pg_policies WHERE tablename='orders'
   Expected: ~3-4 policies
   Missing: "Service role full access" ← This is the problem!
```

### Step 3: Apply Migration
```
💾 Apply fix
   Copy migration SQL
   Run in Supabase SQL Editor
   Status: ✓ Policies created
```

### Step 4: Verify Fix
```
✅ Confirm fix worked
   Run verification queries
   Expected: 5 policies now (added service role)
   Status: ✓ Service role policy exists
```

### Step 5: Test API
```
🧪 Test tracking endpoint
   Call: /api/orders/{orderId}/tracking
   Expected: 200 with order data
   Status: ✓ Success!
```

---

## Error Messages You Might See

### Before Fix

```
❌ ERROR 1: "Order not found"
   Actual: "Permission denied (RLS policy)"
   Root cause: No service role policy

❌ ERROR 2: "Permission denied for schema public"
   Actual: RLS denying access
   Root cause: Same as above

❌ ERROR 3: "403 Forbidden" in API response
   Actual: Service role can't access data
   Root cause: Same as above
```

### After Fix

```
✅ SUCCESS: Order tracking data returned
   Response: 200 OK
   Data: { success: true, tracking: {...} }

✅ LOGS: "✓ Order found: ORD-..."
   Indicates: RLS allowing access

✅ No "permission denied" errors
   Indicates: Policy working correctly
```

---

## Visual Comparison

### Access Control Matrix

```
┌────────────────────────────────────────────────────────────┐
│                    BEFORE FIX                              │
├────────────────┬──────────┬──────────┬──────────────────────┤
│ Role           │ Can View │ Can Add  │ Issue?               │
├────────────────┼──────────┼──────────┼──────────────────────┤
│ Direct SQL     │ ✅ Yes   │ ✅ Yes   │ No RLS applies      │
│ Service Role   │ ❌ No    │ ❌ No    │ ← Problem is here!  │
│ Authenticated  │ ✅ Own   │ ✅ Own   │ Working            │
│ Anon           │ ❌ No    │ ❌ No    │ Expected           │
└────────────────┴──────────┴──────────┴──────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    AFTER FIX                               │
├────────────────┬──────────┬──────────┬──────────────────────┤
│ Role           │ Can View │ Can Add  │ Issue?               │
├────────────────┼──────────┼──────────┼──────────────────────┤
│ Direct SQL     │ ✅ Yes   │ ✅ Yes   │ No RLS applies      │
│ Service Role   │ ✅ Yes   │ ✅ Yes   │ ← Fixed!            │
│ Authenticated  │ ✅ Own   │ ✅ Own   │ Still working       │
│ Anon           │ ❌ No    │ ❌ No    │ Expected            │
└────────────────┴──────────┴──────────┴──────────────────────┘
```

---

## Decision Tree: Do You Have This Problem?

```
API returns 404 "Order not found"
│
├─ Order exists in database?
│  │
│  ├─ NO → Order creation failed (different issue)
│  │
│  └─ YES → Continue...
│     │
│     ├─ Direct SQL query works?
│     │  │
│     │  ├─ NO → Database problem
│     │  │
│     │  └─ YES → Continue...
│     │     │
│     │     ├─ Are you using service role key?
│     │     │  │
│     │     │  ├─ NO → Different issue
│     │     │  │
│     │     │  └─ YES → 👉 THIS IS RLS ISSUE
│     │     │     │
│     │     │     └─ Fix: Apply RLS migration
│     │     │
│     │     └─ OR Timing issue
│     │        └─ Fix: Use retry logic
│
└─ Follow RLS_TROUBLESHOOTING.md
```

---

## Quick Health Check

### Copy this query and run it:

```sql
-- Run this to diagnose your RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename=t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('orders', 'order_items');
```

**Expected Output:**
```
schemaname | tablename | rowsecurity | policy_count
-----------|-----------|-------------|-------------
public     | orders    | t           | 5 ← Should be 5
public     | order_items | t         | 4 ← Should be 4
```

**If policy_count is less:**
```
→ Migration not fully applied
→ Run migration again
→ Check for errors in Supabase dashboard
```

---

## Timeline: What Happens When

### Creating an Order (Payment Flow)

```
T=0:00   User clicks "Pay Now"
T=0:10   Payment processed
T=0:20   Order inserted into database
T=0:30   API response returned to frontend
T=0:40   Frontend redirects to account page
T=0:50   Frontend calls /api/orders/{orderId}/tracking

T=0:51   ❌ BEFORE FIX: 404 error (RLS blocks)
T=0:51   ✅ AFTER FIX: Success! (RLS allows)

T=0:52   ✅ Component renders tracking bar
T=1:00   ✅ Auto-refresh every 30 seconds
T=1:30   ✅ Still updating tracking
```

### With Timing Issues (Without RLS Fix)

```
T=0:51   First attempt → ❌ 404 (RLS blocks)
T=1:21   Retry attempt 1 → ✅ Success! (finally got through)
         Total delay: 30 seconds
         User sees: "Order not found" briefly, then loads
```

### With Both Fixes (Optimal)

```
T=0:51   First attempt → ✅ 200 Success
         Total delay: < 1 second
         User sees: Tracking appears immediately
```

---

## Summary Flowchart

```
Problem: 404 "Order not found"
    │
    ├─→ Is it timing? (DB lag)
    │   └─→ Use: TRACKING_FIX.md (retry logic)
    │       Result: Waits up to 2 seconds, retries
    │
    └─→ Is it RLS? (Permission denied)
        └─→ Use: RLS_FIX_GUIDE.md (migration)
            Result: Adds service role policy
                    API calls succeed immediately
```

---

## Implementation Timeline

**Total time to fix: ~20 minutes**

```
📖 Read documentation     5 min  → Understand problem
💾 Apply migration        3 min  → Deploy fix
✅ Run verification       3 min  → Confirm fix
🧪 Test endpoint          3 min  → Validate
📊 Monitor metrics        Ongoing → Watch success rate
```

---

**Ready to fix? Start with RLS_FIX_GUIDE.md!**

Created: October 27, 2025  
Status: ✅ Production Ready
