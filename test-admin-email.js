/**
 * Test Email Configuration
 * Run this to verify your SMTP setup works before creating admin users
 * 
 * Usage: node test-admin-email.js
 */

const nodemailer = require('nodemailer');

// Load from environment
const SMTP_HOST = 'smtp-relay.brevo.com';
const SMTP_PORT = 587;
const SMTP_USER = '96f049001@smtp-brevo.com';
const SMTP_PASS = '1pSFOdRY5VIA9H8N';
const SMTP_FROM = 'GetDeals Admin <info@getdeals.co.ke>';

console.log('🧪 Testing Email Configuration...\n');

async function testEmail() {
  try {
    // Create transporter
    console.log('📧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // Use TLS
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify connection
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Send test email
    const testEmail = 'j.ericndivo@gmail.com'; // Change to your test email
    console.log(`📨 Sending test email to ${testEmail}...`);
    
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: testEmail,
      subject: '✅ GetDeals Admin Email Test - Success!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Test</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✅ Email Test Successful!</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your GetDeals email system is working</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Congratulations! 🎉
                      </p>

                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Your SMTP configuration is working correctly. You can now:
                      </p>

                      <ul style="color: #333333; font-size: 16px; line-height: 1.8;">
                        <li>✅ Create admin users with automatic password generation</li>
                        <li>✅ Send login credentials via email</li>
                        <li>✅ Create manager and staff accounts</li>
                        <li>✅ Deliver professional welcome emails</li>
                      </ul>

                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px; font-weight: bold;">
                              📋 SMTP Configuration Verified
                            </p>
                            <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.6;">
                              <strong>Provider:</strong> Brevo (smtp-relay.brevo.com)<br>
                              <strong>Port:</strong> 587 (TLS)<br>
                              <strong>Status:</strong> ✅ Connected and Working
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        You're all set! Go ahead and create your first admin user.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        © 2025 GetDeals. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        ✅ Email Test Successful!

        Your GetDeals email system is working correctly.

        SMTP Configuration Verified:
        - Provider: Brevo (smtp-relay.brevo.com)
        - Port: 587 (TLS)
        - Status: Connected and Working

        You can now:
        ✅ Create admin users with automatic password generation
        ✅ Send login credentials via email
        ✅ Create manager and staff accounts
        ✅ Deliver professional welcome emails

        You're all set! Go ahead and create your first admin user.

        © 2025 GetDeals. All rights reserved.
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`\n✨ Check your inbox at: ${testEmail}`);
    console.log('\n🎉 Your email system is ready for admin user creation!\n');

  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify SMTP credentials are correct');
    console.error('2. Check Brevo account is active');
    console.error('3. Ensure API key has email sending permissions');
    console.error('4. Check your network allows SMTP connections\n');
    process.exit(1);
  }
}

testEmail();
