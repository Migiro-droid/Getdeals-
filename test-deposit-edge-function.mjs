import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDepositFunction() {
  try {
    console.log('🧪 Testing deposit-funds edge function...');
    
    // First, let's check if we can authenticate (you might need to be logged in)
    console.log('\n🔐 Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('⚠️ No active session. You need to be logged in to test the deposit function.');
      console.log('💡 Login through your app first, then run this test.');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    // Check if user has a profile with customer_id
    console.log('\n👤 Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    console.log('📋 User profile:', profile);
    
    if (!profile.customer_id) {
      console.log('⚠️ No customer_id found. You need to complete KYC first.');
      return;
    }
    
    console.log('✅ Customer ID found:', profile.customer_id);
    
    // Test the deposit-funds function
    console.log('\n💰 Testing deposit-funds function...');
    
    const testPayload = {
      amount: 100,  // Minimum amount
      phone: '0712345678'  // Test phone number
    };
    
    console.log('📤 Sending request with payload:', testPayload);
    
    const { data: result, error: functionError } = await supabase.functions.invoke('deposit-funds', {
      body: testPayload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    
    console.log('\n📥 Function response:');
    console.log('Error:', functionError);
    console.log('Result:', result);
    
    if (functionError) {
      console.error('❌ Function invocation error:', functionError);
      
      // Check if it's a deployment issue
      if (functionError.message?.includes('not found')) {
        console.log('💡 The function might not be deployed. Check your Supabase dashboard.');
      }
      
      if (functionError.message?.includes('unauthorized')) {
        console.log('💡 Authorization issue. Make sure you are logged in correctly.');
      }
      
      return;
    }
    
    if (result?.success) {
      console.log('✅ Deposit function works correctly!');
      console.log('📱 Transaction ID:', result.transaction_id);
      console.log('💬 Message:', result.message);
    } else {
      console.log('⚠️ Deposit function returned error:', result?.error);
    }
    
    // Check if a transaction record was created
    console.log('\n🔍 Checking transaction records...');
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (txError) {
      console.error('❌ Transaction query error:', txError);
    } else {
      console.log('📊 Recent transactions:', transactions);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Also test without authentication to see error handling
async function testWithoutAuth() {
  console.log('\n🚫 Testing deposit-funds without authentication...');
  
  const supabaseNoAuth = createClient(supabaseUrl, supabaseKey);
  
  const { data: result, error: functionError } = await supabaseNoAuth.functions.invoke('deposit-funds', {
    body: {
      amount: 100,
      phone: '0712345678'
    }
  });
  
  console.log('Result without auth:', { result, functionError });
  
  if (functionError || result?.error) {
    console.log('✅ Function correctly rejects unauthorized requests');
  }
}

// Run tests
console.log('🚀 Starting deposit-funds edge function tests...');
testDepositFunction().then(() => {
  return testWithoutAuth();
}).then(() => {
  console.log('\n✅ All tests completed!');
}).catch(console.error);