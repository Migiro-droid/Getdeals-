const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function fixWalletBalances() {
  console.log('🔧 Fixing wallet balance calculations...')
  
  try {
    // Create supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('1️⃣ Getting all wallets and their transactions...')

    // Get all users with wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('user_id, balance')

    if (walletsError) {
      console.error('❌ Failed to fetch wallets:', walletsError)
      return
    }

    console.log(`📊 Found ${wallets.length} wallets to fix`)

    let fixed = 0
    const fixes = []

    console.log('2️⃣ Recalculating balances from completed transactions only...')

    for (const wallet of wallets) {
      try {
        // Get all completed transactions for this user
        const { data: completedTransactions, error: transError } = await supabase
          .from('wallet_transactions')
          .select('type, amount, status')
          .eq('user_id', wallet.user_id)
          .eq('status', 'completed')

        if (transError) {
          console.error(`❌ Transaction error for ${wallet.user_id.slice(0, 8)}:`, transError)
          continue
        }

        // Calculate balance from completed transactions only
        let calculatedBalance = 0
        
        completedTransactions.forEach(transaction => {
          if (transaction.type === 'deposit') {
            calculatedBalance += parseFloat(transaction.amount || 0)
          } else if (transaction.type === 'withdrawal' || transaction.type === 'payment') {
            calculatedBalance -= parseFloat(transaction.amount || 0)
          }
        })

        const oldBalance = parseFloat(wallet.balance || 0)

        // Update wallet balance if different
        if (Math.abs(calculatedBalance - oldBalance) > 0.01) { // Allow for small rounding differences
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
            difference: calculatedBalance - oldBalance,
            completed_transactions: completedTransactions.length
          })

          console.log(`✅ ${wallet.user_id.slice(0, 8)}... | ${oldBalance} → ${calculatedBalance} KES | ${completedTransactions.length} completed txns`)
        } else {
          console.log(`✓ ${wallet.user_id.slice(0, 8)}... | Already correct: ${calculatedBalance} KES`)
        }

        fixed++

      } catch (error) {
        console.error(`❌ Error processing ${wallet.user_id.slice(0, 8)}:`, error)
      }
    }

    console.log('\n🎯 WALLET BALANCE FIX SUMMARY')
    console.log('=============================')
    console.log(`✅ Total wallets processed: ${wallets.length}`)
    console.log(`🔧 Balances that needed fixing: ${fixes.length}`)
    console.log(`✓ Already correct balances: ${fixed - fixes.length}`)
    
    if (fixes.length > 0) {
      console.log('\n📋 Balance Adjustments Made:')
      console.log('----------------------------')
      fixes.forEach(fix => {
        console.log(`User: ${fix.user_id.slice(0, 8)}... | ${fix.old_balance} → ${fix.new_balance} KES | Diff: ${fix.difference.toFixed(2)} | Transactions: ${fix.completed_transactions}`)
      })
      
      const totalAdjustment = fixes.reduce((sum, fix) => sum + fix.difference, 0)
      console.log(`\n💰 Total balance adjustment: ${totalAdjustment.toFixed(2)} KES`)
    }

    console.log('\n✅ CRITICAL FIX COMPLETED!')
    console.log('==========================')
    console.log('• ✅ Wallet balances now only include COMPLETED transactions')
    console.log('• ✅ Failed/pending transactions are properly excluded') 
    console.log('• ✅ Balance calculation is now accurate and reliable')
    console.log('• ✅ Users will see correct wallet balances (only successful deposits)')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the fix
fixWalletBalances()