# Deploy Edge Functions to Supabase

## Quick Manual Deployment (Recommended)

Since Supabase CLI isn't installed, deploy via the Dashboard:

### Step 1: Deploy deposit-funds Function

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **getdeals-kenya-showcase**
3. Go to **Edge Functions** in the left sidebar
4. Click **"Create a new function"**
5. Name: `deposit-funds`
6. Copy and paste the entire content from: `supabase/functions/deposit-funds/index.ts`

### Step 2: Deploy rukisha-callback Function

1. In the same Edge Functions section
2. Click **"Create a new function"**
3. Name: `rukisha-callback`  
4. Copy and paste the entire content from: `supabase/functions/rukisha-callback/index.ts`

### Step 3: Set Environment Variables

In your Supabase Dashboard → Settings → API:

1. **RUKISHA_API_KEY**: Your Rukisha API key
2. **RUKISHA_BASE_URL**: `https://api.rukisha.com` (or sandbox URL)
3. **SUPABASE_SERVICE_ROLE_KEY**: Found in Settings → API

### Step 4: Test Function Deployment

Run this command to test if functions are deployed:

```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/deposit-funds' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100, "phone": "0712345678"}'
```

Replace:
- `YOUR_PROJECT_ID` with your Supabase project ID
- `YOUR_ANON_KEY` with your anon public key

## Alternative: Install Supabase CLI

If you prefer CLI deployment:

### Install CLI:
```powershell
# Download and extract
Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip" -OutFile "supabase-cli.zip"
Expand-Archive -Path "supabase-cli.zip" -DestinationPath "."
Move-Item "supabase.exe" "C:\Windows\System32\"
```

### Deploy functions:
```bash
supabase functions deploy deposit-funds
supabase functions deploy rukisha-callback
```

## Verification

Once deployed, remove the temporary fallback from `wallet-deposit.ts` and test the real STK Push flow!

The deposit button should now:
1. ✅ Send real STK Push to your phone
2. ✅ Create transaction records in database  
3. ✅ Update wallet balance on payment completion

## Next Steps

1. **Deploy functions** (above steps)
2. **Run database migration**: `WALLET_TRANSACTIONS_MIGRATION.md`
3. **Set Rukisha webhook**: Point to your rukisha-callback function
4. **Test end-to-end**: Use `DEPOSIT_TESTING_GUIDE.md`