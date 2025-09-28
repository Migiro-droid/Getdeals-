import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RukishaCallback {
  transaction_id: string;
  reference: string;
  amount: number;
  status: string;
  phone: string;
  message?: string;
  mpesa_receipt_number?: string;
  timestamp?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received Rukisha callback')
    
    const callbackData: RukishaCallback = await req.json()
    console.log('Callback data:', callbackData)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Find the transaction by reference
    const { data: transaction, error: findError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('reference', callbackData.reference)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', findError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found transaction:', transaction.id)

    // Update transaction status based on callback
    const isSuccess = callbackData.status.toLowerCase() === 'success' || 
                     callbackData.status.toLowerCase() === 'completed'
    
    const updateData = {
      status: isSuccess ? 'completed' : 'failed',
      rukisha_transaction_id: callbackData.transaction_id,
      mpesa_receipt_number: callbackData.mpesa_receipt_number,
      updated_at: new Date().toISOString(),
      callback_data: callbackData
    }

    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Transaction updated successfully')

    // If it's a successful deposit, update user wallet balance
    if (isSuccess && transaction.transaction_type === 'deposit') {
      console.log('Processing wallet deposit for user:', transaction.user_id)
      
      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single()

      if (walletError && walletError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching wallet:', walletError)
      } else if (wallet) {
        // Update existing wallet
        const newBalance = parseFloat(wallet.balance) + parseFloat(transaction.amount)
        const { error: balanceUpdateError } = await supabase
          .from('wallet_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transaction.user_id)

        if (balanceUpdateError) {
          console.error('Failed to update wallet balance:', balanceUpdateError)
        } else {
          console.log(`Wallet balance updated to ${newBalance} for user ${transaction.user_id}`)
        }
      } else {
        // Create new wallet
        const { error: createWalletError } = await supabase
          .from('wallet_balances')
          .insert({
            user_id: transaction.user_id,
            balance: parseFloat(transaction.amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (createWalletError) {
          console.error('Failed to create wallet:', createWalletError)
        } else {
          console.log(`New wallet created with balance ${transaction.amount} for user ${transaction.user_id}`)
        }
      }
    }

    // If it's a successful checkout payment, we can trigger order fulfillment here
    if (isSuccess && transaction.transaction_type === 'checkout') {
      console.log('Checkout payment successful - order can be fulfilled')
      // Here you could trigger order processing, inventory updates, etc.
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Callback processed successfully',
        transaction_id: transaction.id,
        status: updateData.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Callback processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})