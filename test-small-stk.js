// Test M-Pesa STK Push with small amount
import axios from 'axios';

async function testSmallSTKPush() {
  console.log('🧪 Testing M-Pesa STK Push with small amount...');
  
  const testData = {
    phoneNumber: '254719575272',
    amount: 1, // Just 1 KES
    orderReference: `SMALL_TEST_${Date.now()}`,
    description: 'GetDeals Small Test Payment - 1 KES'
  };

  console.log('📱 Phone:', testData.phoneNumber);
  console.log('💰 Amount: KES', testData.amount);
  console.log('🔔 Watch your phone for STK push prompt...');

  try {
    const response = await axios.post('http://localhost:3001/api/payments/mpesa/stk-push', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ STK Push Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n📱 CHECK YOUR PHONE NOW!');
      console.log('- Look for M-Pesa STK push notification');
      console.log('- Enter your M-Pesa PIN when prompted');
      console.log('- Amount should be KES 1.00');
      
      // Wait and check status
      setTimeout(async () => {
        console.log('\n🔍 Checking payment status...');
        try {
          const statusResponse = await axios.get(`http://localhost:3001/api/payments/mpesa/status/${response.data.checkoutRequestId}`);
          console.log('Status:', JSON.stringify(statusResponse.data, null, 2));
        } catch (error) {
          console.error('Status check failed:', error.response?.data || error.message);
        }
      }, 15000);
    }

  } catch (error) {
    console.error('\n❌ STK Push failed:', error.response?.data || error.message);
  }
}

console.log('🚨 TROUBLESHOOTING STEPS IF STK PUSH DOESN\'T APPEAR:');
console.log('1. Ensure phone has 3G/4G network (not 2G)');
console.log('2. Check M-Pesa account: Dial *234# and verify account is active');
console.log('3. Ensure no ongoing USSD session (*234#, *544#, etc.)');
console.log('4. Try restarting the phone if needed');
console.log('5. Ensure phone number 254719575272 is correct');
console.log('=====================================\n');

testSmallSTKPush();