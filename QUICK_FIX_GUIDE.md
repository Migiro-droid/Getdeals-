# Quick Fix Guide - Payment Amount & Sender Name

## ⚠️ Issue: "relation 'public.transaction_logs' does not exist"

**Cause**: The migration script references a table that may not exist in your database yet.

**Solution**: Use the simplified migration instead.

---

## 🚀 Quick Deployment Steps

### Option 1: Simple Migration (RECOMMENDED)
Use this if you just need to add sender_name to payments table:

```sql
-- File: migrations/20251007_add_sender_name_simple.sql
-- Run this in Supabase SQL Editor

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name TEXT;
COMMENT ON COLUMN public.payments.sender_name IS 'Name of the M-Pesa sender (FirstName + MiddleName + LastName from callback)';
CREATE INDEX IF NOT EXISTS idx_payments_sender_name ON public.payments(sender_name);
```

**✅ This is standalone and has zero dependencies!**

---

### Option 2: Full Migration (If transaction_logs exists)
If you've already run migration `20250930_add_transaction_logging.sql`, use:

```bash
# File: migrations/20251007_fix_payment_amount_and_add_sender.sql
# This handles transaction_logs table gracefully
```

---

## 📋 Complete Checklist

### 1. Apply Database Migration

**In Supabase Dashboard → SQL Editor:**

```sql
-- Copy and paste this:
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name TEXT;
COMMENT ON COLUMN public.payments.sender_name IS 'Name of the M-Pesa sender (FirstName + MiddleName + LastName from callback)';
CREATE INDEX IF NOT EXISTS idx_payments_sender_name ON public.payments(sender_name);
```

Click **RUN** ✅

---

### 2. Verify Migration Success

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name = 'sender_name';

-- Expected result: One row showing sender_name | text
```

---

### 3. Commit Code Changes

The code changes are already done! Just commit:

```powershell
git add .
git commit -m "fix: capture M-Pesa sender name and ensure accurate payment amounts

- Add sender_name column to payments table
- Capture FirstName/MiddleName/LastName from M-Pesa callback
- Clarify payment amount calculation logic (pickup vs delivery)
- Update documentation with sender_name field"

git push origin main
```

---

### 4. Test the Fix

After deployment, make a test payment and verify:

```sql
-- Check recent payments have sender names
SELECT 
  created_at,
  phone_number,
  sender_name,
  amount / 100.0 as amount_kes,
  status
FROM payments 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Expected**: New payments should have `sender_name` populated like "John Kamau Mwangi"

---

## 🎯 What Was Fixed

### Fix #1: Sender Name Capture ✅
- **Before**: M-Pesa sender name was ignored
- **After**: Full name captured and stored in `payments.sender_name`
- **Code**: Updated `api/payments/mpesa/callback.ts` to extract FirstName, MiddleName, LastName

### Fix #2: Payment Amount Accuracy ✅
- **Before**: Logic was correct, but not clearly documented
- **After**: Added explicit comments explaining pickup (no fee) vs delivery (+KES 200)
- **Code**: Enhanced `src/pages/CheckoutPage.tsx` with clear comments

---

## 📊 Verification Queries

### Test Pickup Order Amount
```sql
SELECT 
  o.order_reference,
  o.delivery_method,
  o.delivery_fee / 100.0 as delivery_fee_kes,
  p.amount / 100.0 as payment_amount_kes,
  p.sender_name
FROM orders o
JOIN payments p ON p.order_id = o.id
WHERE o.delivery_method = 'pickup'
  AND o.created_at > NOW() - INTERVAL '24 hours';

-- Pickup orders should have delivery_fee = 0
```

### Test Delivery Order Amount
```sql
SELECT 
  o.order_reference,
  o.delivery_method,
  o.delivery_fee / 100.0 as delivery_fee_kes,
  p.amount / 100.0 as payment_amount_kes,
  p.sender_name
FROM orders o
JOIN payments p ON p.order_id = o.id
WHERE o.delivery_method = 'speedy'
  AND o.created_at > NOW() - INTERVAL '24 hours';

-- Speedy orders should have delivery_fee = 200
```

---

## 🆘 Troubleshooting

### Problem: Still getting "relation does not exist" error

**Solution**: Use the simple migration only
```sql
-- Just run this minimal version:
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_sender_name ON public.payments(sender_name);
```

### Problem: Sender name is NULL after payment

**Possible causes**:
1. Code not deployed yet → Redeploy backend
2. M-Pesa didn't send name data → Check callback logs
3. Old payment records → Only new payments will have names

**Check**:
```sql
-- See callback data
SELECT callback_data 
FROM transaction_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 1;

-- Look for FirstName, MiddleName, LastName in the JSON
```

---

## ✅ Success Criteria

- [ ] Migration runs without errors
- [ ] `sender_name` column exists in payments table
- [ ] Index created on sender_name
- [ ] Code deployed to production
- [ ] New payments show sender names
- [ ] Pickup orders have correct amounts (no delivery fee)
- [ ] Delivery orders have correct amounts (+ KES 200)

---

## 📞 Need Help?

If you see any errors, check:
1. Supabase connection is active
2. You're running the SQL in the correct database
3. You have proper permissions (should be database owner)

**Quick Test**:
```sql
-- This should work if everything is set up
SELECT * FROM payments LIMIT 1;
```

If this works, the simple migration will work too!

---

**Ready?** Just copy-paste the simple migration into Supabase SQL Editor and click RUN! 🚀
