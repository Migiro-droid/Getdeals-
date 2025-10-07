import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getEnv = (key: string) => {
  const env = (globalThis as any)?.Deno?.env
  return typeof env?.get === 'function' ? env.get(key) ?? undefined : undefined
}

interface RukishaDepositPayload {
  amount: number;
  phone: string;
  callback_url: string;
  customer_id: string;
  reference: string;
}

interface RukishaDepositResponse {
  success: boolean;
  transaction_id?: string;
  message?: string;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with fallback values
    const supabaseUrl = getEnv('SUPABASE_URL') ?? 'https://fxyifnckgllxqbggegtw.supabase.co';
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';
    
    console.log('🔧 Edge function environment:', {
      hasSupabaseUrl: !!getEnv('SUPABASE_URL'),
      hasSupabaseAnonKey: !!getEnv('SUPABASE_ANON_KEY'),
      usingUrl: supabaseUrl,
      hasAuthHeader: !!req.headers.get('Authorization')
    });
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
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
    const { amount, phone } = await req.json()

    // Validate required fields
    if (!amount || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, phone' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate amount (minimum 100 KES)
    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Minimum deposit amount is KES 100' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user's customer_id from profiles (use maybeSingle to avoid throwing when no row)
    // Use a more specific query to avoid schema cache issues
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('customer_id, first_name, last_name')
      .eq('user_id', user.id)  // Changed from 'id' to 'user_id' for clarity
      .maybeSingle()

    console.log('Profile query result:', { profile, profileError, userId: user.id })

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Profile lookup failed. Please try again or contact support.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!profile || !profile.customer_id) {
      // No profile or no customer_id — provide a clear, actionable message
      return new Response(
        JSON.stringify({ error: 'Wallet not activated. Please complete KYC verification first.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get Rukisha API token directly (deposit API might use different auth than payment API)
    const rukishaApiToken = getEnv('RUKISHA_API_TOKEN')
    
    console.log('Rukisha token check:', {
      hasToken: !!rukishaApiToken,
      tokenPreview: rukishaApiToken ? rukishaApiToken.substring(0, 10) + '...' : 'MISSING'
    })
    
    if (!rukishaApiToken) {
      console.error('RUKISHA_API_TOKEN not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Payment service configuration error',
          details: 'Missing RUKISHA_API_TOKEN'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number for Rukisha (254XXXXXXXXX format as specified)
    let formattedPhone = phone;
    if (phone.startsWith('+254')) {
      formattedPhone = phone.substring(1); // Remove the '+' to get 254XXXXXXXXX
    } else if (phone.startsWith('0')) {
      formattedPhone = '254' + phone.substring(1); // Convert 07XX to 254XXX
    } else if (!phone.startsWith('254')) {
      formattedPhone = '254' + phone; // Add 254 prefix if missing
    }

    // Generate reference UUID for this transaction
    const reference = crypto.randomUUID()

    // First, create pending transaction record with reference
    const transactionData = {
      user_id: user.id,
      type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      phone_number: formattedPhone,
      reference: reference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: transaction, error: transactionError } = await supabaseClient
      .from('wallet_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction record' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Transaction record created:', { id: transaction.id, reference: reference })

    const markTransactionFailed = async (reason: string) => {
      const truncatedReason = reason.substring(0, 200)
      const { error: updateError } = await supabaseClient
        .from('wallet_transactions')
        .update({
          status: 'failed',
          description: truncatedReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('Error marking transaction as failed:', updateError)
      }
    }

    // Prepare payload for Rukisha deposit-to-wallet API (TOP UP WALLET)
    const rukishaPayload = {
      amount: Number(amount),
      phone: formattedPhone,
      customer_id: profile.customer_id,
      callback_url: "https://getdeals.co.ke/api/webhooks/rukisha",
      reference: reference
    }

    // Use the correct Rukisha deposit-to-wallet endpoint for TOP UP WALLET
    const depositEndpoint = 'https://api.rukisha.com/api/tap-and-go/deposit-to-wallet'

    console.log('Rukisha deposit endpoint:', depositEndpoint)
    console.log('Payload:', rukishaPayload)

    // Make the API call to Rukisha
    console.log(`Calling Rukisha deposit-to-wallet endpoint: ${depositEndpoint}`)
    const response = await fetch(depositEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${rukishaApiToken}`,
        'User-Agent': 'GetDealsWallet/1.0 (+https://getdeals.co.ke)'
      },
      body: JSON.stringify(rukishaPayload)
    })

    const responseText = await response.text()
    const contentType = response.headers.get('content-type')
    
    console.log('Rukisha response meta:', { 
      endpoint: depositEndpoint, 
      status: response.status, 
      contentType, 
      snippet: responseText.substring(0, 200) 
    })

    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
      const errorMessage = `Invalid response from payment service: ${responseText.substring(0, 100)}`
      await markTransactionFailed(errorMessage)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let rukishaData: RukishaDepositResponse
    try {
      rukishaData = JSON.parse(responseText)
    } catch (parseError) {
      const errorMessage = `Failed to parse payment service response: ${parseError}`
      await markTransactionFailed(errorMessage)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!response.ok || rukishaData.success === false) {
      const errorMessage = rukishaData.error || rukishaData.message || `Payment request failed with status ${response.status}`
      await markTransactionFailed(errorMessage)

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: rukishaData
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Rukisha payment request successful')



    // Update transaction record with Rukisha transaction ID
    if (rukishaData.transaction_id) {
      const { error: updateError } = await supabaseClient
        .from('wallet_transactions')
        .update({
          transaction_id: rukishaData.transaction_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('Error updating transaction with Rukisha ID:', updateError)
      }
    }

    console.log('STK Push initiated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: rukishaData.transaction_id,
        reference: reference,
        amount: amount,
        phone: formattedPhone,
        message: 'STK Push sent to your phone. Please complete the payment to add funds to your wallet.',
        transaction_record_id: transaction.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error(' Error in deposit-funds function:', error)
    console.error(' Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      name: (error as any)?.name,
      cause: (error as any)?.cause
    })
    
    // Ensure we always return JSON, never HTML
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: (error as any)?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})