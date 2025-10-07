const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function callFixFunction() {
  console.log('🔧 Calling wallet balance fix function...')
  
  try {
    // Create supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('📞 Calling fix-wallet-balance-calculation function...')

    // Call the deployed Edge Function
    const { data, error } = await supabase.functions.invoke('fix-wallet-balance-calculation')

    if (error) {
      console.error('❌ Error calling function:', error)
      return
    }

    console.log('\n🎯 Wallet Balance Fix Results:')
    console.log('================================')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Failed to call fix function:', error)
  }
}

// Run the fix
callFixFunction()