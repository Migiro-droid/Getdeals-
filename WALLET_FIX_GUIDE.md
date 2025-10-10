# 🔧 Wallet Balance Fix - Complete Guide

## Problem Summary
- ✅ 100 KES deposit shows in inflow tab
- ❌ Wallet balance not updated
- 🔍 Root cause: Missing database functions and trigger

## 🚀 Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **getdeals-kenya-showcase**
3. Click **SQL Editor** in the left sidebar
4. Click **"New query"** button

### Step 2: Copy & Run the Complete Fix Script
1. Open the file: `COMPLETE_WALLET_FIX.sql` (in this repository)
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

### Step 3: Wait for Success Messages
You should see output like:
```
✅ Trigger installed successfully!
Synced wallet for user xxx - new balance: 100
Synced wallet for user yyy - new balance: 500
...
```

### Step 4: Verify Your Balance
1. Go to https://getdeals.co.ke/wallet
2. Your balance should now show correctly
3. If not, refresh the page (Ctrl+R)

## What This Script Does

### 1. Creates Missing Functions ✅
```sql
- calculate_wallet_balance(user_id) → Calculates balance from transactions
- sync_wallet_balance(user_id) → Updates wallet balance in database
```

### 2. Creates Automatic Trigger ✅
```sql
- Trigger fires when transaction status becomes 'completed'
- Automatically updates wallet balance
- No manual intervention needed
```

### 3. Fixes Your Current Balance ✅
```sql
- Loops through ALL wallets
- Recalculates balance from completed transactions
- Updates wallet balance immediately
- Your 100 KES will be reflected
```

### 4. Grants Permissions ✅
```sql
- Allows authenticated users to call the functions
- Ensures security with SECURITY DEFINER
```

## Verification Steps

### Check 1: Trigger is Installed
Run this query in Supabase:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'sync_wallet_on_transaction_complete';
```

**Expected Result**: 1 row showing the trigger

### Check 2: Your Balance is Correct
Run this query (replace with your email):
```sql
SELECT 
  u.email,
  w.balance,
  (SELECT COUNT(*) FROM wallet_transactions wt 
   WHERE wt.user_id = w.user_id AND wt.status = 'completed' AND wt.type = 'deposit') as completed_deposits,
  (SELECT SUM(amount) FROM wallet_transactions wt 
   WHERE wt.user_id = w.user_id AND wt.status = 'completed' AND wt.type = 'deposit') as total_deposited
FROM wallets w
JOIN auth.users u ON u.id = w.user_id
WHERE u.email = 'your-email@example.com';
```

**Expected Result**: Balance should match total_deposited

### Check 3: Test Automatic Sync
1. Make a new deposit (e.g., 50 KES)
2. Complete the M-Pesa payment
3. Wait 10-30 seconds
4. Refresh wallet page
5. Balance should update automatically (previous + 50 KES)

## If Balance Still Wrong

### Option A: Manual Sync Your Account
Run this in Supabase (replace with your email):
```sql
-- Get your user_id
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Sync your balance (use the user_id from above)
SELECT sync_wallet_balance('your-user-id-here'::uuid);

-- Verify
SELECT balance FROM wallets WHERE user_id = 'your-user-id-here'::uuid;
```

### Option B: Check Transaction Status
Your 100 KES deposit might still be pending:
```sql
SELECT 
  id,
  amount,
  type,
  status,
  created_at,
  completed_at
FROM wallet_transactions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
ORDER BY created_at DESC
LIMIT 5;
```

If status is `'pending'`, the M-Pesa callback hasn't completed yet.

### Option C: Check for Errors
```sql
-- Check if there are any failed transactions
SELECT * FROM wallet_transactions
WHERE status = 'failed' OR status = 'cancelled'
ORDER BY created_at DESC
LIMIT 10;
```

## Future Deposits

After running this fix:
- ✅ All future deposits will automatically update balance
- ✅ No manual intervention needed
- ✅ Balance updates within seconds of M-Pesa confirmation
- ✅ Real-time updates via Supabase Realtime
- ✅ Frontend automatically refreshes

## Technical Details

### How Balance is Calculated
```sql
Balance = 
  SUM(deposits with status='completed') 
  - SUM(withdrawals with status='completed')
  - SUM(payments with status='completed')
```

Only **completed** transactions count. Pending, failed, or cancelled transactions are ignored.

### When Trigger Fires
- ✅ When new transaction is inserted with status='completed'
- ✅ When existing transaction is updated to status='completed'
- ❌ When transaction stays pending or fails (no balance change)

### Performance Impact
- **Minimal**: Trigger only fires on transaction status changes
- **Fast**: Balance calculation uses indexed queries
- **Scalable**: Works efficiently even with 1000+ transactions

## Troubleshooting

### Error: "function does not exist"
- **Cause**: Script wasn't run completely
- **Fix**: Run the entire `COMPLETE_WALLET_FIX.sql` script again

### Error: "permission denied"
- **Cause**: Insufficient database permissions
- **Fix**: Make sure you're logged in as the project owner in Supabase

### Balance still 0 after running script
- **Cause**: No completed transactions in database
- **Fix**: Check transaction status (might still be pending)

### Balance is negative
- **Cause**: More withdrawals/payments than deposits
- **Fix**: This is correct behavior - check transaction history

## Support

If you're still having issues:
1. Check Supabase logs for errors
2. Verify transaction status in database
3. Try manual sync with `sync_wallet_balance()`
4. Contact support with your user_id and transaction details

---

**Status**: Ready to fix! 🛠️  
**Time**: ~5 minutes  
**Difficulty**: Easy (just copy/paste SQL)  
**Result**: Wallet balance will be fixed immediately
