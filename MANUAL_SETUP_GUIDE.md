# Manual Supabase CLI Installation & Edge Function Deployment

Since automated installation failed, here are manual installation options:

## Option 1: Manual CLI Installation (Recommended)

### Download Supabase CLI:
1. Go to: https://github.com/supabase/cli/releases
2. Download the latest Windows release (supabase_windows_amd64.tar.gz)
3. Extract the archive
4. Move `supabase.exe` to a folder in your PATH (e.g., `C:\Windows\System32\` or create a dedicated folder)

### Verify Installation:
```powershell
supabase --version
```

## Option 2: Use Supabase Dashboard (Web Interface)

1. Go to your Supabase project dashboard
2. Navigate to Database → Functions
3. Click "Create new function"
4. Name: `register-customer`
5. Copy and paste the content from `supabase/functions/register-customer/index.ts`

## Option 3: Test Without Edge Function (Temporary)

For immediate testing, you can modify the frontend to simulate the Rukisha integration:

### Temporary Test Mode

Add this to your `WalletKycService.submitKyc` method to simulate instant activation:

```typescript
// TEMPORARY: Simulate Rukisha success for testing
// Remove this when edge function is deployed
if (process.env.NODE_ENV === 'development') {
  // Simulate instant activation
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      id: user.id,
      customer_id: `test_customer_${Date.now()}`, // Simulated customer ID
      first_name: data.fullName.split(' ')[0],
      last_name: data.fullName.split(' ').slice(1).join(' '),
      phone: data.phoneNumber,
      email_verified: true,
      updated_at: new Date().toISOString()
    });

  if (!profileError) {
    // Also activate wallet
    await supabase
      .from('wallets')
      .upsert({
        user_id: user.id,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    // Update KYC status
    await supabase
      .from('wallet_kyc')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return {
      success: true,
      data: {
        id: result.id,
        status: 'verified',
        customer_id: `test_customer_${Date.now()}`,
        submittedAt: result.created_at,
        message: 'Your wallet has been activated successfully! (Test Mode)'
      }
    };
  }
}
```

## Current Status

The frontend implementation is complete and ready. The integration includes:

✅ **Frontend React Components**
- KYC form with validation
- Error handling and success messages
- Wallet activation flow

✅ **Database Schema**
- Migration ready to run
- Tables and RLS policies defined

✅ **Edge Function Code**
- Complete Rukisha API integration
- Ready for deployment

## Next Steps

### Immediate Testing (Option 3):
1. Add the temporary test code above
2. Navigate to `/wallet` in your browser
3. Test the KYC form submission
4. Verify wallet activation works

### Production Setup:
1. Install Supabase CLI (Option 1 or 2)
2. Run: `supabase functions deploy register-customer`
3. Add your Rukisha API credentials to Supabase secrets
4. Remove temporary test code
5. Test with real Rukisha API

### Environment Variables for Supabase

Once CLI is installed, set these environment variables in Supabase:

```bash
supabase secrets set RUKISHA_API_URL=https://api.rukisha.com/api/tap-and-go
supabase secrets set RUKISHA_API_TOKEN=your_actual_token_here
supabase secrets set RUKISHA_AGENT_ID=110
```

## Troubleshooting

- **Edge Function**: If deployment fails, use the dashboard method
- **API Errors**: Check Supabase function logs for debugging
- **Database**: Run the migration script in the SQL editor

The integration is functionally complete and ready for testing!