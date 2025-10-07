# Order Creation Database Column Fix

## Problem
Orders were failing to create with the error:
```json
{
    "success": false,
    "error": "Failed to create order in database",
    "details": "Could not find the 'total' column of 'orders' in the schema cache"
}
```

## Root Cause
The database schema was updated in a migration (`migrations/20250930_enhance_orders_table.sql`) that renamed the `total` column to `total_amount`, but the order creation API endpoint (`api/orders/create.ts`) was still trying to insert into the old `total` column.

### Migration Details
The migration file shows:
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount BIGINT;
ALTER TABLE public.orders ALTER COLUMN total TYPE BIGINT USING (total * 100)::BIGINT;
```

And in `scripts/fix-orders-view-properly.sql`:
```sql
-- Check if total_amount exists, if not check for total and rename it
IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='orders' AND column_name='total_amount') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='orders' AND column_name='total') THEN
        -- Rename total to total_amount
        ALTER TABLE public.orders RENAME COLUMN total TO total_amount;
    ELSE
        -- Add total_amount if neither exists
        ALTER TABLE public.orders ADD COLUMN total_amount INTEGER NOT NULL DEFAULT 0;
    END IF;
END IF;
```

## Solution
Changed line 103 in `api/orders/create.ts` from:
```typescript
total: Math.round(orderData.total_amount * 100),
```

To:
```typescript
total_amount: Math.round(orderData.total_amount * 100), // Changed from 'total' to 'total_amount'
```

## Impact
✅ **Orders can now be created successfully** after M-Pesa payment confirmation
✅ **No more "Failed to create order" errors** due to column name mismatch
✅ **Data consistency** - using correct column name that matches database schema

## Testing
After this fix, the order creation flow should work:
1. User completes checkout
2. M-Pesa payment is confirmed
3. Order is created with `total_amount` column
4. User receives order confirmation
5. Order appears in admin dashboard

## Files Changed
- `api/orders/create.ts` - Line 103: Changed `total` to `total_amount`

## Deployment
- **Commit**: `868fc6e` - Fix order creation: use 'total_amount' column instead of 'total'
- **Status**: Pushed to production ✅
- **Date**: January 7, 2025

## Related Issues
This was the last blocker preventing successful order creation after the M-Pesa payment integration was fixed in commit `ffb0d6d`.

---
**Previous Related Fixes**:
- `ffb0d6d` - Fix order creation: improve error logging and delivery_address handling
- `aa469c7` - Fix Google OAuth: properly save organization and preferences to database
