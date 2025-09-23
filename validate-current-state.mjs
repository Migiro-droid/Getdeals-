import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwowymjgzjlbblnfiqmf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b3d5bWpnempsYmJsbmZpcW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY3MjI2OSwiZXhwIjoyMDQ5MjQ4MjY5fQ.I7RCFGRdUZUjmwJHhWgcGDGYUKtEOLEFGpDYBkxe0Yo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function validateCurrentState() {
  console.log('🔍 VALIDATING CURRENT DATABASE STATE')
  console.log('This will help determine what needs to be fixed\n')

  try {
    // Test 1: Check if we can query profiles at all
    console.log('1️⃣ Testing basic profiles table access...')
    const { data: basicProfiles, error: basicError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .limit(1)
    
    if (basicError) {
      console.log('❌ Cannot access profiles table:', basicError.message)
      return false
    } else {
      console.log('✅ Profiles table accessible')
    }

    // Test 2: Check organization column specifically
    console.log('\n2️⃣ Testing organization column...')
    const { data: profilesWithOrg, error: orgError } = await supabase
      .from('profiles')
      .select('id, organization')
      .limit(1)
    
    if (orgError) {
      console.log('❌ ORGANIZATION COLUMN ERROR DETECTED!')
      console.log('Error:', orgError.message)
      
      if (orgError.message.includes('organization')) {
        console.log('\n🎯 CONFIRMED: This is the PGRST204 organization column error')
        console.log('📝 SOLUTION: Run the BULLETPROOF_ORGANIZATION_FIX.sql script')
        return false
      }
    } else {
      console.log('✅ Organization column accessible')
    }

    // Test 3: Check deposit function
    console.log('\n3️⃣ Testing deposit-funds function...')
    const { error: depositError } = await supabase.functions.invoke('deposit-funds', {
      body: { amount: 1, phone: '+254700000000' }
    })
    
    if (depositError) {
      if (depositError.message.includes('organization')) {
        console.log('❌ DEPOSIT FUNCTION HAS ORGANIZATION ERROR!')
        console.log('Error:', depositError.message)
        return false
      } else if (depositError.message.includes('auth')) {
        console.log('✅ Deposit function accessible (auth error expected)')
      } else {
        console.log('⚠️ Deposit function error (not organization related):', depositError.message)
      }
    } else {
      console.log('✅ Deposit function working')
    }

    console.log('\n🎉 VALIDATION COMPLETE: No PGRST204 organization errors detected!')
    console.log('✅ Your database appears to be working correctly')
    return true

  } catch (error) {
    console.log('💥 Validation failed:', error.message)
    
    if (error.message.includes('fetch failed')) {
      console.log('\n🌐 NETWORK CONNECTIVITY ISSUE')
      console.log('📝 Please check your internet connection and try again')
      console.log('📝 Alternatively, apply the fix manually through Supabase Dashboard')
    }
    
    return false
  }
}

// Run validation
validateCurrentState().then((isHealthy) => {
  if (isHealthy) {
    console.log('\n🎯 NEXT STEPS:')
    console.log('✅ Your database appears healthy')
    console.log('📝 Test your application to confirm everything works')
    console.log('📝 If you still see errors, run the bulletproof fix as a precaution')
  } else {
    console.log('\n🔧 NEXT STEPS:')
    console.log('1. Open Supabase Dashboard > SQL Editor')
    console.log('2. Run the BULLETPROOF_ORGANIZATION_FIX.sql script')
    console.log('3. Run: node bulletproof-test.mjs to verify the fix')
    console.log('4. Test your application deposit functionality')
  }
  
  process.exit(0)
}).catch(error => {
  console.error('💥 Validation script failed:', error)
  process.exit(1)
})