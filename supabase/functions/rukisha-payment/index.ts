import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RukishaTokenResponse {
  message: string;
  token: string;
}

interface PaymentRequest {
  payment_method: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  idNumber?: string | null;
  phone: string;
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

    const consumerKey = Deno.env.get('RUKISHA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('RUKISHA_CONSUMER_SECRET')
    
    if (!consumerKey || !consumerSecret) {
      console.error('Rukisha credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Getting Rukisha auth token...')
    const tokenResponse = await fetch('https://rukisha-api.rukisha.com/api/payments/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get Rukisha token:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with payment service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenData: RukishaTokenResponse = await tokenResponse.json()
    console.log('Rukisha token obtained successfully')

    const callbackUrl = `${supabaseUrl}/functions/v1/rukisha-payment-callback`
    const paymentReference = reference || `${paymentType}_${user.id}_${Date.now()}`
    
    const paymentPayload: PaymentRequest = {
      payment_method: "MPESA",
      amount: parseFloat(amount),
      reference: paymentReference,
      callbackUrl: callbackUrl,
      idNumber: null,
      phone: phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`
    }

    console.log('Initiating STK push with payload:', paymentPayload)

    const paymentResponse = await fetch('https://rukisha-api.rukisha.com/api/third-party-merchant-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      },
      body: JSON.stringify(paymentPayload)
    })

    const paymentResult: PaymentResponse = await paymentResponse.json()
    console.log('Payment response:', paymentResult)

    if (!paymentResponse.ok || !paymentResult.success) {
      console.error('Payment initiation failed:', paymentResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initiate payment', 
          details: paymentResult.message || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        message: 'STK push initiated successfully',
        reference: paymentReference,
        transactionId: transaction.id,
        amount: parseFloat(amount),
        phone: paymentPayload.phone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rukisha payment error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})