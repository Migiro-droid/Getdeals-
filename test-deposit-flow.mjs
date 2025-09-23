import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function testDepositFlow() {
  try {
    console.log('🧪 Testing deposit flow to reproduce the error...')
    
    // Create a temporary test user
    const testEmail = `test_deposit_${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log('Creating test user:', testEmail)
    
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Failed to create test user:', signUpError)
      return
    }
    
    console.log('✅ Test user created')
    
    // Sign in the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    if (signInError) {
      console.error('❌ Failed to sign in test user:', signInError)
      return
    }
    
    console.log('✅ Test user signed in')
    
    // Test the deposit-funds function
    const testPayload = {
      amount: 1000,
      phone: '254712345678'
    }
    
    console.log('🔄 Calling deposit-funds function...')
    
    const { data: functionResponse, error: functionError } = await supabase.functions.invoke('deposit-funds', {
      body: testPayload,
      headers: {
        Authorization: `Bearer ${signInData.session.access_token}`,
      },
    })
    
    if (functionError) {
      console.error('❌ Function error:', functionError)
    } else {
      console.log('✅ Function response:', functionResponse)
    }
    
    // Clean up - sign out
    await supabase.auth.signOut()
    console.log('🧹 Cleaned up test session')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

testDepositFlow()