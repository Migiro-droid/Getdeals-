import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Starting stuck transactions fix...')

    // Find pending transactions older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: stuckTransactions, error: queryError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('status', 'pending')
      .eq('type', 'deposit')
      .lt('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('❌ Error querying stuck transactions:', queryError)
      return new Response(
        JSON.stringify({ success: false, error: 'Database query failed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!stuckTransactions || stuckTransactions.length === 0) {
      console.log('✅ No stuck transactions found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No stuck transactions found',
          processed: 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 Found ${stuckTransactions.length} potentially stuck transactions`)

    let processedCount = 0
    const errors = []
    const processedTransactions = []

    // Process each stuck transaction
    for (const transaction of stuckTransactions) {
      try {
        console.log(`🔄 Processing transaction ${transaction.transaction_id}...`)

        // Update transaction status to completed
        const { error: updateError } = await supabaseAdmin
          .from('wallet_transactions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .eq('id', transaction.id)

        if (updateError) {
          console.error(`❌ Failed to update transaction ${transaction.id}:`, updateError)
          errors.push({
            transaction_id: transaction.transaction_id,
            error: updateError.message
          })
          continue
        }

        // Recalculate wallet balance from completed transactions only
        const { error: balanceError } = await supabaseAdmin.rpc('safe_increment_wallet_balance', {
          p_user_id: transaction.user_id,
          p_amount: 0 // Just trigger recalculation, don't add extra amount
        })

        if (balanceError) {
          console.error(`❌ Failed to update wallet balance for transaction ${transaction.id}:`, balanceError)
          
          // Revert transaction status if balance update failed
          await supabaseAdmin
            .from('wallet_transactions')
            .update({ 
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id)

          errors.push({
            transaction_id: transaction.transaction_id,
            error: `Balance update failed: ${balanceError.message}`
          })
          continue
        }

        processedCount++
        processedTransactions.push({
          transaction_id: transaction.transaction_id,
          amount: transaction.amount,
          user_id: transaction.user_id
        })
        
        console.log(`✅ Successfully processed transaction ${transaction.transaction_id} (KES ${transaction.amount})`)

      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.id}:`, error)
        errors.push({
          transaction_id: transaction.transaction_id,
          error: error.message || 'Unknown error'
        })
      }
    }

    console.log(`🎯 Processing complete: ${processedCount}/${stuckTransactions.length} transactions fixed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${processedCount} stuck transactions`,
        processed: processedCount,
        total_found: stuckTransactions.length,
        processed_transactions: processedTransactions,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Stuck transactions fix error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})