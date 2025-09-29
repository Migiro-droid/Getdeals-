// Production M-Pesa Test Script
import fetch from 'node-fetch';

async function testProductionMpesa() {
  console.log('🚀 Testing M-Pesa PRODUCTION Configuration...');
  console.log('⚠️  WARNING: This will attempt real M-Pesa transactions in production!');
  
  // Production test data - use small amount
  const testData = {
    phoneNumber: '254708374149', // Replace with your actual phone number
    amount: 1, // Start with KES 1 for testing
    orderReference: `PROD_TEST_${Date.now()}`,
    description: 'GetDeals Production Test Payment'
  };

  console.log('📱 Production test data:', testData);
  console.log('💡 Make sure your phone is ready to receive M-Pesa prompt!');

  try {
    // Test health check first
    console.log('\n🔍 Testing M-Pesa service health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test STK Push
    console.log('\n💳 Initiating PRODUCTION STK Push...');
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
      console.log('✅ PRODUCTION STK Push initiated successfully!');
      console.log('🔑 CheckoutRequestID:', result.checkoutRequestId);
      console.log('💬 Customer Message:', result.customerMessage);
      console.log('');
      console.log('📱 CHECK YOUR PHONE for M-Pesa payment prompt!');
      console.log('⏰ You have 60 seconds to complete the payment...');
      
      // Check status after 10 seconds
      setTimeout(async () => {
        await checkProductionPaymentStatus(result.checkoutRequestId);
      }, 10000);
      
    } else {
      console.log('❌ PRODUCTION STK Push failed:', result.error);
      
      // Common production errors and solutions
      if (result.error?.includes('Invalid CallBackURL')) {
        console.log('💡 Solution: Ensure callback URL is HTTPS and publicly accessible');
      } else if (result.error?.includes('Merchant does not exist')) {
        console.log('💡 Solution: Verify your production shortcode is correct');
      } else if (result.error?.includes('Invalid Access Token')) {
        console.log('💡 Solution: Check your production consumer key and secret');
      }
    }

  } catch (error) {
    console.error('🚨 Production test error:', error.message);
    console.log('💡 Make sure M-Pesa service is running: npm run dev');
  }
}

async function checkProductionPaymentStatus(checkoutRequestId) {
  try {
    console.log('\n🔍 Checking PRODUCTION payment status...');
    
    const response = await fetch(`http://localhost:3001/api/payments/mpesa/status/${checkoutRequestId}`);
    const result = await response.json();
    
    console.log('📊 Status response:', response.status);
    console.log('📋 Status data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Status check successful!');
      
      if (result.resultCode === '0') {
        console.log('🎉 PAYMENT COMPLETED SUCCESSFULLY!');
        console.log('💰 Amount:', result.amount);
        console.log('🧾 M-Pesa Receipt:', result.mpesaReceiptNumber);
        console.log('📞 Phone:', result.phoneNumber);
      } else if (result.resultCode === '1032') {
        console.log('❌ Payment cancelled by user');
      } else if (result.resultCode === '1037') {
        console.log('⏰ Payment timed out');
      } else {
        console.log('⏳ Payment status:', result.resultDesc);
        console.log('📝 Result Code:', result.resultCode);
      }
    } else {
      console.log('❌ Status check failed:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 Status check error:', error.message);
  }
}

// Confirmation prompt for production testing
console.log('⚠️  PRODUCTION M-PESA TESTING');
console.log('This will initiate real M-Pesa transactions!');
console.log('Make sure you have:');
console.log('1. ✅ Production credentials in .env file');
console.log('2. ✅ Valid callback URL (HTTPS)');
console.log('3. ✅ Phone ready to receive M-Pesa prompt');
console.log('4. ✅ Small test amount (KES 1)');
console.log('');

// Run the test
testProductionMpesa();