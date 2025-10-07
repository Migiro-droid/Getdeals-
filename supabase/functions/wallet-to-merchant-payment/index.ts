import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WalletToMerchantRequest {
  amount: number;
  phone: string;
  reference: string;
  description?: string;
}

interface RukishaPaymentResponse {
  success: boolean;
  message?: string;
  transaction_id?: string;
  status?: string;
  [key: string]: any;
}

const getEnv = (key: string): string | undefined => {
  const env = (globalThis as any)?.Deno?.env
  return typeof env?.get === 'function' ? env.get(key) ?? undefined : undefined
}

const formatPhoneForRukisha = (rawPhone: string): string => {
  if (!rawPhone) return rawPhone;
  let formatted = rawPhone.trim();

  if (formatted.startsWith('+')) {
    formatted = formatted.substring(1);
  }

  if (formatted.startsWith('0')) {
    formatted = `254${formatted.substring(1)}`;
  }

  if (!formatted.startsWith('254')) {
    formatted = `254${formatted}`;
  }

  return formatted;
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Initialize Supabase client
  const supabaseUrl = getEnv('SUPABASE_URL') ?? ''
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { amount, phone, reference, description } = await req.json() as WalletToMerchantRequest

    console.log('💰 Wallet-to-merchant payment request:', { 
      user_id: user.id, 
      amount, 
      phone, 
      reference 
    })

    // Validate required fields
    if (!amount || !phone || !reference) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: amount, phone, reference' 
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

    // Get user's wallet (or create if doesn't exist)
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, user_id')
      .eq('user_id', user.id)
      .single()

    // If wallet doesn't exist, try to create it
    if (walletError && walletError.code === 'PGRST116') {
      console.log('Wallet not found, attempting to create...')
      
      // Try to create wallet
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('id, balance, user_id')
        .single()

      if (createError || !newWallet) {
        console.error('Failed to create wallet:', createError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Wallet not found and could not be created. Please deposit funds first or contact support.' 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      wallet = newWallet
      console.log('Wallet created successfully')
    } else if (walletError || !wallet) {
      console.error('Wallet error:', walletError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error accessing wallet. Please try again or contact support.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. You have KES ${wallet.balance} but need KES ${amount}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user profile for customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('customer_id, phone, first_name, last_name, email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('User profile lookup error:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unable to lookup wallet profile. Please try again later or contact support.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!profile || !profile.customer_id) {
      console.warn('Wallet payment attempted without Rukisha customer_id', { user_id: user.id, profile })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Wallet not activated for payments. Please complete wallet registration before trying again.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const customerId = profile.customer_id
    const formattedPhone = formatPhoneForRukisha(phone)

    // Get environment variables
  const rukishaApiToken = getEnv('RUKISHA_API_TOKEN')
  const rukishaMerchantId = getEnv('RUKISHA_MERCHANT_ID') || getEnv('RUKISHA_AGENT_ID')
  const callbackUrl = `${supabaseUrl}/functions/v1/wallet-payment-callback`
    
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

    if (!rukishaMerchantId) {
      console.error('❌ Missing RUKISHA_MERCHANT_ID or RUKISHA_AGENT_ID environment variable')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Merchant configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create pending transaction record BEFORE calling Rukisha
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'payment',
        amount: amount,
        status: 'pending',
        reference: reference,
        phone_number: formattedPhone,
        description: description || `Payment to merchant - ${reference}`,
        metadata: {
          merchant_id: rukishaMerchantId,
          customer_id: customerId,
          payment_type: 'wallet_to_merchant'
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Failed to create transaction record:', transactionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create transaction record' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Transaction record created:', transaction.id)

    // Prepare payload for Rukisha tap-and-go pay-merchant API
    const rukishaPayload = {
      merchant_id: rukishaMerchantId,
      amount: amount,
      phone: formattedPhone,
      customer_id: customerId,
      callback_url: callbackUrl,
      reference: reference
    }

    console.log('🔄 Calling Rukisha pay-merchant-with-rukisha API...')
    console.log('📋 Payload:', { ...rukishaPayload, customer_id: '***' })

    // Call Rukisha pay-merchant-with-rukisha API
    const rukishaResponse = await fetch('https://api.rukisha.com/api/tap-and-go/pay-merchant-with-rukisha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rukishaApiToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(rukishaPayload)
    })

    const rukishaResponseText = await rukishaResponse.text()
    console.log('📡 Rukisha API response status:', rukishaResponse.status)
    console.log('📡 Rukisha API response:', rukishaResponseText)

    let rukishaResult: RukishaPaymentResponse
    try {
      rukishaResult = JSON.parse(rukishaResponseText)
    } catch (parseError) {
      console.error('❌ Failed to parse Rukisha response:', parseError)
      
      // Update transaction status to failed
      await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'failed',
          metadata: {
            ...transaction.metadata,
            error: 'Invalid response from payment provider',
            raw_response: rukishaResponseText.substring(0, 500)
          }
        })
        .eq('id', transaction.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid response from payment service: ${rukishaResponseText.substring(0, 100)}`,
          transaction_id: transaction.id
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update transaction with Rukisha response
    const updateData: any = {
      metadata: {
        ...transaction.metadata,
        rukisha_response: rukishaResult,
        rukisha_status: rukishaResult.status
      }
    }

    // If Rukisha provides a transaction ID, store it
    if (rukishaResult.transaction_id) {
      updateData.transaction_id = rukishaResult.transaction_id
    }

    if (rukishaResponse.ok && rukishaResult.success !== false) {
      console.log('✅ Rukisha payment request successful')
      
      // Update transaction status to processing (waiting for callback)
      updateData.status = 'processing'
      
      await supabase
        .from('wallet_transactions')
        .update(updateData)
        .eq('id', transaction.id)

      // Deduct balance immediately (optimistic update)
      // The callback will mark as completed or rollback if failed
      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ 
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)

      if (balanceError) {
        console.error('❌ Failed to update wallet balance:', balanceError)
        // Mark transaction as failed
        await supabase
          .from('wallet_transactions')
          .update({ 
            status: 'failed',
            metadata: {
              ...updateData.metadata,
              error: 'Failed to update wallet balance'
            }
          })
          .eq('id', transaction.id)

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to update wallet balance',
            transaction_id: transaction.id
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Wallet balance updated')

      return new Response(
        JSON.stringify({ 
          success: true, 
          reference: reference,
          transaction_id: transaction.id,
          rukisha_transaction_id: rukishaResult.transaction_id,
          phone: formattedPhone,
          amount: amount,
          message: rukishaResult.message || 'Payment initiated successfully. Please check your phone for confirmation.',
          status: 'processing',
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

      // Update transaction status to failed
      updateData.status = 'failed'
      await supabase
        .from('wallet_transactions')
        .update(updateData)
        .eq('id', transaction.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          transaction_id: transaction.id,
          details: rukishaResult
        }),
        { 
          status: rukishaResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Wallet-to-merchant payment error:', error)
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
