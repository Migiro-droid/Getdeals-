import 'dotenv/config';
import BrevoService from '../src/services/brevo-service-fetch.js';

const brevoService = new BrevoService();

async function testBrevoIntegration() {
  console.log('Testing Brevo integration with fetch API...');
  
  try {
    // Test account connection
    console.log('Testing account connection...');
    const accountResult = await brevoService.getAccount();
    console.log('Account result:', accountResult);
    
    if (accountResult.success) {
      console.log(' Brevo API connection working!');
      console.log('Account details:', {
        email: accountResult.data.email,
        plan: accountResult.data.plan?.type,
        emailCredits: accountResult.data.plan?.creditsType
      });
    } else {
      console.log(' Brevo API connection failed:', accountResult.error);
      return;
    }
    
    // Test simple email (replace with your actual email)
    console.log('\\nSending test simple email...');
    const testEmail = 'j.ericndivo@gmail.com'
    
    const simpleResult = await brevoService.sendSimpleEmail(
      testEmail,
      'Test Email from GetDeals Kenya',
      `
        <html>
          <body>
            <h1>Hello from GetDeals Kenya! 🎉</h1>
            <p>This is a test email from your Brevo integration.</p>
            <p>Your API key is working correctly!</p>
            <p>Sent at: ${new Date().toISOString()}</p>
          </body>
        </html>
      `,
      'Hello from GetDeals Kenya! This is a test email from your Brevo integration. Your API key is working correctly!'
    );
    
    console.log('Simple email result:', simpleResult);
    
    if (simpleResult.success) {
      console.log(' Test email sent successfully!');
      console.log('Message ID:', simpleResult.messageId);
    } else {
      console.log(' Email sending failed:', simpleResult.error);
    }
    
  } catch (error) {
    console.error('Brevo test failed:', error);
  }
}

testBrevoIntegration();