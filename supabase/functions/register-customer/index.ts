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
  id_number: number;
  email?: string; // optional
  agent_id?: number; // optional
}

interface RukishaResponse {
  message: string;
  customer: {
    name: string;
    phone: string;
    id_number: string;
    id: number; // This is the customer_id we need
  };
}

interface RukishaErrorResponse {
  error?: string;
  message?: string;
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
    if (!first_name || !last_name || !phone || !id_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: first_name, last_name, phone, id_number' }),
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
    }

    // Add optional fields if provided
    if (email) {
      rukishaPayload.email = email;
    }
    
    if (rukishaAgentId) {
      rukishaPayload.agent_id = rukishaAgentId;
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

    const rukishaData: RukishaResponse | RukishaErrorResponse = await rukishaResponse.json()
    
    console.log('Rukisha API response:', { 
      status: rukishaResponse.status,
      message: 'message' in rukishaData ? rukishaData.message : undefined,
      hasCustomer: 'customer' in rukishaData && !!rukishaData.customer
    })

    if (!rukishaResponse.ok || !('customer' in rukishaData) || !rukishaData.customer?.id) {
      console.error('Rukisha API error:', rukishaData)
      const errorMessage = ('error' in rukishaData && rukishaData.error) || 
                          ('message' in rukishaData && rukishaData.message) || 
                          'Failed to register with Rukisha API'
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: rukishaData
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const customerId = rukishaData.customer.id.toString() // Convert number to string for storage
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
    const profileData: any = {
      user_id: user.id,
      id: user.id,
      customer_id: customerId,
      first_name,
      last_name,
      phone,
      updated_at: new Date().toISOString()
    }

    // Add email if provided
    if (email) {
      profileData.email_verified = true;
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert(profileData)

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
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/register-customer' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"first_name":"John","last_name":"Doe","phone":"254712345678","id_number":"12345678","email":"john.doe@example.com"}'

*/