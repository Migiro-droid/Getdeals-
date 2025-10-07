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
    console.log('📞 Wallet payment callback received')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse callback payload
    const payload = await req.json()
    console.log('📋 Callback payload:', JSON.stringify(payload, null, 2))

    // Extract callback data (adjust field names based on Rukisha's actual callback format)
    const {
      transaction_id,
      reference,
      status,
      amount,
      phone,
      confirmation_code,
      timestamp,
      message
    } = payload

    if (!reference) {
      console.error('❌ Missing reference in callback')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing reference in callback payload' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find the transaction by reference
    const { data: transaction, error: findError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference', reference)
      .eq('type', 'payment')
      .single()

    if (findError || !transaction) {
      console.error('❌ Transaction not found:', reference, findError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Transaction not found for reference: ${reference}` 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Transaction found:', transaction.id)

    // Determine status based on callback
    let newStatus = 'completed'
    let shouldRollback = false

    // Map Rukisha status to our status
    if (status && typeof status === 'string') {
      const statusLower = status.toLowerCase()
      if (statusLower === 'completed' || statusLower === 'success' || statusLower === 'successful') {
        newStatus = 'completed'
      } else if (statusLower === 'failed' || statusLower === 'failure' || statusLower === 'error') {
        newStatus = 'failed'
        shouldRollback = true
      } else if (statusLower === 'pending' || statusLower === 'processing') {
        newStatus = 'pending'
      } else {
        newStatus = 'failed'
        shouldRollback = true
      }
    }

    console.log(`📊 Updating transaction ${transaction.id} to status: ${newStatus}`)

    // Update transaction with callback data
    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({
        status: newStatus,
        transaction_id: transaction_id || transaction.transaction_id,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        metadata: {
          ...transaction.metadata,
          callback_received: true,
          callback_timestamp: timestamp || new Date().toISOString(),
          confirmation_code: confirmation_code,
          rukisha_status: status,
          rukisha_message: message,
          callback_payload: payload
        }
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update transaction' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If payment failed, rollback the wallet balance
    if (shouldRollback) {
      console.log('🔄 Rolling back wallet balance...')
      
      // Get the wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single()

      if (!walletError && wallet) {
        // Add the amount back
        const { error: rollbackError } = await supabase
          .from('wallets')
          .update({ 
            balance: wallet.balance + transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.user_id)

        if (rollbackError) {
          console.error('❌ Failed to rollback balance:', rollbackError)
        } else {
          console.log('✅ Balance rolled back successfully')
        }
      }
    }

    console.log('✅ Callback processed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Callback processed successfully',
        transaction_id: transaction.id,
        status: newStatus
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Callback processing error:', error)
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
