# Wallet Payment Error - Troubleshooting Guide

**Error:** `PGRST116 - Cannot coerce the result to a single JSON object`  
**Cause:** User doesn't have a wallet record in the database  
**Date:** October 7, 2025

---

## 🔴 Problem

When a user tries to pay with their wallet, they get this error:
```json
{
  "code": "PGRST116",
  "details": "The result contains 0 rows",
  "hint": null,
  "message": "Cannot coerce the result to a single JSON object"
}
```

**Root Cause:** The user doesn't have a record in the `wallets` table.

---

## ✅ Solution Applied

### 1. Updated Edge Function (DEPLOYED)

The `wallet-to-merchant-payment` function now automatically creates a wallet if it doesn't exist:

```typescript
// If wallet doesn't exist, try to create it
if (walletError && walletError.code === 'PGRST116') {
  console.log('Wallet not found, attempting to create...')
  
  const { data: newWallet, error: createError } = await supabase
    .from('wallets')
    .insert({ user_id: user.id, balance: 0 })
    .select('id, balance, user_id')
    .single()

  if (createError || !newWallet) {
    return error response
  }

  wallet = newWallet
}
```

**Status:** ✅ Function redeployed successfully

---

## 🔧 Manual Fix (If Needed)

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. Go to SQL Editor: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql

2. Run this query to find users without wallets:
```sql
SELECT 
  up.user_id,
  up.full_name,
  up.email,
  up.phone_number
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id
WHERE w.user_id IS NULL;
```

3. Create wallets for all users without one:
```sql
INSERT INTO wallets (user_id, balance)
SELECT 
  up.user_id,
  0 as balance
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

4. Verify:
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(w.user_id) as users_with_wallets,
  COUNT(*) - COUNT(w.user_id) as users_without_wallets
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id;
```

### Option 2: Run SQL File

From project root:
```powershell
# Via Supabase CLI
npx supabase db execute -f fix-missing-wallets.sql
```

---

## 🔍 Debugging Steps

### 1. Check if user has a wallet:
```sql
SELECT * FROM wallets WHERE user_id = 'USER_ID_HERE';
```

### 2. Check user profile:
```sql
SELECT * FROM user_profile WHERE user_id = 'USER_ID_HERE';
```

### 3. Check function logs:
```powershell
npx supabase functions logs wallet-to-merchant-payment --project-ref fxyifnckgllxqbggegtw
```

Or in Dashboard: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/functions

### 4. Test wallet creation manually:
```sql
INSERT INTO wallets (user_id, balance)
VALUES ('USER_ID_HERE', 0)
ON CONFLICT (user_id) DO NOTHING
RETURNING *;
```

---

## 🚀 Testing After Fix

### Test 1: New User Without Wallet

1. Create a new test account (or use existing user without wallet)
2. Try to pay with wallet
3. Expected: Wallet should be auto-created with balance 0
4. Expected: Error message about insufficient balance (not wallet not found)

### Test 2: Existing User With Wallet

1. Login as user with wallet
2. Ensure wallet has sufficient balance
3. Make a purchase with wallet payment
4. Expected: Payment should process successfully

### Test 3: Check Logs

```powershell
# Watch logs in real-time
npx supabase functions logs wallet-to-merchant-payment --project-ref fxyifnckgllxqbggegtw --tail
```

Look for:
- "Wallet not found, attempting to create..."
- "Wallet created successfully"
- Or any errors

---

## 🔄 Long-term Prevention

### Ensure Wallet Creation on Signup

Add this to your signup trigger or after user creation:

```sql
-- Function to create wallet on user signup
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after user_profile is created
CREATE TRIGGER trigger_create_wallet_after_profile
  AFTER INSERT ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();
```

---

## 📊 Monitoring Queries

### Check wallet creation stats:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as wallets_created
FROM wallets
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Find users without wallets:
```sql
SELECT COUNT(*) as users_without_wallets
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id
WHERE w.user_id IS NULL;
```

### Check recent wallet activity:
```sql
SELECT 
  w.user_id,
  w.balance,
  w.created_at,
  w.updated_at,
  up.full_name,
  up.email
FROM wallets w
JOIN user_profile up ON w.user_id = up.user_id
ORDER BY w.created_at DESC
LIMIT 20;
```

---

## ✅ Resolution Status

- [x] Edge Function updated to auto-create wallets
- [x] Function redeployed successfully
- [ ] Apply SQL fix for existing users (if needed)
- [ ] Add wallet creation trigger for new users
- [ ] Test with affected user
- [ ] Monitor logs for errors

---

## 📞 If Issue Persists

1. **Check RLS Policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'wallets';
```

2. **Check User Permissions:**
```sql
SELECT * FROM auth.users WHERE id = 'USER_ID';
```

3. **Check Table Constraints:**
```sql
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'wallets';
```

4. **Manual Wallet Creation:**
```sql
-- Create wallet for specific user
INSERT INTO wallets (user_id, balance, getdeals_number)
VALUES (
  'USER_ID_HERE',
  0,
  'GD-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
)
RETURNING *;
```

---

**Status:** ✅ Fix Applied & Deployed  
**Next Action:** Test with affected user  
**Updated:** October 7, 2025
