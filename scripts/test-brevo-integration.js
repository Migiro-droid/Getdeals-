import 'dotenv/config';
import BrevoService from '../src/services/brevo-service.js';

const brevoService = new BrevoService();

async function testBrevoIntegration() {
  console.log('Testing Brevo integration...');
  
  try {
    // Test simple email first (doesn't require templates)
    console.log('Sending test simple email...');
    const simpleResult = await brevoService.sendSimpleEmail(
      'test@example.com',
      'Test Email from GetDeals Kenya',
      '<h1>Hello from GetDeals!</h1><p>This is a test email from your Brevo integration.</p>',
      'Hello from GetDeals! This is a test email from your Brevo integration.'
    );
    
    console.log('Simple email result:', simpleResult);
    
    if (simpleResult.success) {
      console.log('✅ Brevo SMTP integration working!');
    } else {
      console.log('❌ Brevo SMTP integration failed:', simpleResult.error);
    }
    
    // Test contact addition
    console.log('\\nTesting contact addition...');
    const contactResult = await brevoService.addContactToList(
      'test@example.com',
      'Test',
      'User',
      1,
      {
        PHONE: '254700000000',
        ORGANIZATION: 'Test Organization',
        SIGNUP_DATE: new Date().toISOString()
      }
    );
    
    console.log('Contact addition result:', contactResult);
    
  } catch (error) {
    console.error('Brevo test failed:', error);
  }
}

testBrevoIntegration();