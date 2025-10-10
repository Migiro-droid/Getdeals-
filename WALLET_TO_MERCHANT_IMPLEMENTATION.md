# Wallet-to-Merchant Payment Integration - Complete Implementation

**Branch:** `feature/wallet-to-merchant-payment`  
**Date:** October 7, 2025  
**Status:** ✅ Implementation Complete - Ready for Testing

---

## 🎯 Overview

This implementation enables users to pay directly from their GetDeals wallet to the merchant account using the Rukisha "tap-and-go/pay-merchant-with-rukisha" API endpoint.

### Key Features:
- ✅ Real wallet-to-merchant fund transfers (not just database deductions)
- ✅ Integration with Rukisha payment API
- ✅ Proper transaction recording and status tracking
- ✅ Automatic balance updates and rollbacks on failure
- ✅ Webhook/callback support for async payment confirmation
- ✅ Comprehensive error handling and logging

---

## 📁 Files Created/Modified

### New Files Created:

1. **`supabase/functions/wallet-to-merchant-payment/index.ts`**
   - Main Edge Function for processing wallet-to-merchant payments
   - Validates user balance and authentication
   - Calls Rukisha API to transfer funds
   - Records transaction with full details

2. **`supabase/functions/wallet-payment-callback/index.ts`**
   - Callback handler for Rukisha payment status updates
   - Updates transaction status (completed/failed)
   - Handles balance rollback on payment failure
   - Logs all callback data for debugging

3. **`supabase/migrations/20251007_add_metadata_to_wallet_transactions.sql`**
   - Adds `metadata` JSONB column to wallet_transactions table
   - Adds 'processing' status to transaction status enum
   - Creates indexes for better query performance
   - Adds automatic timestamp update trigger

4. **`WALLET_PAYMENT_ANALYSIS.md`**
   - Comprehensive analysis of the problem and solution
   - Documents the payment flow and architecture

5. **`WALLET_TO_MERCHANT_IMPLEMENTATION.md`** (this file)
   - Complete implementation guide and documentation

### Files Modified:

1. **`src/services/WalletPaymentService.ts`**
   - Updated to call new `wallet-to-merchant-payment` Edge Function
   - Added `description` field support
   - Enhanced response types with transaction IDs

2. **`src/pages/CheckoutPage.tsx`**
   - Replaced `WalletService.recordWithdrawal()` with `WalletPaymentService.initiatePayment()`
   - Now calls Rukisha API for actual fund transfers
   - Enhanced success message with transaction ID

3. **`.env.example`**
   - Added Rukisha configuration variables documentation

---

## 🔌 API Integration Details

### Rukisha API Endpoint:
```
POST https://api.rukisha.com/api/tap-and-go/pay-merchant-with-rukisha
```

### Required Headers:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_RUKISHA_API_TOKEN",
  "Accept": "application/json"
}
```

### Request Payload:
```json
{
  "merchant_id": "110",  // From RUKISHA_AGENT_ID env variable
  "amount": 1000,
  "phone": "254712345678",
  "customer_id": "USER_CUSTOMER_ID",
  "callback_url": "https://YOUR_DOMAIN/functions/v1/wallet-payment-callback",
  "reference": "GD1728345678ABCD"
}
```

**Important Notes:**
- `merchant_id` is automatically set from `RUKISHA_AGENT_ID` environment variable
- If `RUKISHA_MERCHANT_ID` is set, it takes precedence over `RUKISHA_AGENT_ID`
- For GetDeals, `merchant_id` = "110" (your agent ID)

### Expected Response (Success):
```json
{
  "success": true,
  "transaction_id": "RUK123456789",
  "status": "processing",
  "message": "Payment initiated successfully"
}
```

### Expected Response (Error):
```json
{
  "success": false,
  "error": "Insufficient balance",
  "message": "Customer wallet has insufficient funds"
}
```

---

## 🗄️ Database Schema Updates

### wallet_transactions Table (New Fields):

```sql
-- Metadata column stores additional payment details
metadata JSONB DEFAULT '{}'::jsonb

-- Example metadata structure:
{
  "merchant_id": "110",
  "customer_id": "GD-123456",
  "payment_type": "wallet_to_merchant",
  "rukisha_response": { ... },
  "rukisha_status": "processing",
  "callback_received": true,
  "callback_timestamp": "2025-10-07T12:34:56Z",
  "confirmation_code": "ABC123XYZ"
}
```

### Transaction Status Flow:

```
pending → processing → completed ✅
                     → failed ❌ (with balance rollback)
```

---

## 🔐 Environment Variables Required

Add these to your `.env` file and Supabase Edge Functions environment:

```bash
# Rukisha Payment Configuration
RUKISHA_API_TOKEN="179568|hA8CTcN7aMwsZWbwPxPF2gSYkjbtTsN0fV8izUW0"
RUKISHA_MERCHANT_ID="YOUR_MERCHANT_ID"  # Or use RUKISHA_AGENT_ID
RUKISHA_AGENT_ID="110"

# Supabase (already configured)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Setting Environment Variables in Supabase:

```bash
# Deploy the functions first
supabase functions deploy wallet-to-merchant-payment
supabase functions deploy wallet-payment-callback

# Set environment variables
supabase secrets set RUKISHA_API_TOKEN="your-token-here"
supabase secrets set RUKISHA_MERCHANT_ID="your-merchant-id"
supabase secrets set RUKISHA_AGENT_ID="110"
```

---

## 🚀 Deployment Steps

### 1. Run Database Migration

```bash
# Apply the metadata column migration
supabase db push
```

Or manually run the SQL:
```bash
supabase db execute -f supabase/migrations/20251007_add_metadata_to_wallet_transactions.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy wallet-to-merchant payment function
supabase functions deploy wallet-to-merchant-payment

# Deploy callback handler
supabase functions deploy wallet-payment-callback
```

### 3. Configure Environment Variables

```bash
# Set Rukisha credentials
supabase secrets set RUKISHA_API_TOKEN="your-actual-token"
supabase secrets set RUKISHA_MERCHANT_ID="your-merchant-id"
supabase secrets set RUKISHA_AGENT_ID="110"
```

### 4. Test the Integration

See Testing section below.

### 5. Deploy Frontend Changes

```bash
# Commit changes
git add .
git commit -m "feat: implement wallet-to-merchant payment integration"

# Push to remote
git push origin feature/wallet-to-merchant-payment

# Deploy to Vercel (if using Vercel)
vercel --prod
```

---

## 🧪 Testing Guide

### Test 1: Check Edge Function Deployment

```bash
# Test if function is deployed and accessible
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/wallet-to-merchant-payment' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "amount": 100,
    "phone": "254712345678",
    "reference": "TEST123"
  }'
```

Expected: Should return error about authentication (because no user token provided), but confirms function is deployed.

### Test 2: Verify Database Migration

```sql
-- Check if metadata column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'wallet_transactions' 
  AND column_name = 'metadata';

-- Check if 'processing' status is allowed
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'chk_status';
```

### Test 3: End-to-End Payment Test

1. **Ensure you have wallet balance:**
   - Go to Wallet page
   - Add funds via M-Pesa deposit
   - Verify balance shows up

2. **Make a test purchase:**
   - Add items to cart
   - Go to checkout
   - Select "Pay with Wallet"
   - Enter your phone number
   - Click "Place Order"

3. **Verify transaction:**
   - Check browser console for logs
   - Go to Account → Wallet → Transactions
   - Should see new transaction with status "processing" or "completed"
   - Check wallet balance was deducted

4. **Check database:**
```sql
SELECT 
  id, 
  type, 
  amount, 
  status, 
  reference,
  transaction_id,
  metadata->>'rukisha_status' as rukisha_status,
  created_at
FROM wallet_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

### Test 4: Callback Handler Test

```bash
# Simulate a callback from Rukisha
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/wallet-payment-callback' \
  --header 'Content-Type: application/json' \
  --data '{
    "transaction_id": "RUK123456",
    "reference": "GD1728345678ABCD",
    "status": "completed",
    "amount": 1000,
    "phone": "254712345678",
    "confirmation_code": "ABC123",
    "timestamp": "2025-10-07T12:34:56Z"
  }'
```

Expected: Should return success and update transaction status.

---

## 🔍 Monitoring & Debugging

### View Edge Function Logs:

```bash
# Real-time logs
supabase functions logs wallet-to-merchant-payment --tail

# Callback handler logs
supabase functions logs wallet-payment-callback --tail
```

### Check Transaction Status:

```sql
-- Get recent wallet transactions with details
SELECT 
  wt.id,
  wt.user_id,
  wt.type,
  wt.amount,
  wt.status,
  wt.reference,
  wt.transaction_id,
  wt.phone_number,
  wt.description,
  wt.metadata,
  wt.created_at,
  wt.completed_at,
  up.full_name,
  up.email
FROM wallet_transactions wt
LEFT JOIN user_profile up ON wt.user_id = up.user_id
WHERE wt.type = 'payment'
ORDER BY wt.created_at DESC
LIMIT 20;
```

### Check for Failed Payments:

```sql
SELECT 
  id,
  reference,
  amount,
  status,
  metadata->>'error' as error_message,
  metadata->>'rukisha_response' as rukisha_response,
  created_at
FROM wallet_transactions
WHERE status = 'failed'
  AND type = 'payment'
ORDER BY created_at DESC;
```

### Balance Reconciliation:

```sql
-- Verify wallet balance matches transaction history
SELECT 
  w.user_id,
  w.balance as current_balance,
  COALESCE(SUM(
    CASE 
      WHEN wt.type = 'deposit' THEN wt.amount
      WHEN wt.type = 'payment' OR wt.type = 'withdrawal' THEN -wt.amount
      ELSE 0
    END
  ), 0) as calculated_balance
FROM wallets w
LEFT JOIN wallet_transactions wt ON w.user_id = wt.user_id AND wt.status = 'completed'
GROUP BY w.user_id, w.balance
HAVING w.balance != COALESCE(SUM(
  CASE 
    WHEN wt.type = 'deposit' THEN wt.amount
    WHEN wt.type = 'payment' OR wt.type = 'withdrawal' THEN -wt.amount
    ELSE 0
  END
), 0);
```

---

## 🔒 Security Considerations

### 1. Balance Verification
- ✅ Balance is checked BEFORE calling Rukisha API
- ✅ User must be authenticated (JWT token required)
- ✅ Atomic balance updates (prevents race conditions)

### 2. Transaction Integrity
- ✅ Transaction record created BEFORE deducting balance
- ✅ Status tracking: pending → processing → completed/failed
- ✅ Automatic rollback on failure

### 3. API Security
- ✅ Rukisha API token stored as Supabase secret (not in code)
- ✅ Service role key used for database operations
- ✅ User authentication required for all requests

### 4. Callback Security
**⚠️ TODO:** Add webhook signature verification
- Currently callback endpoint is public
- Should verify requests are actually from Rukisha
- Consider adding IP whitelist or HMAC signature validation

---

## 📊 Payment Flow Diagram

```
User Clicks "Place Order" (Wallet Payment)
    ↓
CheckoutPage.tsx calls WalletPaymentService.initiatePayment()
    ↓
Frontend → Supabase Edge Function (wallet-to-merchant-payment)
    ↓
[Edge Function] Verify user authentication
    ↓
[Edge Function] Check wallet balance (sufficient?)
    ↓
[Edge Function] Create transaction record (status: pending)
    ↓
[Edge Function] Call Rukisha API: pay-merchant-with-rukisha
    ↓
[Rukisha] Process payment request
    ↓
[Rukisha] Return immediate response (success/failure)
    ↓
[Edge Function] Update transaction (status: processing)
[Edge Function] Deduct wallet balance (optimistic update)
    ↓
[Edge Function] Return success to frontend
    ↓
Frontend shows success message & redirects to orders
    ↓
--- Meanwhile, Rukisha completes payment ---
    ↓
[Rukisha] Sends callback to wallet-payment-callback function
    ↓
[Callback Function] Find transaction by reference
[Callback Function] Update status (completed/failed)
[Callback Function] Rollback balance if failed
    ↓
✅ Payment Complete
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Missing RUKISHA_API_TOKEN"

**Solution:**
```bash
supabase secrets set RUKISHA_API_TOKEN="your-token"
```

### Issue 2: "Wallet not found"

**Cause:** User doesn't have a wallet record  
**Solution:** Ensure wallet is created on user signup. Check:
```sql
SELECT * FROM wallets WHERE user_id = 'USER_ID';
```

### Issue 3: "Insufficient balance" (but balance shows in UI)

**Cause:** Race condition or caching  
**Solution:** 
- Refresh wallet data before payment
- Check actual database balance:
```sql
SELECT balance FROM wallets WHERE user_id = 'USER_ID';
```

### Issue 4: Balance deducted but payment failed

**Cause:** Rukisha API returned error after balance was deducted  
**Solution:** 
- Callback handler should automatically rollback
- Manual rollback if needed:
```sql
UPDATE wallets 
SET balance = balance + AMOUNT
WHERE user_id = 'USER_ID';

UPDATE wallet_transactions
SET status = 'failed'
WHERE id = 'TRANSACTION_ID';
```

### Issue 5: Transaction stuck in "processing"

**Cause:** Callback never received from Rukisha  
**Solution:**
- Check Rukisha logs/dashboard
- Manually update status if confirmed:
```sql
UPDATE wallet_transactions
SET status = 'completed', completed_at = NOW()
WHERE id = 'TRANSACTION_ID';
```

---

## 📈 Next Steps & Improvements

### Phase 2 Enhancements:

1. **Add Webhook Security**
   - Implement HMAC signature verification for callbacks
   - Add IP whitelist for Rukisha servers

2. **Transaction Monitoring Dashboard**
   - Create admin panel to view all wallet transactions
   - Add filters for status, date range, amount
   - Show success/failure rates

3. **Automated Reconciliation**
   - Daily cron job to check transaction statuses
   - Auto-update stuck "processing" transactions
   - Generate reconciliation reports

4. **Enhanced Error Handling**
   - Retry failed transactions automatically
   - Send email notifications for failed payments
   - Add customer support ticket creation for issues

5. **Performance Optimization**
   - Add Redis caching for wallet balances
   - Batch transaction updates
   - Optimize database queries with better indexes

6. **User Notifications**
   - SMS notification on payment success/failure
   - Push notifications for transaction updates
   - Email receipts for completed payments

---

## ✅ Checklist Before Going Live

- [ ] Database migration applied successfully
- [ ] Edge functions deployed and accessible
- [ ] Environment variables configured in Supabase
- [ ] Test transactions completed successfully
- [ ] Callback handler tested and working
- [ ] Error handling tested (insufficient balance, API errors)
- [ ] Balance rollback tested on failed payments
- [ ] Frontend changes deployed
- [ ] Transaction logs reviewed for errors
- [ ] Balance reconciliation verified
- [ ] Rukisha merchant account confirmed active
- [ ] Callback URL whitelisted in Rukisha dashboard
- [ ] Documentation shared with team
- [ ] Customer support trained on new flow
- [ ] Monitoring/alerting configured

---

## 📞 Support & Contacts

**Developer:** EricNdivo  
**Repository:** https://github.com/EricNdivo/getdeals-kenya-showcase  
**Branch:** feature/wallet-to-merchant-payment  

**Rukisha Support:**
- Contact Rukisha to confirm merchant_id and API access
- Request callback URL whitelisting
- Verify API token permissions

---

## 📝 Commit & Merge Instructions

```bash
# Review all changes
git status

# Add all modified and new files
git add .

# Commit with descriptive message
git commit -m "feat: implement wallet-to-merchant payment integration

- Add Rukisha pay-merchant-with-rukisha API integration
- Create wallet-to-merchant-payment Edge Function
- Add callback handler for payment status updates
- Update CheckoutPage to use new payment flow
- Add metadata column to wallet_transactions
- Implement balance rollback on failed payments
- Add comprehensive error handling and logging

Closes #XXX"

# Push to remote
git push origin feature/wallet-to-merchant-payment

# Create Pull Request on GitHub
# After review and testing, merge to main
```

---

**Implementation Status:** ✅ COMPLETE  
**Last Updated:** October 7, 2025  
**Ready for:** Testing & Deployment
