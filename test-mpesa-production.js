// Test M-Pesa Production STK Push
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testProductionSTKPush() {
  console.log('🧪 Testing M-Pesa Production STK Push...');
  console.log('Environment: PRODUCTION');
  console.log('=====================================');

  // Test data - using your actual failed request data
  const testData = {
    phoneNumber: '254719575272', // Your actual phone number from the failed request
    amount: 8500, // KES 8500 from your failed request
    orderReference: 'GD17591314706594NIG', // Correct field name for /stk-push endpoint
    description: 'Payment for GetDeals order GD17591314706594NIG'
  };

  console.log('📱 Phone Number:', testData.phoneNumber);
  console.log('💰 Amount: KES', testData.amount);
  console.log('🆔 Order Reference:', testData.orderReference);

  try {
    console.log('\n🚀 Initiating STK Push...');
    
    const response = await axios.post('http://localhost:3001/api/payments/mpesa/stk-push', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    console.log('\n✅ STK Push Response:');
    console.log('Success:', response.data.success);
    console.log('Checkout Request ID:', response.data.checkoutRequestId);
    console.log('Merchant Request ID:', response.data.merchantRequestId);
    console.log('Response Code:', response.data.responseCode);
    console.log('Response Description:', response.data.responseDescription);
    console.log('Customer Message:', response.data.customerMessage);

    if (response.data.success) {
      console.log('\n🎉 STK Push initiated successfully!');
      console.log('📱 Check your phone for the M-Pesa payment prompt');
      
      // Wait a moment then check status
      console.log('\n⏳ Waiting 10 seconds before checking status...');
      setTimeout(async () => {
        await checkPaymentStatus(response.data.checkoutRequestId);
      }, 10000);
    }

  } catch (error) {
    console.error('\n❌ STK Push failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the M-Pesa service running on port 3001?');
      console.error('Start it with: cd mpesa-service && node index.js');
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function checkPaymentStatus(checkoutRequestId) {
  try {
    console.log('\n🔍 Checking payment status...');
    const statusResponse = await axios.get(`http://localhost:3001/api/payments/mpesa/status/${checkoutRequestId}`);
    
    console.log('Status Response:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Status check failed:', error.response?.data || error.message);
  }
}

// Instructions for testing
console.log('🔧 SETUP INSTRUCTIONS:');
console.log('1. Make sure the M-Pesa service is running: cd mpesa-service && node index.js');
console.log('2. Update the phone number below to your test number');
console.log('3. Make sure you have airtime/M-Pesa balance for testing');
console.log('4. Run this script: node test-mpesa-production.js');
console.log('=====================================\n');

// Run the test
testProductionSTKPush();

console.log('⚠️  SAFETY REMINDER:');
console.log('- This will initiate a REAL payment in PRODUCTION');
console.log('- Only test with small amounts (KES 1-10)');
console.log('- Use your own phone number for testing');
console.log('- Uncomment the testProductionSTKPush() call above to run');
console.log('\nTo run the test, uncomment the last line and provide your phone number.');