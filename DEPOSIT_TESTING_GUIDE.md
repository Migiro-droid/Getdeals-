# Rukisha Deposit Testing Guide

## Pre-Testing Setup

1. **Deploy the Edge Functions** (see `RUKISHA_DEPOSIT_DEPLOYMENT.md`)
2. **Run Database Migration** (`WALLET_TRANSACTIONS_MIGRATION.md`)
3. **Set Environment Variables** in Supabase Dashboard
4. **Configure Rukisha Webhook** (contact Rukisha support)

## Test Flow

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Go to Wallet Page
1. Navigate to http://localhost:8080/wallet
2. Make sure you're logged in with a KYC-verified account
3. You should see the full wallet interface (not the KYC status check)

### Step 3: Test Deposit Validation
Try these scenarios to test error handling:

**❌ Invalid Amounts:**
- Enter `50` → Should show "Amount Too Low" error
- Enter `150000` → Should show "Amount Too High" error

**✅ Valid Amounts:**
- Enter `500` → Should proceed to STK Push
- Use quick buttons (+KES 1,000, +KES 2,000, etc.)

### Step 4: Test STK Push Flow
1. **Enter valid amount** (e.g., KES 500)
2. **Click "Deposit"** button
3. **Expected behavior:**
   - Button shows loading spinner
   - Toast appears: "📱 STK Push Sent!"
   - Input field clears
   - Check your phone for M-Pesa prompt

### Step 5: Complete Payment
1. **On your phone:** Enter M-Pesa PIN when prompted
2. **Expected results:**
   - Payment confirmation SMS from M-Pesa
   - Wallet balance should update within 30 seconds
   - Transaction should appear in "Recent Activity"

## What to Monitor

### Browser Console Logs
Look for these messages in Developer Tools:
```
🚀 Initiating deposit: {amount: 500, phone: "****"}
✅ Deposit initiated successfully: transaction_id_123
```

### Supabase Edge Function Logs
Check Supabase Dashboard → Edge Functions → Logs for:
- Deposit requests received
- Rukisha API responses
- Callback processing

### Database Changes
Check these tables in Supabase SQL Editor:
```sql
-- Check transaction was created
SELECT * FROM wallet_transactions WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 5;

-- Check wallet balance updated
SELECT balance FROM wallets WHERE user_id = 'your-user-id';
```

## Expected Results

### ✅ Successful Deposit:
1. STK Push sent notification
2. User completes M-Pesa payment
3. Wallet balance increases by deposit amount
4. Transaction status: `pending` → `completed`
5. Transaction appears in Recent Activity

### ❌ Failed/Cancelled Deposit:
1. STK Push sent notification
2. User cancels or payment times out
3. Wallet balance remains unchanged
4. Transaction status: `pending` → `failed`/`cancelled`

## Troubleshooting

### Common Issues:

**"Phone Number Required" Error:**
- Ensure KYC is completed with a valid phone number
- Check that `phoneNumber` field exists in `wallet_kyc` table

**"Wallet service unavailable" Error:**
- Check edge function deployment
- Verify environment variables are set
- Check Supabase function logs for errors

**STK Push not received:**
- Verify phone number format (+254 or 07XX)
- Check Rukisha API credentials
- Ensure phone has good network signal

**Balance not updating:**
- Check if webhook URL is configured in Rukisha
- Verify callback function is deployed
- Check callback function logs

## Production Considerations

Before going live:
1. **Real Rukisha API credentials** (not test credentials)
2. **Webhook URL configured** in Rukisha dashboard
3. **Rate limiting** on edge functions
4. **Transaction monitoring** and alerting
5. **User notifications** via SMS/email for successful deposits

## Success Metrics

A fully working implementation should achieve:
- ✅ STK Push delivery rate: >95%
- ✅ Payment success rate: >80%
- ✅ Balance update latency: <30 seconds
- ✅ Zero false positive balance updates
- ✅ Complete transaction audit trail