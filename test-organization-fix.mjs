import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwowymjgzjlbblnfiqmf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b3d5bWpnempsYmJsbmZpcW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY3MjI2OSwiZXhwIjoyMDQ5MjQ4MjY5fQ.I7RCFGRdUZUjmwJHhWgcGDGYUKtEOLEFGpDYBkxe0Yo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testOrganizationFix() {
  console.log('🧪 Testing organization column fix...\n')

  try {
    // Test 1: Check if organization column exists
    console.log('1️⃣ Checking organization column existence...')
    const { data: columnCheck, error: columnError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'organization'
        `
      })
    
    if (columnError) {
      console.log('⚠️ Could not check column (expected if sql RPC not available)')
      console.log('Error:', columnError.message)
    } else if (columnCheck && columnCheck.length > 0) {
      console.log('✅ Organization column exists:', columnCheck[0])
    } else {
      console.log('❌ Organization column not found')
    }

    // Test 2: Check trigger function exists
    console.log('\n2️⃣ Checking handle_new_user function...')
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT routine_name, routine_type, security_type
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'handle_new_user'
        `
      })
    
    if (functionError) {
      console.log('⚠️ Could not check function (expected if sql RPC not available)')
    } else if (functionCheck && functionCheck.length > 0) {
      console.log('✅ handle_new_user function exists:', functionCheck[0])
    } else {
      console.log('❌ handle_new_user function not found')
    }

    // Test 3: Try to query profiles with organization column
    console.log('\n3️⃣ Testing profiles table query with organization...')
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, phone, organization, created_at')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Failed to query profiles with organization:', profilesError.message)
      console.log('This confirms the PGRST204 error is still present')
    } else {
      console.log('✅ Successfully queried profiles with organization column')
      console.log('Sample:', profilesTest[0] || 'No profiles found')
    }

    // Test 4: Test user creation flow (if column exists)
    if (!profilesError) {
      console.log('\n4️⃣ Testing user creation trigger...')
      
      // Create a test user to see if trigger works
      const testEmail = `test-${Date.now()}@example.com`
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'temppassword123',
        email_confirm: true,
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
          phone: '+254700000000',
          organization: 'Test Org'
        }
      })
      
      if (authError) {
        console.log('❌ Failed to create test user:', authError.message)
      } else {
        console.log('✅ Test user created successfully')
        
        // Check if profile was created with organization
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.user.id)
          .single()
        
        if (profileError) {
          console.log('❌ Failed to fetch created profile:', profileError.message)
        } else {
          console.log('✅ Profile created with organization:', profile.organization)
        }
        
        // Clean up test user
        await supabase.auth.admin.deleteUser(authUser.user.id)
        console.log('🧹 Test user cleaned up')
      }
    }

    // Test 5: Simulate deposit function call
    console.log('\n5️⃣ Testing deposit-funds function call...')
    const { data: depositTest, error: depositError } = await supabase.functions.invoke('deposit-funds', {
      body: { 
        amount: 1,
        phone: '+254700000000'
      }
    })
    
    if (depositError) {
      console.log('❌ Deposit function failed:', depositError.message)
      if (depositError.message.includes('organization')) {
        console.log('🎯 Confirmed: PGRST204 organization error still present')
      }
    } else {
      console.log('✅ Deposit function call successful (may fail due to auth, but no schema error)')
      console.log('Response:', depositTest)
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message)
  }
}

// Run the test
testOrganizationFix().then(() => {
  console.log('\n🏁 Test completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test script failed:', error)
  process.exit(1)
})