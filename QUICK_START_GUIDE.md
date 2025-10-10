# 🎉 Wallet-to-Merchant Payment - Quick Start Guide

**Status:** ✅ **FUNCTIONS DEPLOYED & TESTED**  
**Date:** October 7, 2025

---

## ✅ What's Been Completed

### 1. Edge Functions Deployed ✅
- ✅ `wallet-to-merchant-payment` - Live and responding
- ✅ `wallet-payment-callback` - Ready for Rukisha callbacks

### 2. Environment Variables Configured ✅
- ✅ RUKISHA_API_URL
- ✅ RUKISHA_API_TOKEN  
- ✅ RUKISHA_AGENT_ID (used as `merchant_id` in API calls)

### 3. Function Test ✅
Tested the function deployment - it's responding correctly with 401 (requires user authentication).

---

## ⚡ Next Steps (In Order)

### Step 1: Apply Database Migration ⏳

Go to Supabase SQL Editor:
👉 https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql

Click "New Query" and run this SQL:

```sql
-- Add metadata column to wallet_transactions
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_metadata 
ON wallet_transactions USING GIN (metadata);

-- Update status constraint to include 'processing'
ALTER TABLE wallet_transactions 
DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE wallet_transactions 
ADD CONSTRAINT chk_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

-- Add comment to metadata column
COMMENT ON COLUMN wallet_transactions.metadata IS 'Stores additional payment details including Rukisha API responses, merchant IDs, callback data, etc.';

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS wallet_transactions_updated_at ON wallet_transactions;
CREATE TRIGGER wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_transaction_timestamp();
```

**Expected:** "Success. No rows returned"

---

### Step 2: Configure Rukisha Callback URL ⏳

**Callback URL to configure in Rukisha Dashboard:**
```
https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/wallet-payment-callback
```

**Action Required:**
1. Login to your Rukisha merchant dashboard
2. Navigate to API Settings or Webhooks
3. Add the callback URL above
4. Save the configuration

---

### Step 3: Test End-to-End Payment ⏳

1. **Start the dev server:**
   ```powershell
   npm run dev
   ```

2. **Test the flow:**
   - Login to GetDeals
   - Make sure you have wallet balance (deposit if needed)
   - Add items to cart
   - Go to checkout
   - Select "Pay with Wallet"
   - Enter phone: 254719575272
   - Complete the order

3. **Verify:**
   - Check browser console for logs
   - Verify balance was deducted
   - Check transaction appears in wallet history
   - Verify order was created

---

### Step 4: Monitor Function Logs 🔍

View real-time logs in Supabase Dashboard:
👉 https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/functions

Click on each function to see:
- Request logs
- Response codes
- Error messages
- Performance metrics

---

## 🔧 How the Payment Flow Works

```
User clicks "Place Order" with Wallet
    ↓
Frontend calls WalletPaymentService.initiatePayment()
    ↓
Supabase Edge Function: wallet-to-merchant-payment
    ↓
[1] Verify user is authenticated ✅
[2] Check wallet balance is sufficient ✅
[3] Create transaction record (status: pending) ✅
[4] Call Rukisha API: pay-merchant-with-rukisha ✅
[5] Update transaction (status: processing) ✅
[6] Deduct from wallet balance ✅
[7] Return success to frontend ✅
    ↓
Frontend shows success & redirects to orders
    ↓
--- Meanwhile ---
    ↓
Rukisha completes payment & sends callback
    ↓
Supabase Edge Function: wallet-payment-callback
    ↓
[1] Find transaction by reference ✅
[2] Update status to 'completed' or 'failed' ✅
[3] Rollback balance if payment failed ✅
    ↓
✅ Payment Complete!
```

---

## 📊 Quick Verification Queries

### Check if metadata column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallet_transactions' 
AND column_name = 'metadata';
```

### View recent wallet transactions:
```sql
SELECT 
  id,
  type,
  amount,
  status,
  reference,
  transaction_id,
  metadata,
  created_at
FROM wallet_transactions
ORDER BY created_at DESC
LIMIT 10;
```

### Check wallet balances:
```sql
SELECT 
  w.user_id,
  w.balance,
  w.getdeals_number,
  up.full_name,
  up.email
FROM wallets w
JOIN user_profile up ON w.user_id = up.user_id
ORDER BY w.updated_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: Function returns 401 Unauthorized
**Solution:** This is expected! The function requires user authentication. You must be logged in through the app to use it.

### Issue: "Insufficient balance"
**Solution:** 
1. Check actual balance: `SELECT balance FROM wallets WHERE user_id = 'USER_ID'`
2. Deposit more funds via M-Pesa if needed

### Issue: Transaction stuck in "processing"
**Solution:**
1. Check Rukisha dashboard for payment status
2. Check callback function logs
3. Manually update if confirmed: 
   ```sql
   UPDATE wallet_transactions 
   SET status = 'completed', completed_at = NOW() 
   WHERE id = 'TRANSACTION_ID';
   ```

### Issue: Payment failed but balance was deducted
**Solution:** The callback handler should automatically rollback. If not:
```sql
-- Rollback balance
UPDATE wallets 
SET balance = balance + AMOUNT
WHERE user_id = 'USER_ID';

-- Update transaction
UPDATE wallet_transactions
SET status = 'failed'
WHERE id = 'TRANSACTION_ID';
```

---

## 📱 Test Payment Details

**Test Phone:** 254719575272  
**Test Amount:** KES 100 (minimum)  
**Rukisha Agent ID:** 110 (used as `merchant_id`)

### API Payload Structure

The Edge Function sends this payload to Rukisha:

```json
{
  "merchant_id": "110",           // From RUKISHA_AGENT_ID
  "amount": 100,                  // Payment amount
  "phone": "254719575272",        // Customer phone
  "customer_id": "GD-123456",     // From user profile
  "callback_url": "https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/wallet-payment-callback",
  "reference": "GD1728345678ABCD" // Unique order reference
}
```

**Important:** `merchant_id` is automatically set to your `RUKISHA_AGENT_ID` (110) by the Edge Function.

---

## 🎯 Success Criteria

Before marking this as complete, verify:

- [ ] Database migration applied successfully
- [ ] Functions are deployed and accessible
- [ ] Environment variables are set
- [ ] Rukisha callback URL configured
- [ ] Test payment completes successfully
- [ ] Balance deducts correctly
- [ ] Transaction record created with metadata
- [ ] Order created successfully
- [ ] Callback received and processed
- [ ] No errors in function logs

---

## 📞 Important Links

**Supabase Dashboard:**
https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw

**Functions:**
https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/functions

**SQL Editor:**
https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql

**Database:**
https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/editor

---

## 🚀 Deploy to Production

Once everything is tested and working:

```powershell
# Commit changes
git add .
git commit -m "feat: implement wallet-to-merchant payment integration"

# Push to GitHub
git push origin feature/wallet-to-merchant-payment

# Merge to main (after review)
# Deploy frontend (Vercel will auto-deploy)
```

---

**Current Status:** 🟢 **Ready for Database Migration & Testing**

You're almost done! Just need to:
1. Run the SQL migration (2 minutes)
2. Configure Rukisha callback (5 minutes)
3. Test the payment flow (10 minutes)

Total remaining time: **~20 minutes** ⏱️
