# Vercel Environment Variables Setup

## Critical: Configure these environment variables in Vercel Dashboard

Go to: https://vercel.com/house-of-procurement/getdeals-kenya-showcase/settings/environment-variables

Add the following environment variables:

### M-Pesa Configuration
```
MPESA_CONSUMER_KEY=cHLCjH58DWpSJoU0sazng3FtZLEzCjlK3bybnVLGpZG39ahA
MPESA_CONSUMER_SECRET=YcquWt93vZvgLwBCuIv3ahMxYHXA4PmQGtZ6DTRIesByY38WhqO7dQ7jXfC6Kjtd
MPESA_PASSKEY=76e6c7b9036a97147f93668f564f0040e996bdafc544945f356b677af34fde0b
MPESA_SHORTCODE=3566989
MPESA_ENVIRONMENT=production
```

### Supabase Configuration
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Step-by-Step:

1. Go to Vercel Dashboard
2. Select getdeals-kenya-showcase project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Set Environment: Production, Preview, Development (all)
6. Save changes
7. Redeploy: `vercel --prod`

## After configuring, test again:
```bash
node test-mpesa-vercel.js
```

## Expected Result:
- STK Push should return CheckoutRequestID
- Callback should process successfully
- Database records should be created