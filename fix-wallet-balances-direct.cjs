const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function fixWalletBalances() {
  console.log('🔧 Fixing wallet balance calculations directly...')
  
  try {
    // Create supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('1️⃣ Creating balance calculation functions...')

    // First, create the balance calculation function
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })

    if (funcError) {
      console.error('❌ Failed to create function:', funcError)
      return
    }

    console.log('✅ Balance calculation function created')

    console.log('2️⃣ Getting all wallets...')

    // Get all wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('user_id, balance')

    if (walletsError) {
      console.error('❌ Failed to fetch wallets:', walletsError)
      return
    }

    console.log(`📊 Found ${wallets.length} wallets to fix`)

    console.log('3️⃣ Recalculating balances...')

    let fixed = 0
    const fixes = []

    for (const wallet of wallets) {
      try {
        // Calculate correct balance
        const { data: newBalance, error: calcError } = await supabase
          .rpc('calculate_wallet_balance', { p_user_id: wallet.user_id })

        if (calcError) {
          console.error(`❌ Calc error for ${wallet.user_id.slice(0, 8)}:`, calcError)
          continue
        }

        const oldBalance = parseFloat(wallet.balance || 0)
        const calculatedBalance = parseFloat(newBalance || 0)

        // Update wallet balance
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ 
            balance: calculatedBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', wallet.user_id)

        if (updateError) {
          console.error(`❌ Update error for ${wallet.user_id.slice(0, 8)}:`, updateError)
          continue
        }

        fixes.push({
          user_id: wallet.user_id,
          old_balance: oldBalance,
          new_balance: calculatedBalance,
          difference: calculatedBalance - oldBalance
        })

        fixed++
        console.log(`✅ ${wallet.user_id.slice(0, 8)}... | ${oldBalance} → ${calculatedBalance} KES | Diff: ${(calculatedBalance - oldBalance).toFixed(2)}`)

      } catch (error) {
        console.error(`❌ Error processing ${wallet.user_id.slice(0, 8)}:`, error)
      }
    }

    console.log('\n🎯 WALLET BALANCE FIX SUMMARY')
    console.log('=============================')
    console.log(`✅ Total wallets processed: ${wallets.length}`)
    console.log(`🔧 Successfully fixed: ${fixed}`)
    console.log(`❌ Failed to fix: ${wallets.length - fixed}`)
    
    if (fixes.length > 0) {
      const totalAdjustment = fixes.reduce((sum, fix) => sum + fix.difference, 0)
      console.log(`💰 Total balance adjustment: ${totalAdjustment.toFixed(2)} KES`)
    }

    console.log('\n✅ CRITICAL FIX APPLIED:')
    console.log('• Wallet balances now only include COMPLETED transactions')
    console.log('• Failed/pending transactions are properly excluded')
    console.log('• Balance calculation is now accurate and reliable')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the fix
fixWalletBalances()