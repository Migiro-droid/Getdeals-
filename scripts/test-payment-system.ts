/**
 * Simple test script to verify payment system works with the updated schema
 */

// Test the payment status endpoint directly
async function testPaymentStatus() {
  try {
    const baseUrl = 'https://getdeals.co.ke';
    
    // Test with a dummy checkout request ID
    const testCheckoutRequestId = 'ws_CO_DMZ_123456789_test';
    
    console.log('🧪 Testing payment status endpoint...');
    const response = await fetch(`${baseUrl}/api/payments/mpesa/status/${testCheckoutRequestId}`);
    
    const result = await response.json();
    console.log('📊 Status check result:', result);
    
    if (response.ok) {
      console.log('✅ Payment status endpoint is working');
    } else {
      console.log('❌ Payment status endpoint error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test STK Push endpoint
async function testSTKPush() {
  try {
    const baseUrl = 'https://getdeals.co.ke';
    
    console.log('🧪 Testing STK Push endpoint...');
    const response = await fetch(`${baseUrl}/api/payments/mpesa/stk-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10, // Test with KES 10
        phoneNumber: '254712345678', // Test phone number
        orderId: 'TEST-ORDER-' + Date.now(),
        description: 'Test payment'
      })
    });
    
    const result = await response.json();
    console.log('📊 STK Push result:', result);
    
    if (response.ok && result.success) {
      console.log('✅ STK Push endpoint is working');
      console.log('🔍 CheckoutRequestID:', result.CheckoutRequestID);
      
      // Test the status endpoint with the real checkout request ID
      if (result.CheckoutRequestID) {
        console.log('🔄 Testing status check with real CheckoutRequestID...');
        setTimeout(() => {
          testPaymentStatusWithId(result.CheckoutRequestID);
        }, 2000);
      }
    } else {
      console.log('❌ STK Push endpoint error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testPaymentStatusWithId(checkoutRequestId: string) {
  try {
    const baseUrl = 'https://getdeals.co.ke';
    
    console.log(`🔍 Checking status for: ${checkoutRequestId}`);
    const response = await fetch(`${baseUrl}/api/payments/mpesa/status/${checkoutRequestId}`);
    
    const result = await response.json();
    console.log('📊 Real status check result:', result);
    
    if (response.ok) {
      if (result.paymentConfirmed) {
        console.log('✅ Payment is confirmed!');
      } else {
        console.log('⏳ Payment is still pending');
      }
    } else {
      console.log('❌ Status check error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
}

// Run the tests
console.log('🚀 Starting payment system tests...');
console.log('================================');

// Test status endpoint first
testPaymentStatus();

// Wait a bit then test STK Push
setTimeout(() => {
  console.log('\n🔄 Testing STK Push...');
  testSTKPush();
}, 3000);

export {};