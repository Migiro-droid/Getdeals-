import 'dotenv/config';
import BrevoService from '../src/services/brevo-service-fetch.js';

const brevoService = new BrevoService();

async function testEmailIntegration() {
  console.log('🧪 Testing complete email integration...\n');
  
  const testEmail = 'j.ericndivo@gmail.com'; // Change this to your email to receive test emails
  
  try {
    // Test 1: Welcome Email
    console.log('1️⃣ Testing Welcome Email...');
    const welcomeResult = await brevoService.sendWelcomeEmail(testEmail, {
      name: 'John Doe',
      email: testEmail,
      organization: 'Test Company Ltd'
    });
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully');
      console.log('   Message ID:', welcomeResult.messageId);
    } else {
      console.log('❌ Welcome email failed:', welcomeResult.error);
    }

    // Test 2: Payment Confirmation Email  
    console.log('\n2️⃣ Testing Payment Confirmation Email...');
    const paymentResult = await brevoService.sendPaymentConfirmation(testEmail, {
      customerName: 'John Doe',
      transactionId: 'MPESA123456789',
      amount: 1500,
      method: 'M-Pesa',
      orderNumber: 'ORD-TEST-001',
      paidAt: new Date().toISOString()
    });
    
    if (paymentResult.success) {
      console.log('✅ Payment confirmation sent successfully');
      console.log('   Message ID:', paymentResult.messageId);
    } else {
      console.log('❌ Payment confirmation failed:', paymentResult.error);
    }

    // Test 3: Order Confirmation Email
    console.log('\n3️⃣ Testing Order Confirmation Email...');
    const orderResult = await brevoService.sendOrderConfirmation(testEmail, {
      customerName: 'John Doe',
      orderNumber: 'ORD-TEST-001',
      total: 1500,
      items: [
        { name: 'Test Product 1', quantity: 2, price: 750 },
        { name: 'Test Product 2', quantity: 1, price: 750 }
      ],
      deliveryAddress: '123 Test Street, Nairobi, Kenya',
      paymentMethod: 'M-Pesa',
      createdAt: new Date().toISOString()
    });
    
    if (orderResult.success) {
      console.log('✅ Order confirmation sent successfully');
      console.log('   Message ID:', orderResult.messageId);
    } else {
      console.log('❌ Order confirmation failed:', orderResult.error);
    }

    // Test 4: Contact Addition
    console.log('\n4️⃣ Testing Contact Addition...');
    const contactResult = await brevoService.addContactToList(
      testEmail,
      'John',
      'Doe',
      1, // List ID
      {
        PHONE: '254700000000',
        ORGANIZATION: 'Test Company Ltd',
        SIGNUP_METHOD: 'test'
      }
    );
    
    if (contactResult.success) {
      console.log('✅ Contact added successfully');
      console.log('   Contact ID:', contactResult.contactId);
    } else {
      console.log('✅ Contact addition result:', contactResult.message || contactResult.error);
    }

    console.log('\n🎉 Email integration test completed!');
    console.log('📧 Check your email inbox for the test messages.');
    
  } catch (error) {
    console.error('❌ Email integration test failed:', error);
  }
}

testEmailIntegration();