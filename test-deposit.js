/**
 * Test script for wallet deposit functionality
 * Tests the updated Rukisha tap-and-go deposit-funds API integration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeposit() {
  console.log('🧪 Testing Wallet Deposit Functionality');
  console.log('=====================================');
  
  try {
    // Test 1: Check if we need authentication
    console.log('\n1. Testing without authentication...');
    const { data: noAuthResult, error: noAuthError } = await supabase.functions.invoke('deposit-funds', {
      body: {
        amount: 100,
        phone: '0712345678'
      }
    });
    
    console.log('No Auth Result:', { noAuthResult, noAuthError });
    if (noAuthError && noAuthError.context) {
      const responseText = await noAuthError.context.text();
      console.log('No Auth Response Text:', responseText);
    }
    
    // Test 2: Test with dummy authentication (this will fail but show us the auth flow)
    console.log('\n2. Testing with dummy authentication...');
    const { data: dummyAuthResult, error: dummyAuthError } = await supabase.functions.invoke('deposit-funds', {
      body: {
        amount: 100,
        phone: '0712345678'
      },
      headers: {
        Authorization: 'Bearer dummy-token'
      }
    });
    
    console.log('Dummy Auth Result:', { dummyAuthResult, dummyAuthError });
    
    // Test 3: Test input validation
    console.log('\n3. Testing input validation...');
    
    // Test with invalid amount
    const { data: lowAmountResult, error: lowAmountError } = await supabase.functions.invoke('deposit-funds', {
      body: {
        amount: 50, // Below minimum
        phone: '0712345678'
      }
    });
    console.log('Low Amount Test:', { lowAmountResult, lowAmountError });
    
    // Test with invalid phone
    const { data: invalidPhoneResult, error: invalidPhoneError } = await supabase.functions.invoke('deposit-funds', {
      body: {
        amount: 100,
        phone: '123' // Invalid format
      }
    });
    console.log('Invalid Phone Test:', { invalidPhoneResult, invalidPhoneError });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// For browser testing
async function testDepositInBrowser() {
  console.log('🌐 Testing via direct fetch (browser-style)...');
  
  try {
    const response = await fetch('https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/deposit-funds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify({
        amount: 100,
        phone: '0712345678'
      })
    });
    
    const result = await response.text();
    console.log('Direct Fetch Response Status:', response.status);
    console.log('Direct Fetch Response:', result);
    
  } catch (error) {
    console.error('❌ Direct fetch failed:', error);
  }
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.testDeposit = testDeposit;
  window.testDepositInBrowser = testDepositInBrowser;
  console.log('✅ Test functions loaded. Run testDeposit() or testDepositInBrowser() in console.');
} else {
  // Node environment
  testDeposit().then(() => {
    console.log('\n✅ All tests completed!');
  });
}