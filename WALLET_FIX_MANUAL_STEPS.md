# Wallet Balance Fix - Manual Sync Script

## Problem
Your 100 KES deposit shows in the inflow tab but the wallet balance hasn't updated.

## Quick Fix - Manual Balance Sync

### Option 1: Run SQL Directly in Supabase (Fastest)

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

2. **Copy and run this SQL**:
   ```sql
   -- First, apply the trigger migration if not already done
   -- Create or replace the trigger function
   CREATE OR REPLACE FUNCTION trigger_sync_wallet_on_transaction_complete()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Only sync if status changed to 'completed'
     IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
        (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
       
       -- Sync the wallet balance using the existing function
       PERFORM sync_wallet_balance(NEW.user_id);
       
       -- Log the balance update for debugging
       RAISE NOTICE 'Wallet balance synced for user_id: %, transaction_id: %, amount: %', 
         NEW.user_id, NEW.id, NEW.amount;
     END IF;
     
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Drop the trigger if it exists
   DROP TRIGGER IF EXISTS sync_wallet_on_transaction_complete ON wallet_transactions;

   -- Create the trigger
   CREATE TRIGGER sync_wallet_on_transaction_complete
     AFTER INSERT OR UPDATE OF status ON wallet_transactions
     FOR EACH ROW
     EXECUTE FUNCTION trigger_sync_wallet_on_transaction_complete();

   -- Grant necessary permissions
   GRANT EXECUTE ON FUNCTION trigger_sync_wallet_on_transaction_complete() TO authenticated;
   GRANT EXECUTE ON FUNCTION sync_wallet_balance(UUID) TO authenticated;
   GRANT EXECUTE ON FUNCTION calculate_wallet_balance(UUID) TO authenticated;
   ```

3. **Then sync your current balance**:
   ```sql
   -- Get your user_id first
   SELECT user_id, balance as old_balance FROM wallets 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');

   -- Sync balance for your account (replace with your user_id from above)
   SELECT sync_wallet_balance('YOUR_USER_ID_HERE'::uuid);

   -- Verify the new balance
   SELECT user_id, balance as new_balance FROM wallets 
   WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
   ```

4. **Or sync ALL users at once**:
   ```sql
   -- Sync balance for all users
   DO $$
   DECLARE 
     wallet_record RECORD;
     calculated_balance NUMERIC;
   BEGIN
     FOR wallet_record IN SELECT user_id FROM wallets LOOP
       calculated_balance := sync_wallet_balance(wallet_record.user_id);
       RAISE NOTICE 'Synced user %: balance = %', wallet_record.user_id, calculated_balance;
     END LOOP;
   END $$;
   ```

### Option 2: Use Supabase CLI (If Installed)

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd "C:\Users\ERIC NDIVO\Desktop\get-deals\getdeals-kenya-showcase"

# Apply the migration
supabase db push

# Then run manual sync
supabase db execute "SELECT sync_wallet_balance(user_id) FROM wallets;"
```

### Option 3: Use the Frontend Force Refresh

If you don't want to touch the database:

1. Log into your account at https://getdeals.co.ke/auth
2. Go to Wallet page
3. The frontend code we updated should automatically refresh when you visit the page
4. If not, the page should have a refresh button

## Verify the Fix

After running the SQL:

1. **Check your balance in the app**:
   - Go to https://getdeals.co.ke/wallet
   - Your balance should now show the correct amount (previous + 100 KES)

2. **Check the database**:
   ```sql
   -- Verify your balance is correct
   SELECT 
     w.user_id,
     w.balance as wallet_balance,
     (SELECT SUM(CASE 
       WHEN type = 'deposit' AND status = 'completed' THEN amount
       WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
       WHEN type = 'payment' AND status = 'completed' THEN -amount
       ELSE 0
     END)
     FROM wallet_transactions wt 
     WHERE wt.user_id = w.user_id) as calculated_balance
   FROM wallets w
   WHERE w.user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
   ```

   Both `wallet_balance` and `calculated_balance` should match.

3. **Check transactions**:
   ```sql
   -- See all your transactions
   SELECT 
     id,
     type,
     amount,
     status,
     created_at,
     completed_at
   FROM wallet_transactions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
   ORDER BY created_at DESC;
   ```

   Your 100 KES deposit should have `status = 'completed'`.

## How It Works Now

After applying this fix:

### Before (Manual Refresh Needed)
```
1. Customer deposits 100 KES
2. Transaction created with status='pending'
3. M-Pesa confirms payment
4. Backend updates transaction status='completed'
5. Transaction appears in inflow tab ✅
6. Wallet balance stays at old value ❌
7. User has to manually refresh or wait
```

### After (Automatic Sync)
```
1. Customer deposits 100 KES
2. Transaction created with status='pending'
3. M-Pesa confirms payment
4. Backend updates transaction status='completed'
5. 🎯 DATABASE TRIGGER FIRES AUTOMATICALLY
6. sync_wallet_balance() recalculates balance from all completed transactions
7. wallets.balance updated instantly ✅
8. Supabase Realtime broadcasts wallet change
9. Frontend receives update and refreshes UI ✅
10. Transaction appears in inflow tab ✅
11. Balance shows correct total ✅
```

## Future Deposits

Once the trigger is installed, **all future deposits will automatically update the balance** without any manual intervention.

## Troubleshooting

### Balance Still Not Updating?

1. **Check if trigger is installed**:
   ```sql
   SELECT trigger_name, event_object_table, action_statement
   FROM information_schema.triggers 
   WHERE trigger_name = 'sync_wallet_on_transaction_complete';
   ```
   Should return 1 row.

2. **Check if transaction is completed**:
   ```sql
   SELECT status FROM wallet_transactions 
   WHERE amount = 100 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   Should return `'completed'`. If it's still `'pending'`, the M-Pesa callback hasn't updated it yet.

3. **Manually trigger sync**:
   ```sql
   SELECT sync_wallet_balance((SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'));
   ```

4. **Check frontend is receiving updates**:
   - Open browser console (F12)
   - Look for: `[WalletContext] Transaction completed, refreshing wallet balance...`

## Next Steps

1. ✅ Apply the trigger migration (SQL above)
2. ✅ Sync your current balance
3. ✅ Verify balance is correct in the app
4. ✅ Test with a new deposit to ensure automatic sync works

---

**Status**: Waiting for you to apply the SQL migration  
**Priority**: HIGH (affects wallet balance accuracy)  
**ETA**: 2 minutes (once SQL is executed)
