// M-Pesa Credentials Validator
// Run this to test your credentials before going live

import MpesaService from './lib/mpesa.js';
import dotenv from 'dotenv';

dotenv.config();

async function validateCredentials() {
  console.log('🔍 Validating M-Pesa Credentials...\n');
  
  const mpesaService = new MpesaService();
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log('- Consumer Key:', process.env.MPESA_CONSUMER_KEY ? '✅ Set' : '❌ Missing');
  console.log('- Consumer Secret:', process.env.MPESA_CONSUMER_SECRET ? '✅ Set' : '❌ Missing');
  console.log('- Passkey:', process.env.MPESA_PASSKEY ? '✅ Set' : '❌ Missing');
  console.log('- Shortcode:', process.env.MPESA_SHORTCODE || '❌ Missing');
  console.log('- Environment:', process.env.MPESA_ENVIRONMENT || 'sandbox');
  console.log('- Callback URL:', process.env.MPESA_CALLBACK_URL || '❌ Missing');
  
  // Check for common issues
  console.log('\n🔍 Checking for Common Issues:');
  
  const passkey = process.env.MPESA_PASSKEY;
  const environment = process.env.MPESA_ENVIRONMENT;
  
  if (passkey === 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919' && environment === 'production') {
    console.log('⚠️  WARNING: You\'re using sandbox passkey in production mode!');
    console.log('   Solution: Get your production passkey from Safaricom');
  }
  
  const shortcode = process.env.MPESA_SHORTCODE;
  if (shortcode === '174379' && environment === 'production') {
    console.log('⚠️  WARNING: You\'re using sandbox shortcode (174379) in production!');
    console.log('   Solution: Use your actual production shortcode');
  }
  
  // Test access token
  console.log('\n🔑 Testing Access Token...');
  try {
    const token = await mpesaService.getAccessToken();
    console.log('✅ Access token obtained successfully');
    console.log('🎯 Your credentials are working for authentication');
  } catch (error) {
    console.log('❌ Failed to get access token');
    console.log('📋 Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 Solution: Check your Consumer Key and Consumer Secret');
    }
    
    return false;
  }
  
  console.log('\n📞 Testing Small STK Push...');
  try {
    const result = await mpesaService.initiateSTKPush(
      '254708374149', // Test number
      1, // KES 1
      `TEST_${Date.now()}`,
      'Credentials Test'
    );
    
    if (result.success) {
      console.log('✅ STK Push test successful!');
      console.log('🎉 Your credentials are fully working');
      return true;
    } else {
      console.log('❌ STK Push test failed');
      console.log('📋 Error:', result.error);
      console.log('🔢 Error Code:', result.errorCode);
      
      if (result.errorCode === '500.001.1001') {
        console.log('\n💡 SOLUTION FOR ERROR 500.001.1001:');
        console.log('1. Verify Consumer Key and Consumer Secret are correct');
        console.log('2. Ensure credentials match your shortcode');
        console.log('3. Check if you need production credentials (not sandbox)');
        console.log('4. Confirm your app is approved for production');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ STK Push test error:', error.message);
    return false;
  }
}

// Run validation
validateCredentials().then(success => {
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED - Ready for production!');
  } else {
    console.log('\n🚨 TESTS FAILED - Please fix issues before going live');
  }
});