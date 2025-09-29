// Test script for M-Pesa STK Push
import fetch from 'node-fetch';

async function testMpesaSTKPush() {
  try {
    console.log('🧪 Testing M-Pesa STK Push...');
    
    const testData = {
      phoneNumber: '254708374149', // Test phone number for sandbox
      amount: 1, // Test with 1 KES
      orderReference: `TEST_${Date.now()}`,
      description: 'Test payment for GetDeals integration'
    };

    console.log('📱 Test data:', testData);

    const response = await fetch('http://localhost:3001/api/payments/mpesa/stk-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ STK Push initiated successfully!');
      console.log('🔑 CheckoutRequestID:', result.checkoutRequestId);
      
      // Test status check after 5 seconds
      console.log('⏳ Waiting 5 seconds before checking status...');
      setTimeout(async () => {
        await testPaymentStatus(result.checkoutRequestId);
      }, 5000);
      
    } else {
      console.log('❌ STK Push failed:', result.error);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

async function testPaymentStatus(checkoutRequestId) {
  try {
    console.log('\n🔍 Testing payment status check...');
    
    const response = await fetch(`http://localhost:3001/api/payments/mpesa/status/${checkoutRequestId}`);
    const result = await response.json();
    
    console.log('📊 Status response:', response.status);
    console.log('📋 Status data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Status check successful!');
      if (result.resultCode === '0') {
        console.log('💰 Payment completed successfully!');
      } else {
        console.log('⏳ Payment still pending or failed. ResultCode:', result.resultCode);
      }
    } else {
      console.log('❌ Status check failed:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 Status check error:', error.message);
  }
}

// Run the test
testMpesaSTKPush();