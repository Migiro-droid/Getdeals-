import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RukishaCallbackPayload {
  transaction_id: string;
  customer_id: string;
  amount: number;
  phone: string;
  status: 'success' | 'failed' | 'cancelled';
  reference?: string;
  timestamp?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for callback operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body - this comes from Rukisha
    const payload: RukishaCallbackPayload = await req.json()
    
    console.log('Received Rukisha callback:', { 
      transaction_id: payload.transaction_id,
      status: payload.status,
      amount: payload.amount,
      customer_id: payload.customer_id
    })

    // Validate required fields
    if (!payload.transaction_id || !payload.customer_id || !payload.amount || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields in callback' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Find the user by customer_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('customer_id', payload.customer_id)
      .single()

    if (profileError || !profile) {
      console.error('User not found for customer_id:', payload.customer_id, profileError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = profile.user_id

    // Find the pending transaction
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('wallet_transactions')
      .select('*')
      .eq('transaction_id', payload.transaction_id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction not found:', payload.transaction_id, transactionError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update transaction status
    const newStatus = payload.status === 'success' ? 'completed' : 
                     payload.status === 'failed' ? 'failed' : 'cancelled'
    
    const { error: updateError } = await supabaseClient
      .from('wallet_transactions')
      .update({
        status: newStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If payment was successful, update wallet balance
    if (payload.status === 'success') {
      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (walletError) {
        console.error('Error fetching wallet:', walletError)
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Update wallet balance
      const currentBalance = Number(wallet.balance) || 0
      const newBalance = currentBalance + Number(payload.amount)

      const { error: balanceUpdateError } = await supabaseClient
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceUpdateError) {
        console.error('Error updating wallet balance:', balanceUpdateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update wallet balance' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.log(`✅ Deposit successful: KES ${payload.amount} added to user ${userId}`)
      console.log(`💰 Wallet balance updated: ${currentBalance} → ${newBalance}`)
    } else {
      console.log(`❌ Deposit ${payload.status}: ${payload.transaction_id} for user ${userId}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Callback processed successfully',
        transaction_id: payload.transaction_id,
        status: newStatus
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in rukisha-callback function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})