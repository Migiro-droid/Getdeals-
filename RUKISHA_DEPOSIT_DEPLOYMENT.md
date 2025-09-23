# Rukisha Deposit Integration Deployment Guide

## Step 1: Deploy Edge Functions via Supabase Dashboard

### Deploy deposit-funds function:
1. Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw
2. Navigate to **Database** → **Functions** (or **Edge Functions**)
3. Click **"Create a new function"**
4. Function name: `deposit-funds`
5. Copy and paste the code from `supabase/functions/deposit-funds/index.ts`

### Deploy rukisha-callback function:
1. Click **"Create a new function"**
2. Function name: `rukisha-callback`
3. Copy and paste the code from `supabase/functions/rukisha-callback/index.ts`

## Step 2: Run Database Migration

Run the SQL from `WALLET_TRANSACTIONS_MIGRATION.md` in your Supabase SQL Editor to create the wallet_transactions table.

## Step 3: Configure Environment Variables

In Supabase Dashboard → **Settings** → **Edge Functions**, add these environment variables:

```
RUKISHA_API_URL=https://api.rukisha.com/api/tap-and-go
RUKISHA_API_TOKEN=your_actual_rukisha_api_token_here
RUKISHA_AGENT_ID=110
```

## Step 4: Set Up Rukisha Webhook

**Important**: You need to configure Rukisha to send deposit callbacks to your Supabase function.

Contact Rukisha support or check their dashboard to set the webhook URL to:
```
https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/rukisha-callback
```

This URL will receive notifications when STK Push payments are completed, failed, or cancelled.

## Step 5: Function URLs

After deployment, your functions will be available at:
- **Deposit initiation**: `https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/deposit-funds`
- **Payment callback**: `https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/rukisha-callback`

## Step 6: Test the Integration

1. Run `npm run dev`
2. Go to http://localhost:8080/wallet
3. Make sure you're logged in with a verified KYC account
4. Try depositing KES 500 or KES 1,000
5. You should receive an STK Push on your phone
6. Complete the payment to test the full flow

## How It Works

### Deposit Flow:
1. **User clicks deposit** → Frontend calls `/deposit-funds` edge function
2. **Edge function** → Calls Rukisha STK Push API
3. **Rukisha** → Sends STK Push to user's phone
4. **User completes payment** → Rukisha calls `/rukisha-callback`
5. **Callback function** → Updates wallet balance and transaction status

### Database Updates:
- `wallet_transactions` table tracks all deposit attempts
- `wallets` table balance is updated only after confirmed payment
- Transaction status: `pending` → `completed`/`failed`/`cancelled`

## Error Handling

The system handles:
- ✅ Invalid amounts (< KES 100)
- ✅ Missing phone numbers
- ✅ Unverified KYC users
- ✅ Failed STK Push requests
- ✅ Payment timeouts
- ✅ Network errors

## Monitoring

Check the Supabase Edge Functions logs to monitor:
- Deposit requests
- STK Push responses
- Payment confirmations
- Error rates