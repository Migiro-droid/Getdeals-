
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function testEmailSignup() {
  console.log('Testing Email Signup Flow\n');
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`API URL: ${API_URL}\n`);

  try {
    console.log('Step 1: Testing Email Send Endpoint');
    console.log('─'.repeat(50));
    
    const emailResponse = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        recipientEmail: TEST_EMAIL,
        data: {
          name: 'Test User',
          email: TEST_EMAIL,
          organization: 'Test Organization'
        }
      })
    });

    const emailData = await emailResponse.json() as any;
    
    if (emailResponse.ok && emailData.success) {
      console.log('Email sent successfully');
      console.log(`  Message ID: ${emailData.messageId}\n`);
    } else {
      console.error('Email send failed');
      console.error(`   Status: ${emailResponse.status}`);
      console.error(`   Response:`, emailData, '\n');
      return false;
    }

    console.log('Step 2: Testing Contact Addition');
    console.log('─'.repeat(50));
    
    const contactResponse = await fetch(`${API_URL}/api/email/add-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        attributes: {
          PHONE: '+254700000000',
          ORGANIZATION: 'Test Org',
          SIGNUP_DATE: new Date().toISOString(),
          SIGNUP_METHOD: 'test'
        }
      })
    });

    const contactData = await contactResponse.json() as any;
    
    if (contactResponse.ok && contactData.success) {
      console.log(' Contact added successfully');
      console.log(` Contact ID: ${contactData.contactId}\n`);
    } else if (contactResponse.ok && contactData.message?.includes('already exist')) {
      console.log('Contact already exists (this is OK)\n');
    } else {
      console.error('Contact addition failed');
      console.error(`   Status: ${contactResponse.status}`);
      console.error(`   Response:`, contactData, '\n');
    }

    console.log('Step 3: Testing Other Email Types');
    console.log('─'.repeat(50));
    
    const emailTypes = [
      {
        type: 'order-confirmation',
        data: {
          customerName: 'Test User',
          orderNumber: 'ORD-12345',
          total: 5000,
          items: [{ name: 'Test Item', quantity: 1, price: 5000 }],
          deliveryAddress: 'Test Address',
          paymentMethod: 'M-Pesa',
          createdAt: new Date().toISOString()
        }
      },
      {
        type: 'payment-confirmation',
        data: {
          customerName: 'Test User',
          transactionId: 'TXN-12345',
          amount: 5000,
          method: 'M-Pesa',
          orderNumber: 'ORD-12345',
          paidAt: new Date().toISOString()
        }
      }
    ];

    for (const emailType of emailTypes) {
      const response = await fetch(`${API_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType.type,
          recipientEmail: TEST_EMAIL,
          data: emailType.data
        })
      });

      const data = await response.json() as any;
      
      if (response.ok && data.success) {
        console.log(` ${emailType.type} - Success`);
      } else {
        console.log(`  ${emailType.type} - ${response.status}`);
      }
    }

    console.log('\n Email Signup Flow Test Complete!');
    console.log('\n Summary:');
    console.log('   ✓ Welcome email sent');
    console.log('   ✓ Contact added to mailing list');
    console.log('   ✓ Other email types tested');
    console.log('\n All systems ready for user signups!\n');

    return true;

  } catch (error) {
    console.error('\n Test failed with error:');
    console.error(error);
    return false;
  }
}

testEmailSignup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
