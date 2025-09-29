// Test M-Pesa STK Push with different phone number
import axios from 'axios';

async function testWithDifferentPhone() {
  console.log('🧪 Testing M-Pesa STK Push with different phone number...');
  console.log('📝 Please provide a different Safaricom number to test');
  
  // Replace this with a different Safaricom number for testing
  const testPhoneNumber = '254700000000'; // CHANGE THIS TO YOUR TEST NUMBER
  
  console.log('⚠️  BEFORE RUNNING:');
  console.log('1. Change the phone number above to a different Safaricom number');
  console.log('2. Make sure that phone has active M-Pesa');
  console.log('3. Ensure the phone has good network coverage');
  console.log('4. Close any open USSD sessions on that phone');
  
  if (testPhoneNumber === '254700000000') {
    console.log('❌ Please update the phone number in the script first!');
    return;
  }

  const testData = {
    phoneNumber: testPhoneNumber,
    amount: 1,
    orderReference: `DIFF_PHONE_TEST_${Date.now()}`,
    description: 'GetDeals Different Phone Test - 1 KES'
  };

  console.log('\n📱 Testing with phone:', testData.phoneNumber);
  console.log('💰 Amount: KES', testData.amount);

  try {
    const response = await axios.post('http://localhost:3001/api/payments/mpesa/stk-push', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ STK Push Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n📱 CHECK THE TEST PHONE NOW!');
      console.log(`- Phone ${testData.phoneNumber} should receive STK push`);
      console.log('- Enter M-Pesa PIN when prompted');
      
      setTimeout(async () => {
        console.log('\n🔍 Checking payment status...');
        try {
          const statusResponse = await axios.get(`http://localhost:3001/api/payments/mpesa/status/${response.data.checkoutRequestId}`);
          console.log('Status:', JSON.stringify(statusResponse.data, null, 2));
          
          if (statusResponse.data.resultCode === '0') {
            console.log('🎉 SUCCESS! STK push worked with this phone number');
          } else if (statusResponse.data.resultCode === '2029') {
            console.log('❌ Same 2029 error - might be a Safaricom network issue');
          }
        } catch (error) {
          console.error('Status check failed:', error.response?.data || error.message);
        }
      }, 20000);
    }

  } catch (error) {
    console.error('\n❌ STK Push failed:', error.response?.data || error.message);
  }
}

// Uncomment the line below after updating the phone number
// testWithDifferentPhone();

console.log('To test: Update the phone number in this script and uncomment the last line');