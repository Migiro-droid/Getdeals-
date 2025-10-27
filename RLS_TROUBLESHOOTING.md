# RLS Troubleshooting: Step-by-Step Guide

## Quick Diagnosis

### Step 1: Check if Order Exists
```bash
# In Supabase SQL Editor
SELECT COUNT(*) FROM public.orders WHERE id = '935441d7-b68b-4274-a9b3-8c9f1d0256c4';
```

**If count > 0**: Order exists, problem is RLS or query issue  
**If count = 0**: Order doesn't exist in database

### Step 2: Check RLS Status
```sql
-- In Supabase SQL Editor
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'payments');
```

**Expected Output:**
```
schemaname | tablename  | rowsecurity
------------|------------|----------
public     | orders     | t          ← RLS is ENABLED
public     | order_items| t          ← RLS is ENABLED
public     | payments   | t          ← RLS is ENABLED
```

**If rowsecurity = f (false)**: RLS is disabled (not the issue)  
**If rowsecurity = t (true)**: RLS is enabled (check policies)

### Step 3: List All RLS Policies on Orders Table
```sql
-- In Supabase SQL Editor
SELECT policyname, permissive, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;
```

**Expected Output:**
```
policyname                               | permissive | qual                          | with_check
-----------------------------------------|------------|-------------------------------|----------
Authenticated users can create orders    | PERMISSIVE | null                          | uid=user_id
Authenticated users can update own ...   | PERMISSIVE | uid=user_id                   | uid=user_id
Authenticated users view own orders      | PERMISSIVE | uid=user_id OR role=service_role | null
Service role full access to orders       | PERMISSIVE | role=service_role             | role=service_role
```

---

## Problem: Service Role Policy Missing

### Symptom
- API calls fail with 404
- Direct SQL queries work
- Policy list shows NO "service_role" policy

### Fix
```sql
-- Copy entire migration and run:
-- From: migrations/20251027_fix_rls_policies_for_tracking.sql

CREATE POLICY "Service role full access to orders" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

### Verify
```sql
-- Confirm policy was created
SELECT policyname FROM pg_policies 
WHERE tablename = 'orders' AND policyname LIKE '%Service role%';

-- Should return: Service role full access to orders
```

---

## Problem: UUID Type Mismatch

### Symptom
- User queries fail: "You can only see your own orders"
- Policy uses `WHERE user_id = auth.uid()`
- `user_id` is UUID, `auth.uid()` is text

### Fix
```sql
-- Wrong:
CREATE POLICY "View own" ON orders FOR SELECT
  USING (user_id = auth.uid());

-- Correct:
CREATE POLICY "View own" ON orders FOR SELECT
  USING (user_id::text = auth.uid()::text);
```

### Verify
```sql
-- Check column types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Should show: data_type = uuid
```

---

## Problem: No Policies on Table

### Symptom
- RLS is enabled
- But NO policies exist
- All queries return 0 rows (implicit deny)

### Fix
```sql
-- Add policies from migration
-- File: migrations/20251027_fix_rls_policies_for_tracking.sql

-- Run the entire migration
```

---

## Problem: Too Restrictive Policy

### Symptom
- Even service role queries fail
- Policy with `USING (false)` or similar

### Fix
```sql
-- Find and drop the problematic policy
SELECT policyname FROM pg_policies WHERE tablename = 'orders';

-- Look for policies with:
-- - qual = 'false'
-- - qual = NULL (for ALL operations)

-- Drop it:
DROP POLICY "Policy name" ON public.orders;
```

---

## Testing RLS After Fix

### Test 1: Service Role Access (Backend)
```typescript
// In Node.js with service role key
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', '935441d7-b68b-4274-a9b3-8c9f1d0256c4')
  .single();

if (error) {
  console.error('❌ RLS BLOCKING SERVICE ROLE!');
  console.error('Error:', error.message);
  console.error('Code:', error.code);
  // Apply migration!
} else {
  console.log('✅ Service role can access order');
  console.log('Data:', data);
}
```

### Test 2: User Access (Frontend)
```typescript
// In browser with authenticated user
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', userOwnOrderId)
  .single();

if (error) {
  console.error('❌ User cannot see own order');
  console.error('Error:', error.message);
  // Check RLS policy
} else {
  console.log('✅ User can see own order');
}
```

### Test 3: Cross-User Access (Should Fail)
```typescript
// User tries to access another user's order
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', someoneElsesOrderId)
  .single();

if (error) {
  console.log('✅ RLS working - user cannot see other orders');
} else {
  console.error('❌ RLS NOT working - user can see other orders!');
}
```

---

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `PGRST116` | Failed query due to RLS | Apply RLS migration |
| `42501` | Permission denied | Check grants and policies |
| `42P01` | Table doesn't exist | Create table or check name |
| `42703` | Column doesn't exist | Check column names in policy |
| `null` (404) | Row doesn't match policy | User doesn't have access to this row |

---

## Advanced: Direct Database Testing

### Via psql (if you have access):

```bash
# Connect to Supabase database
psql "postgresql://user:password@host:port/database"

# Test query as service role
SELECT * FROM public.orders WHERE id = 'xxx';

# If this works in psql but fails in API:
# → Problem is RLS policy, not data access
```

### Via REST API with curl:

```bash
# Test with service role key
curl -X GET 'https://YOUR_SUPABASE_PROJECT.supabase.co/rest/v1/orders?id=eq.xxx' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

# Should return order data
# If 403 Forbidden: RLS is blocking

# Test with anon key
curl -X GET 'https://YOUR_SUPABASE_PROJECT.supabase.co/rest/v1/orders?id=eq.xxx' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Should return error (anon users have no access)
```

---

## Verification Checklist

After applying migration, verify each item:

- [ ] RLS is enabled on `orders` table
- [ ] `Service role full access to orders` policy exists
- [ ] Service role policy uses `auth.role() = 'service_role'`
- [ ] User policies use `auth.uid()::text = user_id::text`
- [ ] Tracking endpoint returns 200 (not 404)
- [ ] Browser console shows no RLS errors
- [ ] Backend logs show `✓ Order found:` (not `❌ RLS POLICY`)
- [ ] User can see their own orders
- [ ] User cannot see other users' orders
- [ ] Service role can access all orders (backend only)

---

## Still Not Working?

### Step 1: Clear Cache
```typescript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Reload page
location.reload();
```

### Step 2: Check Environment Variables
```bash
# Verify you're using SERVICE ROLE KEY, not ANON KEY
echo $SUPABASE_SERVICE_ROLE_KEY  # Should have value
echo $SUPABASE_ANON_KEY         # Different value

# In Supabase Dashboard: Settings > API Keys
# Should show both keys with different values
```

### Step 3: Review Migration Step by Step
```sql
-- Run each section of migration individually
-- Check for errors at each step

-- 1. Disable/enable RLS
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;

-- 3. Create new policy
CREATE POLICY "Service role full access to orders" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Check after each step
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders';
```

### Step 4: Contact Supabase Support
If none of the above work:
1. Share error code and message
2. Provide user ID and order ID (anonymized if needed)
3. Share RLS policy configuration
4. Mention which endpoint is failing

---

## Prevention

1. **Always create service role policy first**
2. **Use proper type casting** in policies
3. **Test RLS with all key types** (service, anon, user)
4. **Document RLS policies** with comments
5. **Run migration tests** in staging first
6. **Monitor for RLS errors** in logs

---

**Last Updated**: October 27, 2025  
**Status**: Production Ready
