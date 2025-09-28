import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  payment_method: string;
  amount: number;
  phone: string;
  callback_url: string;
  reference: string;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, phone, reference, paymentType = 'deposit' } = await req.json()


    if (!amount || !phone) {
      return new Response(
        JSON.stringify({ error: 'Amount and phone number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)


    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${paymentType} payment for user: ${user.id}, amount: ${amount}`)

    // Get environment variables - use pre-existing token like wallet-payment
    const rukishaApiToken = Deno.env.get('RUKISHA_API_TOKEN')
    
    if (!rukishaApiToken) {
      console.error('❌ Missing RUKISHA_API_TOKEN environment variable')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment service configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentReference = reference || `${paymentType}_${user.id}_${Date.now()}`
    
    // Prepare payload aligned with working wallet-payment function
    const paymentPayload = {
      payment_method: "MPESA",
      amount: parseFloat(amount),
      reference: paymentReference,
      callback_url: "https://getdeals.co.ke/api/rukisha/callback",
      phone: phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`
    }

    console.log('🔄 Calling Rukisha third-party merchant payment API...')
    console.log('📋 Payload:', paymentPayload)

    const paymentResponse = await fetch('https://rukisha-api.rukisha.com/api/third-party-merchant-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rukishaApiToken}`
      },
      body: JSON.stringify(paymentPayload)
    })

    const rukishaResponseText = await paymentResponse.text()
    console.log('📡 Rukisha API response status:', paymentResponse.status)
    console.log('📡 Rukisha API response:', rukishaResponseText)

    let paymentResult
    try {
      paymentResult = JSON.parse(rukishaResponseText)
    } catch (parseError) {
      console.error('❌ Failed to parse Rukisha response:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid response from payment service: ${rukishaResponseText.substring(0, 100)}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!paymentResponse.ok) {
      console.error('❌ Rukisha payment request failed:', paymentResult)
      
      // Extract error message from Rukisha response
      let errorMessage = 'Payment request failed'
      if (paymentResult && typeof paymentResult === 'object') {
        errorMessage = paymentResult.message || paymentResult.error || errorMessage
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: paymentResult
        }),
        { 
          status: paymentResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Rukisha payment request successful')
    
    // Record transaction in database
    const transactionData = {
      user_id: user.id,
      amount: parseFloat(amount),
      transaction_type: paymentType,
      status: 'pending',
      reference: paymentReference,
      phone: paymentPayload.phone,
      created_at: new Date().toISOString(),
      rukisha_transaction_id: paymentResult.transactionId || null
    }

    console.log('Recording pending transaction:', transactionData)

    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Transaction recorded successfully:', transaction.id)

    if (paymentType === 'checkout') {
      console.log('Checkout payment initiated - order can be processed on callback')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reference: paymentReference,
        phone: paymentPayload.phone,
        amount: parseFloat(amount),
        message: 'Payment request submitted successfully. Please complete the M-Pesa prompt on your phone.',
        transactionId: transaction.id,
        rukishaResponse: paymentResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Rukisha payment error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})