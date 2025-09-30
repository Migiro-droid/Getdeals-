// Test script for M-Pesa integration
import axios from 'axios';

const BASE_URL = 'https://getdeals.co.ke';

async function testSTKPush() {
  try {
    console.log('🧪 Testing STK Push endpoint...');
    
    const response = await axios.post(`${BASE_URL}/api/payments/mpesa/stk-push`, {
      phoneNumber: '254712345678',
      amount: 1,
      orderId: 'test_order_' + Date.now()
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ STK Push Response:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('❌ STK Push Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    return null;
  }
}

async function testCallback() {
  try {
    console.log('🧪 Testing Callback endpoint...');
    
    // Sample M-Pesa callback data
    const callbackData = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'test-merchant-123',
          CheckoutRequestID: 'test-checkout-456',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1 },
              { Name: 'MpesaReceiptNumber', Value: 'TEST123456' },
              { Name: 'TransactionDate', Value: 20230930143000 },
              { Name: 'PhoneNumber', Value: 254712345678 }
            ]
          }
        }
      }
    };

    const response = await axios.post(`${BASE_URL}/api/payments/mpesa/callback`, callbackData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Callback Response:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Callback Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting M-Pesa Integration Tests');
  console.log('📡 Base URL:', BASE_URL);
  console.log('='.repeat(50));
  
  // Test 1: STK Push
  await testSTKPush();
  
  console.log('='.repeat(50));
  
  // Test 2: Callback
  await testCallback();
  
  console.log('='.repeat(50));
  console.log('✅ Testing completed!');
}

runTests().catch(console.error);