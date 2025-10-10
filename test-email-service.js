/**
 * Email Service Test Script
 * 
 * This script tests the email service with all three template types:
 * 1. Welcome Email
 * 2. Order Confirmation Email
 * 3. Payment Confirmation Email
 * 
 * Usage:
 *   node test-email-service.js <your-email@example.com>
 */

const testEmail = process.argv[2];
const useProduction = process.argv[3] === '--prod';

if (!testEmail) {
  console.error('❌ Error: Please provide an email address');
  console.log('Usage: node test-email-service.js <your-email@example.com> [--prod]');
  console.log('');
  console.log('Examples:');
  console.log('  Local:       node test-email-service.js your@email.com');
  console.log('  Production:  node test-email-service.js your@email.com --prod');
  process.exit(1);
}

const API_BASE = useProduction 
  ? 'https://getdeals.co.ke'
  : (process.env.FRONTEND_URL || 'http://localhost:8080');

async function testWelcomeEmail() {
  console.log('\n📧 Testing Welcome Email...');
  try {
    const response = await fetch(`${API_BASE}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        recipientEmail: testEmail,
        data: {
          name: 'John Doe',
          email: testEmail,
          organization: 'Test Organization'
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log('   Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error testing welcome email:', error.message);
    return false;
  }
}

async function testOrderConfirmationEmail() {
  console.log('\n📦 Testing Order Confirmation Email...');
  try {
    const response = await fetch(`${API_BASE}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order-confirmation',
        recipientEmail: testEmail,
        data: {
          customerName: 'John Doe',
          orderNumber: 'ORD-TEST-12345',
          total: 2500,
          items: [
            { name: 'Premium Coffee Beans', quantity: 2, price: 1000 },
            { name: 'Fresh Milk 1L', quantity: 3, price: 500 }
          ],
          deliveryAddress: '123 Main Street, Nairobi',
          paymentMethod: 'M-Pesa',
          createdAt: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Order confirmation email sent successfully!');
      console.log('   Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send order confirmation email:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error testing order confirmation email:', error.message);
    return false;
  }
}

async function testPaymentConfirmationEmail() {
  console.log('\n💰 Testing Payment Confirmation Email...');
  try {
    const response = await fetch(`${API_BASE}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment-confirmation',
        recipientEmail: testEmail,
        data: {
          customerName: 'John Doe',
          transactionId: 'TXN-TEST-67890',
          amount: 2500,
          paymentMethod: 'M-Pesa',
          orderNumber: 'ORD-TEST-12345',
          paidAt: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Payment confirmation email sent successfully!');
      console.log('   Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send payment confirmation email:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error testing payment confirmation email:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 GetDeals Email Service Test Suite');
  console.log('=====================================');
  console.log(`📬 Test recipient: ${testEmail}`);
  console.log(`🌐 API Base URL: ${API_BASE}`);
  console.log(`📍 Mode: ${useProduction ? 'PRODUCTION' : 'LOCAL DEVELOPMENT'}`);
  
  // Check if server is reachable
  console.log('\n🔍 Checking server connectivity...');
  try {
    const healthCheck = await fetch(`${API_BASE}/api/email/send`, {
      method: 'GET'
    });
    if (healthCheck.ok) {
      console.log('✅ Server is reachable');
    } else {
      console.log(`⚠️  Server returned status ${healthCheck.status}`);
    }
  } catch (error) {
    console.error('❌ Cannot reach server. Make sure:');
    if (!useProduction) {
      console.error('   1. Local dev server is running: npm run dev');
      console.error('   2. Or use --prod flag to test production: node test-email-service.js email@example.com --prod');
    } else {
      console.error('   1. Production server is accessible');
      console.error('   2. You have internet connectivity');
    }
    process.exit(1);
  }
  
  const results = {
    welcome: false,
    order: false,
    payment: false
  };

  // Run tests with delay between each
  results.welcome = await testWelcomeEmail();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.order = await testOrderConfirmationEmail();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.payment = await testPaymentConfirmationEmail();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Welcome Email:          ${results.welcome ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Order Confirmation:     ${results.order ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Payment Confirmation:   ${results.payment ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.welcome && results.order && results.payment;
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed. Check logs above.'}`);
  
  if (allPassed) {
    console.log(`\n📬 Check ${testEmail} for the test emails!`);
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
