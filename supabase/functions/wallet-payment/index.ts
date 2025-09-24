import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { amount, reference, phone } = await req.json()

    console.log('💰 Wallet payment request:', { amount, reference, phone })

    // Validate required fields
    if (!amount || !reference || !phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: amount, reference, phone' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate amount
    if (amount < 1) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Amount must be at least KES 1' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
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

    // Prepare payload for Rukisha third-party merchant payment API
    const rukishaPayload = {
      payment_method: "MPESA",
      amount: amount,
      reference: reference,
      callbackUrl: "https://getdeals.co.ke/api/rukisha/callback",
      phone: phone
    }

    console.log('🔄 Calling Rukisha third-party merchant payment API...')
    console.log('📋 Payload:', rukishaPayload)

    // Call Rukisha third-party merchant payment API
    const rukishaResponse = await fetch('https://rukisha-api.rukisha.com/api/third-party-merchant-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rukishaApiToken}`
      },
      body: JSON.stringify(rukishaPayload)
    })

    const rukishaResponseText = await rukishaResponse.text()
    console.log('📡 Rukisha API response status:', rukishaResponse.status)
    console.log('📡 Rukisha API response:', rukishaResponseText)

    let rukishaResult
    try {
      rukishaResult = JSON.parse(rukishaResponseText)
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

    if (rukishaResponse.ok) {
      console.log('✅ Rukisha payment request successful')
      return new Response(
        JSON.stringify({ 
          success: true, 
          reference: reference,
          phone: phone,
          amount: amount,
          message: 'Payment request submitted successfully. Please complete the M-Pesa prompt on your phone.',
          rukishaResponse: rukishaResult
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error('❌ Rukisha payment request failed:', rukishaResult)
      
      // Extract error message from Rukisha response
      let errorMessage = 'Payment request failed'
      if (rukishaResult && typeof rukishaResult === 'object') {
        errorMessage = rukishaResult.message || rukishaResult.error || errorMessage
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: rukishaResult
        }),
        { 
          status: rukishaResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Wallet payment error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})