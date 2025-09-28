import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RukishaDepositPayload {
  amount: number;
  phone: string;
  customer_id: string;
  callback_url: string;
  reference: string;
}

interface RukishaDepositResponse {
  success: boolean;
  transaction_id?: string;
  message?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with fallback values
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://fxyifnckgllxqbggegtw.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';
    
    console.log('🔧 Edge function environment:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
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
    const rukishaApiToken = Deno.env.get('RUKISHA_API_TOKEN')
    
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

    // Format phone number for Rukisha (ensure +254 format)
    const formattedPhone = phone.startsWith('+254') ? phone : `+254${phone.replace(/^0/, '')}`

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

    // Construct callback URL
    const callbackUrl = `${supabaseUrl}/functions/v1/rukisha-callback`

    // Prepare payload for Rukisha Deposit API
    const rukishaPayload: RukishaDepositPayload = {
      amount: Number(amount),
      phone: formattedPhone.replace('+254', '0'), // Convert +254XXXXXXXXX to 07XXXXXXXX format
      customer_id: profile.customer_id,
      callback_url: callbackUrl,
      reference: reference
    }

    console.log('Sending deposit request to Rukisha API (using correct endpoint):', { 
      url: `https://api.rukisha.com/api/tap-and-go/deposit-to-wallet`,
      payload: { ...rukishaPayload, phone: '[REDACTED]' },
      hasToken: !!rukishaApiToken,
      tokenPreview: rukishaApiToken ? rukishaApiToken.substring(0, 10) + '...' : 'NO_TOKEN'
    })

    // Call Rukisha Deposit API using the CORRECT endpoint from Postman
    const rukishaResponse = await fetch(`https://api.rukisha.com/api/tap-and-go/deposit-to-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${rukishaApiToken}`,
      },
      body: JSON.stringify(rukishaPayload),
    })

    console.log('Rukisha API HTTP response:', {
      status: rukishaResponse.status,
      statusText: rukishaResponse.statusText,
      headers: Object.fromEntries(rukishaResponse.headers.entries())
    })

    // Get response text first to check if it's JSON or HTML
    const rukishaResponseText = await rukishaResponse.text()
    console.log('Rukisha API response text (first 200 chars):', rukishaResponseText.substring(0, 200))

    let rukishaData: RukishaDepositResponse
    
    try {
      rukishaData = JSON.parse(rukishaResponseText)
    } catch (parseError) {
      console.error('❌ Failed to parse Rukisha API response as JSON:', parseError)
      console.error('❌ Response was:', rukishaResponseText.substring(0, 500))
      
      // If Rukisha API returned HTML or non-JSON, treat it as an error
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Payment service returned invalid response',
          details: `Expected JSON but got: ${rukishaResponseText.substring(0, 100)}...`,
          rukishaStatus: rukishaResponse.status
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log('Rukisha Deposit API parsed response:', { 
      status: rukishaResponse.status,
      success: rukishaData.success,
      hasTransactionId: !!rukishaData.transaction_id,
      error: rukishaData.error
    })

    if (!rukishaResponse.ok || !rukishaData.success) {
      console.error('❌ Rukisha Deposit API error:', {
        status: rukishaResponse.status,
        statusText: rukishaResponse.statusText,
        responseData: rukishaData,
        responseText: rukishaResponseText.substring(0, 300)
      })
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: rukishaData.error || rukishaData.message || 'Failed to initiate deposit with payment service',
          details: `Rukisha API status: ${rukishaResponse.status}, Success: ${rukishaData.success}`,
          rukishaError: rukishaData.error,
          rukishaMessage: rukishaData.message,
          statusCode: rukishaResponse.status
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }



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
    console.error('❌ Error in deposit-funds function:', error)
    console.error('❌ Error details:', {
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