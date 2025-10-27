# RLS (Row Level Security) Fix for Order Tracking 404 Error

## Problem: RLS Blocking Service Role Access

### What is RLS?
Row Level Security (RLS) is a PostgreSQL/Supabase feature that restricts data access based on policies. Even with a service role key (which should have admin access), misconfigured RLS policies can block queries.

### Why It's Causing 404 Errors

The tracking endpoint uses a **service role key** which should bypass all RLS policies. However, some RLS configurations can interfere:

```sql
-- ❌ BAD: This blocks EVERYONE, even service role
CREATE POLICY "Block all access" ON orders FOR ALL USING (false);

-- ❌ BAD: RLS enabled but no policies = implicit deny
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- (no policies created)

-- ❌ PROBLEMATIC: Policy requires auth context
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
-- ^ Service role queries fail because auth.uid() returns NULL
```

### Symptoms of RLS Issues
1. Order tracking returns 404 even though order exists
2. Direct database queries work (in pgAdmin, etc.) but API calls fail
3. Logs show "Order not found" but order is in database
4. Works in development but fails in production (different RLS configs)

---

## Solution: Fix RLS Policies

### Quick Fix (Recommended for Production)

**For service role access, disable RLS on orders table OR create explicit service role policies:**

```sql
-- OPTION 1: Disable RLS (simplest, works with service role)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Then re-enable with proper policies if you want RLS for anon access
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

**OPTION 2: Keep RLS enabled but add service role policies:**

```sql
-- Allow service role (used by backend APIs) to access all data
CREATE POLICY "Service role can access all orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all order items" ON public.order_items
  FOR ALL USING (auth.role() = 'service_role');

-- Keep user access policy for anon/authenticated users
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid()::text = user_id::text
  );
```

---

## Complete RLS Migration

Save this as `migrations/20251027_fix_rls_policies_for_tracking.sql`:

```sql
-- ============================================================================
-- RLS Policy Fix for Order Tracking
-- Problem: Service role couldn't access orders due to RLS configuration
-- Solution: Add explicit service role policies and fix UUID comparisons
-- ============================================================================

-- ============================================================================
-- 1. ORDERS TABLE - RLS POLICIES
-- ============================================================================

-- Disable and re-enable to start fresh
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Policy 1: Service role (backend APIs) can do EVERYTHING
-- This is CRITICAL for the tracking endpoint to work
CREATE POLICY "Service role full access to orders" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Authenticated users can view their own orders
CREATE POLICY "Authenticated users view own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text
    OR auth.role() = 'service_role'
  );

-- Policy 3: Authenticated users can insert orders (for checkout)
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    OR auth.role() = 'service_role'
  );

-- Policy 4: Authenticated users can update their own orders
CREATE POLICY "Authenticated users can update own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================================
-- 2. ORDER_ITEMS TABLE - RLS POLICIES
-- ============================================================================

-- Disable and re-enable to start fresh
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items for their own orders" ON public.order_items;

-- Policy 1: Service role (backend APIs) can do EVERYTHING
CREATE POLICY "Service role full access to order items" ON public.order_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can view order items from their own orders
CREATE POLICY "Users view items from own orders" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id::text = auth.uid()::text
    )
    OR auth.role() = 'service_role'
  );

-- Policy 3: Users can insert items for their own orders
CREATE POLICY "Users can insert items for own orders" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id::text = auth.uid()::text
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 3. PAYMENTS TABLE - RLS POLICIES (for consistency)
-- ============================================================================

-- Ensure payments table also has proper RLS for service role
DROP POLICY IF EXISTS "Service role full access to payments" ON public.payments;

CREATE POLICY "Service role full access to payments" ON public.payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. IMPORTANT INDEXES
-- ============================================================================

-- Ensure we have proper indexes for performance with RLS policies
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify RLS policies are working:
-- 
-- Check current RLS status on tables:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
--   WHERE tablename IN ('orders', 'order_items', 'payments');
--
-- List all policies on orders table:
-- SELECT * FROM pg_policies WHERE tablename = 'orders';
--
-- Test service role access (requires anon key, run as: curl with anon key):
-- GET /rest/v1/orders?id=eq.YOUR_ORDER_ID

-- ============================================================================
-- 6. IMPORTANT NOTES
-- ============================================================================
-- 
-- - Service role key (backend APIs) should NOW have full access
-- - Authenticated users can only see their own orders
-- - Anon users cannot access orders (no anon policy)
-- - UUID::text casting ensures proper type comparison
-- - auth.role() = 'service_role' is the key policy
--
-- ============================================================================
```

---

## How to Apply the Migration

### Via Supabase Dashboard (Easiest):

1. **Go to SQL Editor in Supabase Dashboard**
2. **Create new query**
3. **Copy the SQL from above**
4. **Run it**

Expected output:
```
CREATE POLICY
CREATE POLICY
CREATE POLICY
CREATE POLICY
... (more policies)
```

### Via Migration Files (Recommended):

1. **Save the SQL above as** `migrations/20251027_fix_rls_policies_for_tracking.sql`
2. **Run migrations**: `supabase migration up`

### Verification:

After applying, test in browser console:

```javascript
// Test if tracking endpoint now works
fetch('/api/orders/{orderId}/tracking')
  .then(r => r.json())
  .then(d => console.log('✅ Success:', d))
  .catch(e => console.error('❌ Error:', e));
```

---

## Backend Code: Detect RLS Issues

Update `api/orders/[orderId]/tracking.ts` to better detect RLS problems:

```typescript
// In the tracking endpoint error handling:

if (error?.code === 'PGRST116') {
  console.error('🔒 RLS POLICY BLOCKING ACCESS!');
  console.error('The RLS policy on the orders table is blocking service role access');
  console.error('Fix: Run the RLS migration in Supabase dashboard');
  console.error('Details:', error.message);
  
  return res.status(403).json({
    success: false,
    error: 'RLS Policy Blocking Access',
    hint: 'Your database has RLS policies that prevent data access. Contact support.',
    code: 'RLS_POLICY_ERROR'
  });
}

if (error?.message?.includes('permission denied')) {
  console.error('🔒 PERMISSION DENIED - Likely RLS issue');
  return res.status(403).json({
    success: false,
    error: 'Permission Denied - RLS Policy Issue',
    hint: 'Database permissions need to be configured. Admin action required.'
  });
}
```

---

## RLS Policy Decision Tree

```
Does the query fail?
│
├─ YES, status 404
│  ├─ RLS enabled?
│  │  ├─ No service_role policy? → ADD IT ✅
│  │  ├─ Policy uses auth.uid()? → Fix with auth.uid()::text
│  │  └─ Policy blocks all? → REMOVE IT
│  │
│  └─ RLS disabled?
│     └─ Something else wrong (check other causes)
│
└─ NO, success
   └─ RLS working correctly ✅
```

---

## Testing RLS Fix

### Step 1: Check Current Status
```sql
-- In Supabase SQL Editor
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'orders';

-- Should show: tablename='orders', rowsecurity='t' (true = RLS enabled)
```

### Step 2: List All Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'orders';
-- Should show multiple policies including service_role
```

### Step 3: Test Service Role Access
```typescript
// In Node.js with service role key:
const supabase = createClient(url, serviceRoleKey);

const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single();

if (error) {
  console.error('❌ Service role access denied:', error);
  console.error('FIX: Run the RLS migration');
} else {
  console.log('✅ Service role can access orders');
}
```

### Step 4: Test User Access
```typescript
// In browser with authenticated user:
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', userOwnOrderId)
  .single();

if (error) {
  console.error('❌ User cannot see their own orders:', error);
} else {
  console.log('✅ User can see their own orders');
}
```

---

## Common RLS Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| **No service_role policy** | Service role queries fail with 404 | Add `auth.role() = 'service_role'` policy |
| **UUID type mismatch** | User queries fail (policy uses `=` not `::text`) | Use `auth.uid()::text = user_id::text` |
| **Block all policy** | Everything fails including service role | Check for `USING (false)` and drop it |
| **RLS enabled, no policies** | Implicit deny - everything blocked | Add at least one policy |
| **Wrong role name** | RLS policy references wrong role | Use `auth.role() = 'service_role'` exactly |
| **Policy too restrictive** | Only service role works, users can't query | Add user-specific policies |

---

## Prevention: Best Practices

1. **Always include service_role policy**:
   ```sql
   CREATE POLICY "Service role access" ON table_name
     FOR ALL USING (auth.role() = 'service_role');
   ```

2. **Use proper type casting**:
   ```sql
   -- ✅ CORRECT
   WHERE user_id::text = auth.uid()::text
   
   -- ❌ WRONG
   WHERE user_id = auth.uid()
   ```

3. **Separate policies per role**:
   ```sql
   -- Service role
   CREATE POLICY "..." FOR ALL USING (auth.role() = 'service_role');
   
   -- Authenticated users
   CREATE POLICY "..." FOR SELECT USING (auth.uid()::text = user_id::text);
   
   -- Anon (if needed)
   CREATE POLICY "..." FOR SELECT USING (false); -- or more specific
   ```

4. **Test with all access levels**:
   - Service role (backend API)
   - Authenticated user (frontend)
   - Anon user (if applicable)

---

## Debugging RLS Issues

### Enable RLS Logging (Advanced):

```sql
-- In Supabase (requires admin):
ALTER DATABASE your_db SET log_min_messages = DEBUG;
ALTER DATABASE your_db SET log_statement = 'all';

-- Then check logs in Supabase Logs panel
```

### Check RLS Error Messages:

- `permission denied for schema public` → RLS policy blocking
- `new row violates row-level security policy` → INSERT/UPDATE blocked by policy
- `42W01` → Policy syntax error

---

## Rollback

If RLS fix breaks something:

```sql
-- Disable RLS entirely (temporary, for debugging only)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- OR revert to previous policy
DROP POLICY "Service role full access to orders" ON public.orders;
-- ... restore old policies
```

---

## Summary Checklist

- [ ] RLS migration applied to production database
- [ ] Service role policy exists on orders table
- [ ] Service role policy exists on order_items table
- [ ] UUID type casting used in policies (`::text`)
- [ ] Tracking endpoint tested and working
- [ ] User can see their own orders
- [ ] Service role can access all orders (for APIs)
- [ ] Monitored logs for RLS errors

---

## Support

If you're still having issues:

1. **Check Supabase logs** - Dashboard > Logs
2. **Verify service role key** - Different from anon key
3. **Test with psql** - Direct database access
4. **Review RLS policies** - Ensure service_role policy exists
5. **Check UUID types** - Ensure proper type casting

---

**Last Updated**: October 27, 2025  
**Status**: Ready for Production Deployment
