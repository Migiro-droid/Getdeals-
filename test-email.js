// Test script for email functionality
import EmailService from './server/lib/email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmailService() {
  console.log('🧪 Testing Email Service...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER ? '***configured***' : 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
    console.log('For Gmail, you need to:');
    console.log('1. Enable 2-factor authentication');
    console.log('2. Generate an App Password');
    console.log('3. Use your Gmail address as SMTP_USER');
    console.log('4. Use the App Password as SMTP_PASS');
    return;
  }

  const emailService = new EmailService();
  
  const testAdminData = {
    name: 'Test Admin User',
    email: 'admin@getdeals.co.ke', // Using the admin email for testing
    password: 'TempPass123!@#',
    role: 'admin',
    permissions: ['all']
  };

  try {
    console.log('📧 Sending test admin credentials email...');
    const result = await emailService.sendAdminCredentials(testAdminData);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Email failed to send');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

testEmailService();