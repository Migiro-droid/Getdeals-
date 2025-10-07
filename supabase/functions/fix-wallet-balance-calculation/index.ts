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

    console.log('🔧 Applying wallet balance calculation fix...')

    // Step 1: Create balance calculation functions
    console.log('1. Creating balance calculation functions...')
    
    const functionsSQL = `
      -- Create a function to calculate wallet balance from completed transactions only
      CREATE OR REPLACE FUNCTION calculate_wallet_balance(p_user_id UUID)
      RETURNS NUMERIC AS $$
      DECLARE
        total_balance NUMERIC := 0;
      BEGIN
        -- Calculate balance from completed transactions only
        SELECT COALESCE(SUM(
          CASE 
            WHEN type = 'deposit' AND status = 'completed' THEN amount
            WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
            WHEN type = 'payment' AND status = 'completed' THEN -amount
            ELSE 0
          END
        ), 0) INTO total_balance
        FROM wallet_transactions
        WHERE user_id = p_user_id;
        
        RETURN total_balance;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create a function for safe balance updates
      CREATE OR REPLACE FUNCTION safe_increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
      RETURNS NUMERIC AS $$
      DECLARE
        new_balance NUMERIC;
      BEGIN
        -- Always recalculate from completed transactions
        new_balance := calculate_wallet_balance(p_user_id);
        
        -- Update wallet with calculated balance
        UPDATE wallets 
        SET 
          balance = new_balance,
          updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- If no wallet exists, create one
        IF NOT FOUND THEN
          INSERT INTO wallets (user_id, balance, is_active, created_at, updated_at)
          VALUES (p_user_id, new_balance, true, NOW(), NOW());
        END IF;
        
        RETURN new_balance;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the functions creation
    const { error: functionsError } = await supabaseAdmin.rpc('sql', {
      query: functionsSQL
    })

    if (functionsError) {
      console.error('❌ Failed to create functions:', functionsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create functions', details: functionsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ Balance calculation functions created')

    // Step 2: Get all wallets and fix their balances
    console.log('2. Fixing existing wallet balances...')
    
    const { data: wallets, error: walletsError } = await supabaseAdmin
      .from('wallets')
      .select('user_id, balance')

    if (walletsError) {
      console.error('❌ Failed to fetch wallets:', walletsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch wallets', details: walletsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let fixedCount = 0
    const fixes = []

    for (const wallet of wallets) {
      try {
        // Calculate correct balance using the new function
        const { data: newBalance, error: calcError } = await supabaseAdmin
          .rpc('calculate_wallet_balance', { p_user_id: wallet.user_id })

        if (calcError) {
          console.error(`❌ Failed to calculate balance for ${wallet.user_id}:`, calcError)
          continue
        }

        const oldBalance = wallet.balance || 0
        const calculatedBalance = newBalance || 0

        // Update the wallet balance
        const { error: updateError } = await supabaseAdmin
          .from('wallets')
          .update({ 
            balance: calculatedBalance, 
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', wallet.user_id)

        if (updateError) {
          console.error(`❌ Failed to update balance for ${wallet.user_id}:`, updateError)
          continue
        }

        fixes.push({
          user_id: wallet.user_id,
          old_balance: oldBalance,
          new_balance: calculatedBalance,
          difference: calculatedBalance - oldBalance
        })

        fixedCount++
        console.log(`✅ Fixed wallet ${wallet.user_id.slice(0, 8)}... - Old: KES ${oldBalance} → New: KES ${calculatedBalance}`)

      } catch (error) {
        console.error(`❌ Error processing wallet ${wallet.user_id}:`, error)
      }
    }

    console.log(`🎯 Fixed ${fixedCount}/${wallets.length} wallet balances`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully fixed ${fixedCount} wallet balances`,
        total_wallets: wallets.length,
        fixed_wallets: fixedCount,
        fixes: fixes.slice(0, 10), // Return first 10 fixes for reference
        summary: {
          functions_created: true,
          balances_recalculated: true,
          only_completed_transactions_counted: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Wallet balance fix error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})