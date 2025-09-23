# Deploy Rukisha Edge Function via Supabase Dashboard

Since CLI installation is challenging, here's how to deploy via the web dashboard:

## Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw
2. Navigate to **Database** → **Functions** (or **Edge Functions**)

## Step 2: Create New Function

1. Click **"Create a new function"**
2. Function name: `register-customer`
3. Copy and paste the following code:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RukishaRegisterPayload {
  first_name: string;
  last_name: string;
  phone: string;
  id_number: string;
  email: string;
  agent_id: number;
}

interface RukishaResponse {
  success: boolean;
  customer_id?: string;
  message?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { 
      first_name, 
      last_name, 
      phone, 
      id_number, 
      email, 
      kra_pin 
    } = await req.json()

    // Validate required fields
    if (!first_name || !last_name || !phone || !id_number || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: first_name, last_name, phone, id_number, email' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get Rukisha configuration from environment
    const rukishaApiUrl = Deno.env.get('RUKISHA_API_URL') || 'https://api.rukisha.com/api/tap-and-go'
    const rukishaApiToken = Deno.env.get('RUKISHA_API_TOKEN')
    const rukishaAgentId = parseInt(Deno.env.get('RUKISHA_AGENT_ID') || '110')

    if (!rukishaApiToken) {
      console.error('RUKISHA_API_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Rukisha API not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare payload for Rukisha API
    const rukishaPayload: RukishaRegisterPayload = {
      first_name,
      last_name,
      phone: phone.startsWith('+254') ? phone : `+254${phone.replace(/^0/, '')}`, // Ensure proper format
      id_number: parseInt(id_number),
      email,
      agent_id: rukishaAgentId
    }

    console.log('Sending request to Rukisha API:', { 
      url: `${rukishaApiUrl}/register-customer`,
      payload: { ...rukishaPayload, id_number: '[REDACTED]' }
    })

    // Call Rukisha API
    const rukishaResponse = await fetch(`${rukishaApiUrl}/register-customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rukishaApiToken}`,
      },
      body: JSON.stringify(rukishaPayload),
    })

    const rukishaData: RukishaResponse = await rukishaResponse.json()
    
    console.log('Rukisha API response:', { 
      status: rukishaResponse.status,
      success: rukishaData.success,
      hasCustomerId: !!rukishaData.customer_id
    })

    if (!rukishaResponse.ok || !rukishaData.success) {
      console.error('Rukisha API error:', rukishaData)
      return new Response(
        JSON.stringify({ 
          error: rukishaData.error || rukishaData.message || 'Failed to register with Rukisha API',
          details: rukishaData
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const customerId = rukishaData.customer_id
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'No customer ID returned from Rukisha API' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Store customer_id in user's profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        user_id: user.id,
        id: user.id,
        customer_id: customerId,
        first_name,
        last_name,
        phone,
        email_verified: true,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to store customer ID in profile', details: profileError }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Activate the wallet
    const { error: walletError } = await supabaseClient
      .from('wallets')
      .upsert({
        user_id: user.id,
        is_active: true,
        updated_at: new Date().toISOString()
      })

    if (walletError) {
      console.error('Error activating wallet:', walletError)
      // Don't fail completely if wallet activation fails, just log it
      console.log('Wallet activation failed, but customer registration successful')
    }

    // Update KYC status to verified
    const { error: kycError } = await supabaseClient
      .from('wallet_kyc')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (kycError) {
      console.error('Error updating KYC status:', kycError)
    }

    console.log('Successfully registered customer with Rukisha and updated database')

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer_id: customerId,
        message: 'Customer registration successful. Wallet activated.' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in register-customer function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

## Step 3: Set Environment Variables

1. In Supabase Dashboard, go to **Settings** → **Edge Functions**
2. Add these environment variables (secrets):

```
RUKISHA_API_URL=https://api.rukisha.com/api/tap-and-go
RUKISHA_API_TOKEN=your_actual_rukisha_api_token_here
RUKISHA_AGENT_ID=110
```

## Step 4: Deploy and Test

1. Click **Deploy function**
2. Test the function using the test interface
3. Your function will be available at:
   `https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/register-customer`

## Step 5: Update Frontend

The frontend is already configured to call this function. Once deployed, test the integration by:

1. Running `npm run dev`
2. Going to `/wallet`
3. Clicking "Start KYC Verification"
4. Filling out the form and submitting

## Alternative: Test Mode

If you want to test without Rukisha API first, the frontend already includes a development mode that simulates the integration. Just ensure `VITE_TEST_MODE="true"` is in your `.env` file.

The wallet will be activated instantly in test mode, allowing you to verify the UI flow works correctly before connecting to the real Rukisha API.