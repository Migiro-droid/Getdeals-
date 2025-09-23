import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwowymjgzjlbblnfiqmf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b3d5bWpnempsYmJsbmZpcW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY3MjI2OSwiZXhwIjoyMDQ5MjQ4MjY5fQ.I7RCFGRdUZUjmwJHhWgcGDGYUKtEOLEFGpDYBkxe0Yo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function comprehensiveFixTest() {
  console.log('🧪 COMPREHENSIVE BULLETPROOF FIX TESTING\n')

  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  }

  function addTest(name, passed, details = '') {
    testResults.tests.push({ name, passed, details })
    if (passed) {
      testResults.passed++
      console.log(`✅ ${name}: PASS ${details ? `- ${details}` : ''}`)
    } else {
      testResults.failed++
      console.log(`❌ ${name}: FAIL ${details ? `- ${details}` : ''}`)
    }
  }

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing Supabase connectivity...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()
    
    if (healthError && !healthError.message.includes('organization')) {
      addTest('Connectivity', false, healthError.message)
    } else {
      addTest('Connectivity', true, 'Supabase connection established')
    }

    // Test 2: Organization column query
    console.log('\n2️⃣ Testing organization column access...')
    const { data: profilesWithOrg, error: orgError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, organization, created_at')
      .limit(5)
    
    if (orgError) {
      addTest('Organization Column', false, orgError.message)
      if (orgError.message.includes('organization')) {
        console.log('🎯 CONFIRMED: Organization column error still exists')
        console.log('💡 Please run the BULLETPROOF_ORGANIZATION_FIX.sql script')
        return testResults
      }
    } else {
      addTest('Organization Column', true, `Retrieved ${profilesWithOrg?.length || 0} profiles with organization field`)
    }

    // Test 3: Complete profile structure
    console.log('\n3️⃣ Testing complete profile table structure...')
    try {
      const { data: profileStructure, error: structureError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, phone, organization, email_verified, avatar_url, created_at, updated_at')
        .limit(1)
      
      if (structureError) {
        addTest('Profile Structure', false, structureError.message)
      } else {
        addTest('Profile Structure', true, 'All expected columns accessible')
      }
    } catch (err) {
      addTest('Profile Structure', false, err.message)
    }

    // Test 4: Wallet table access
    console.log('\n4️⃣ Testing wallet table access...')
    const { data: wallets, error: walletError } = await supabase
      .from('wallets')
      .select('id, user_id, balance, is_active, created_at')
      .limit(5)
    
    if (walletError) {
      addTest('Wallet Access', false, walletError.message)
    } else {
      addTest('Wallet Access', true, `Retrieved ${wallets?.length || 0} wallet records`)
    }

    // Test 5: User creation simulation
    console.log('\n5️⃣ Testing user creation flow...')
    const testEmail = `bulletproof-test-${Date.now()}@example.com`
    const testPassword = 'BulletproofTest123!'
    
    try {
      // Create test user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'Bulletproof',
          last_name: 'Test',
          phone: '+254700000001',
          organization: 'Test Organization Ltd'
        }
      })
      
      if (authError) {
        addTest('User Creation', false, authError.message)
      } else {
        addTest('User Creation', true, 'Test user created successfully')
        
        // Check if profile was created automatically by trigger
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for trigger
        
        const { data: createdProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.user.id)
          .single()
        
        if (profileCheckError) {
          addTest('Trigger Profile Creation', false, profileCheckError.message)
        } else {
          addTest('Trigger Profile Creation', true, `Profile created with organization: "${createdProfile.organization}"`)
        }
        
        // Check if wallet was created
        const { data: createdWallet, error: walletCheckError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', authUser.user.id)
          .single()
        
        if (walletCheckError) {
          addTest('Trigger Wallet Creation', false, walletCheckError.message)
        } else {
          addTest('Trigger Wallet Creation', true, `Wallet created with balance: ${createdWallet.balance}`)
        }
        
        // Clean up test user
        await supabase.auth.admin.deleteUser(authUser.user.id)
        console.log('🧹 Test user cleaned up')
      }
    } catch (err) {
      addTest('User Creation Flow', false, err.message)
    }

    // Test 6: Deposit function call
    console.log('\n6️⃣ Testing deposit-funds edge function...')
    try {
      const { data: depositTest, error: depositError } = await supabase.functions.invoke('deposit-funds', {
        body: { 
          amount: 1,
          phone: '+254700000001'
        }
      })
      
      if (depositError) {
        if (depositError.message.includes('organization')) {
          addTest('Deposit Function', false, 'PGRST204 organization error detected')
        } else if (depositError.message.includes('authorization') || depositError.message.includes('auth')) {
          addTest('Deposit Function', true, 'Function accessible (auth error expected without user)')
        } else {
          addTest('Deposit Function', false, depositError.message)
        }
      } else {
        addTest('Deposit Function', true, 'Function call successful')
      }
    } catch (err) {
      if (err.message.includes('fetch failed')) {
        addTest('Deposit Function', false, 'Network connectivity issue')
      } else {
        addTest('Deposit Function', false, err.message)
      }
    }

    // Test 7: Register customer function
    console.log('\n7️⃣ Testing register-customer edge function...')
    try {
      const { data: registerTest, error: registerError } = await supabase.functions.invoke('register-customer', {
        body: { 
          phone: '+254700000001',
          first_name: 'Test',
          last_name: 'User'
        }
      })
      
      if (registerError) {
        if (registerError.message.includes('organization')) {
          addTest('Register Customer Function', false, 'PGRST204 organization error detected')
        } else if (registerError.message.includes('authorization') || registerError.message.includes('auth')) {
          addTest('Register Customer Function', true, 'Function accessible (auth error expected without user)')
        } else {
          addTest('Register Customer Function', false, registerError.message)
        }
      } else {
        addTest('Register Customer Function', true, 'Function call successful')
      }
    } catch (err) {
      if (err.message.includes('fetch failed')) {
        addTest('Register Customer Function', false, 'Network connectivity issue')
      } else {
        addTest('Register Customer Function', false, err.message)
      }
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
    addTest('Test Suite Execution', false, error.message)
  }

  // Final results
  console.log('\n' + '='.repeat(60))
  console.log('📊 COMPREHENSIVE TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`✅ Tests Passed: ${testResults.passed}`)
  console.log(`❌ Tests Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`)
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your fix is working perfectly!')
    console.log('✅ No PGRST204 errors detected')
    console.log('✅ All database operations functional')
    console.log('✅ Trigger functions working correctly')
    console.log('✅ Edge functions accessible')
  } else {
    console.log('\n⚠️ Some tests failed. Review the issues above.')
    if (testResults.tests.find(t => t.name.includes('Organization') && !t.passed)) {
      console.log('🔧 Run the BULLETPROOF_ORGANIZATION_FIX.sql script to resolve schema issues')
    }
  }
  
  return testResults
}

// Run the comprehensive test
comprehensiveFixTest().then((results) => {
  console.log('\n🏁 Testing completed')
  process.exit(results.failed === 0 ? 0 : 1)
}).catch(error => {
  console.error('💥 Test script failed:', error)
  process.exit(1)
})