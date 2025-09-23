# Rukisha API Integration Setup & Testing Guide

This guide explains how to set up and test the Rukisha API integration for wallet KYC activation.

## Overview

The implementation includes:
- **Frontend**: React KYC form with Rukisha integration
- **Backend**: Supabase Edge Function that calls Rukisha API
- **Database**: Updated schema with customer_id and wallet activation fields

## Setup Instructions

### 1. Environment Configuration

Add the following variables to your `.env` file:

```env
# Rukisha API Configuration
RUKISHA_API_URL="https://api.rukisha.com/api/tap-and-go"
RUKISHA_API_TOKEN="your_rukisha_api_token_here"
RUKISHA_AGENT_ID="110"
```

### 2. Database Migration

Run the database migration to add required fields:

```sql
-- This migration is already created in:
-- supabase/migrations/20250922000001_add_rukisha_integration.sql

-- It adds:
-- - customer_id column to profiles table
-- - wallets table with is_active field
-- - Proper RLS policies and triggers
```

### 3. Supabase Edge Function

The `register-customer` edge function is already created in:
`supabase/functions/register-customer/index.ts`

Deploy it using:
```bash
supabase functions deploy register-customer
```

## How It Works

### 1. User Flow
1. User clicks "Start KYC Verification" on the wallet page
2. Fills out the KYC form with required details:
   - Full Name
   - ID Type (National ID or Passport)
   - ID Number
   - Phone Number
   - Email Address
   - KRA PIN
3. Clicks "Submit KYC & Activate Wallet"

### 2. Backend Process
1. Form data is saved to `wallet_kyc` table
2. Supabase Edge Function is called with KYC data
3. Function calls Rukisha API to register customer
4. If successful:
   - `customer_id` is stored in user's profile
   - Wallet is activated (`wallets.is_active = true`)
   - KYC status is set to 'verified'
5. User receives success confirmation

### 3. Error Handling
- API failures are properly handled and reported to user
- Wallet is not activated until Rukisha registration succeeds
- Clear error messages guide users through any issues

## API Payload Structure

### Frontend to Edge Function
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "254712345678",
  "id_number": "12345678",
  "email": "john.doe@example.com",
  "kra_pin": "A051234567B"
}
```

### Edge Function to Rukisha API
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "254712345678",
  "id_number": 12345678,
  "email": "john.doe@example.com",
  "agent_id": 110
}
```

### Rukisha API Response
```json
{
  "success": true,
  "customer_id": "rukisha_customer_id_here",
  "message": "Customer registered successfully"
}
```

## Testing

### 1. Prerequisites
- Supabase project is set up and running
- Edge function is deployed
- Rukisha API credentials are configured
- Development server is running (`npm run dev`)

### 2. Test Steps
1. Navigate to the wallet page (`/wallet`)
2. If no KYC data exists, you'll see the activation prompt
3. Click "Start KYC Verification"
4. Fill out the form with test data
5. Submit and verify the flow works correctly

### 3. Expected Results
- **Success**: Wallet is instantly activated, user sees success message
- **Failure**: Clear error message with option to retry

## Database Schema Updates

### profiles table
```sql
ALTER TABLE profiles ADD COLUMN customer_id TEXT;
```

### wallets table
```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Considerations

- API tokens are stored securely in environment variables
- Edge function validates user authentication
- RLS policies protect user data
- Sensitive data is not logged in production

## Troubleshooting

### Common Issues

1. **Edge Function Not Found**
   - Ensure function is deployed: `supabase functions deploy register-customer`

2. **Rukisha API Errors**
   - Check API credentials in environment variables
   - Verify agent_id is correct
   - Check network connectivity

3. **Database Errors**
   - Run the migration script
   - Check RLS policies are correctly set up

### Debug Information

Edge function logs can be viewed in Supabase dashboard under Functions → Logs.

## Production Deployment

1. Set production Rukisha API credentials
2. Deploy edge function to production
3. Run database migrations
4. Test the complete flow in production environment

## Support

For issues with this integration, check:
- Supabase dashboard for function logs
- Browser console for frontend errors
- Database logs for any constraint violations