# Wallet Balance Sync Fix

## Problem
After making a successful deposit, the inflow tab showed the transaction but the wallet balance did not update automatically. The balance remained at its previous value instead of reflecting the new deposit.

## Root Cause
The wallet balance was not being automatically synchronized when transactions changed status to `completed`. While the database had functions to calculate and sync wallet balance (`calculate_wallet_balance`, `sync_wallet_balance`), there was no trigger to automatically call these functions when a transaction was completed.

## Solution

### 1. Database Trigger (Primary Fix)
**File**: `supabase/migrations/20251010_add_wallet_balance_sync_trigger.sql`

Created a database trigger that automatically updates the wallet balance whenever a `wallet_transaction` is inserted or updated to `completed` status.

```sql
CREATE TRIGGER sync_wallet_on_transaction_complete
  AFTER INSERT OR UPDATE OF status ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_on_transaction_complete();
```

**How it works**:
1. Monitors `wallet_transactions` table for INSERT or UPDATE operations
2. When a transaction status changes to `completed`, the trigger fires
3. Calls `sync_wallet_balance(user_id)` function
4. The function recalculates balance from all completed transactions
5. Updates the `wallets` table with the correct balance

### 2. Frontend Refresh (Backup Fix)
**File**: `src/contexts/NewWalletContext.tsx`

Added automatic wallet refresh in the Supabase Realtime subscription handler when a transaction completes.

```typescript
// If transaction just completed, refresh wallet balance to sync
if (newTransaction.status === 'completed') {
  console.log('[WalletContext] Transaction completed, refreshing wallet balance...');
  refreshWallet();
}
```

**How it works**:
1. Subscribes to real-time changes on `wallet_transactions` table
2. When a transaction status changes to `completed`, triggers `refreshWallet()`
3. Fetches the updated balance from the database
4. Updates the React state with the new balance

## Technical Flow

### Before Fix
```
1. Customer deposits 100 KES
2. Transaction created with status='pending'
3. M-Pesa confirms payment
4. Backend updates transaction status='completed'
5. Transaction appears in inflow tab ✅
6. Wallet balance stays at old value ❌
```

### After Fix
```
1. Customer deposits 100 KES
2. Transaction created with status='pending'
3. M-Pesa confirms payment
4. Backend updates transaction status='completed'
5. Database trigger fires automatically
6. sync_wallet_balance() recalculates balance
7. wallets.balance updated to new value
8. Supabase Realtime broadcasts wallet change
9. Frontend receives wallet update
10. Balance UI updates automatically ✅
11. Transaction appears in inflow tab ✅
```

## Balance Calculation Logic

The `calculate_wallet_balance()` function computes balance from ALL completed transactions:

```sql
SELECT COALESCE(SUM(
  CASE 
    WHEN type = 'deposit' AND status = 'completed' THEN amount
    WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
    WHEN type = 'payment' AND status = 'completed' THEN -amount
    ELSE 0
  END
), 0) 
FROM wallet_transactions
WHERE user_id = p_user_id;
```

**Transaction Types**:
- **deposit**: Adds to balance (+)
- **withdrawal**: Subtracts from balance (-)
- **payment**: Subtracts from balance (-)

**Only Completed Transactions Count**: Pending, failed, or cancelled transactions are ignored.

## Files Modified

1. **supabase/migrations/20251010_add_wallet_balance_sync_trigger.sql** (NEW)
   - Database trigger for automatic balance sync
   - Trigger function implementation
   - Permission grants

2. **src/contexts/NewWalletContext.tsx** (MODIFIED)
   - Added balance refresh when transaction completes
   - Updated useEffect dependencies
   - Added console logging for debugging

## Testing

### Manual Test Steps
1. Log in to your account
2. Navigate to Wallet page
3. Note current balance (e.g., 0 KES)
4. Click "Deposit Funds"
5. Enter amount (e.g., 100 KES) and phone number
6. Complete M-Pesa payment on your phone
7. Wait for transaction to complete (~10-30 seconds)
8. **EXPECTED**: Balance updates automatically from 0 to 100 KES
9. Check "Inflow" tab to verify transaction appears
10. Check "Balance" tab to verify balance reflects new total

### What to Verify
- ✅ Transaction appears in Inflow tab with "completed" status
- ✅ Balance shows correct total (previous + deposit amount)
- ✅ Balance updates happen automatically (no manual refresh needed)
- ✅ Multiple deposits accumulate correctly
- ✅ Wallet balance persists after page refresh

## Deployment

### Apply Migration
The migration needs to be applied to your Supabase project:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manual (via Supabase Dashboard)
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy contents of 20251010_add_wallet_balance_sync_trigger.sql
# 3. Run the SQL
```

### Verify Deployment
```sql
-- Check if trigger exists
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_wallet_on_transaction_complete';

-- Should return 1 row showing the trigger details
```

## Rollback Plan

If issues occur, you can disable the trigger without data loss:

```sql
-- Disable trigger
DROP TRIGGER IF EXISTS sync_wallet_on_transaction_complete ON wallet_transactions;

-- Re-enable later if needed (just re-run the migration file)
```

## Performance Considerations

### Trigger Performance
- **Impact**: Minimal - only fires on transaction status change
- **Frequency**: Low - deposits happen infrequently compared to page views
- **Cost**: Single UPDATE query per completed transaction
- **Benefit**: Real-time balance accuracy

### Database Load
- Each completed transaction triggers 1 balance calculation
- Balance calculation scans all user's completed transactions
- For users with 1000+ transactions, consider adding indexes:

```sql
-- Add index if performance issues arise
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_status 
ON wallet_transactions(user_id, status) 
WHERE status = 'completed';
```

## Future Enhancements

1. **Optimistic Updates**: Update UI immediately, roll back if sync fails
2. **Balance Cache**: Cache calculated balance with TTL for faster reads
3. **Balance History**: Track balance changes over time for analytics
4. **Batch Processing**: For high-volume users, batch balance updates
5. **Audit Trail**: Log all balance changes for compliance

## Related Documentation
- [Wallet Transaction Recording](./TRANSACTION_RECORDING_COMPLETE.md)
- [Wallet Balance Fix](./WALLET_BALANCE_FIX_COMPLETE.md)
- [M-Pesa Integration](./MPESA_INTEGRATION.md)

---

**Issue**: Wallet balance not updating after deposit  
**Status**: ✅ RESOLVED  
**Date**: October 10, 2025  
**Branch**: feature/order-notification-indicator (will merge to main)
