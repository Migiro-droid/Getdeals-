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

    // Get Rukisha authentication credentials (same as rukisha-payment function)
    const consumerKey = Deno.env.get('RUKISHA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('RUKISHA_CONSUMER_SECRET')
    
    console.log('Rukisha credentials check:', {
      hasConsumerKey: !!consumerKey,
      hasConsumerSecret: !!consumerSecret,
      consumerKeyPreview: consumerKey ? consumerKey.substring(0, 10) + '...' : 'MISSING',
      consumerSecretPreview: consumerSecret ? consumerSecret.substring(0, 10) + '...' : 'MISSING'
    })
    
    if (!consumerKey || !consumerSecret) {
      console.error('Rukisha credentials not configured - consumerKey:', !!consumerKey, 'consumerSecret:', !!consumerSecret)
      return new Response(
        JSON.stringify({ 
          error: 'Payment service configuration error',
          details: 'Missing Rukisha consumer credentials',
          hasConsumerKey: !!consumerKey,
          hasConsumerSecret: !!consumerSecret
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Getting Rukisha auth token...')
    const tokenRequestPayload = {
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    }
    
    console.log('Token request details:', {
      url: 'https://rukisha-api.rukisha.com/api/payments/get-token',
      payload: { consumer_key: consumerKey.substring(0, 10) + '...', consumer_secret: '[REDACTED]' }
    })
    
    const tokenResponse = await fetch('https://rukisha-api.rukisha.com/api/payments/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tokenRequestPayload)
    })

    console.log('Token response status:', tokenResponse.status, tokenResponse.statusText)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get Rukisha token:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText.substring(0, 500)
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with payment service',
          details: `Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
          rukishaError: errorText.substring(0, 300)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log('Rukisha token obtained successfully')
    const rukishaApiToken = tokenData.token

    // Format phone number for Rukisha (ensure +254 format)
    const formattedPhone = phone.startsWith('+254') ? phone : `+254${phone.replace(/^0/, '')}`

    // Prepare payload for Rukisha Deposit API
    const rukishaPayload: RukishaDepositPayload = {
      amount: Number(amount),
      phone: formattedPhone.replace('+254', '0'), // Convert +254XXXXXXXXX to 07XXXXXXXX format
      customer_id: profile.customer_id
    }

    console.log('Sending deposit request to Rukisha API:', { 
      url: `https://rukisha-api.rukisha.com/api/deposit-funds`,
      payload: { ...rukishaPayload, phone: '[REDACTED]' },
      hasToken: !!rukishaApiToken,
      tokenPreview: rukishaApiToken ? rukishaApiToken.substring(0, 10) + '...' : 'NO_TOKEN'
    })

    // Call Rukisha Deposit Funds API (try the rukisha-api domain instead)
    const rukishaResponse = await fetch(`https://rukisha-api.rukisha.com/api/deposit-funds`, {
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

    // Create pending transaction record
    const transactionData = {
      user_id: user.id,
      type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      transaction_id: rukishaData.transaction_id || `temp_${Date.now()}`,
      phone_number: formattedPhone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert transaction record (this will be updated when payment is confirmed)
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('wallet_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      // Don't fail the request since STK push was initiated
    }

    console.log('STK Push initiated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: rukishaData.transaction_id,
        amount: amount,
        phone: formattedPhone,
        message: 'STK Push sent to your phone. Please complete the payment to add funds to your wallet.',
        transaction_record_id: transaction?.id
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