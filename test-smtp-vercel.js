/**
 * Test SMTP Configuration
 * This script tests the SMTP credentials before deployment
 * 
 * Usage:
 * 1. Create a .env file with your SMTP credentials
 * 2. Run: node test-smtp-vercel.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('\n📧 Testing SMTP Configuration...\n');

  // Check environment variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'GetDeals Admin <noreply@getdeals.co.ke>';

  console.log('📋 Configuration Check:');
  console.log(`   SMTP_HOST: ${smtpHost ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SMTP_PORT: ${smtpPort}`);
  console.log(`   SMTP_USER: ${smtpUser ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SMTP_PASS: ${smtpPass ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`   SMTP_FROM: ${smtpFrom}\n`);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ Error: Missing required SMTP environment variables');
    console.log('\n💡 Create a .env file with:');
    console.log('SMTP_HOST=smtp-relay.brevo.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@example.com');
    console.log('SMTP_PASS=your-smtp-key');
    console.log('SMTP_FROM=GetDeals Admin <noreply@getdeals.co.ke>');
    process.exit(1);
  }

  try {
    // Create transporter
    console.log('🔌 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Ask for test email
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('📮 Send test email? Enter recipient email (or press Enter to skip): ', async (testEmail) => {
      readline.close();

      if (testEmail && testEmail.includes('@')) {
        console.log(`\n📤 Sending test email to ${testEmail}...`);
        
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: testEmail,
          subject: 'GetDeals SMTP Test - Configuration Successful',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                .check-icon { font-size: 48px; color: #28a745; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 SMTP Configuration Test</h1>
                  <p>GetDeals Email System</p>
                </div>
                <div class="content">
                  <div class="success">
                    <div class="check-icon">✅</div>
                    <h2>Success!</h2>
                    <p>Your SMTP configuration is working correctly.</p>
                  </div>
                  
                  <h3>📋 Configuration Details</h3>
                  <ul>
                    <li><strong>SMTP Host:</strong> ${smtpHost}</li>
                    <li><strong>Port:</strong> ${smtpPort}</li>
                    <li><strong>Sender:</strong> ${smtpFrom}</li>
                    <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                  </ul>

                  <h3>✅ Next Steps</h3>
                  <ol>
                    <li>Add these SMTP credentials to Vercel environment variables</li>
                    <li>Redeploy your application</li>
                    <li>Test admin user creation at: https://getdeals.co.ke/admin/users</li>
                    <li>New admin users will receive their credentials via email</li>
                  </ol>

                  <div class="footer">
                    <p>This is an automated test email from GetDeals SMTP configuration test.</p>
                    <p>© ${new Date().getFullYear()} GetDeals. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
SMTP Configuration Test - Success!

Your SMTP configuration is working correctly.

Configuration Details:
- SMTP Host: ${smtpHost}
- Port: ${smtpPort}
- Sender: ${smtpFrom}
- Test Time: ${new Date().toLocaleString()}

Next Steps:
1. Add these SMTP credentials to Vercel environment variables
2. Redeploy your application
3. Test admin user creation at: https://getdeals.co.ke/admin/users
4. New admin users will receive their credentials via email

© ${new Date().getFullYear()} GetDeals. All rights reserved.
          `
        });

        console.log('✅ Test email sent successfully!');
        console.log(`📬 Message ID: ${info.messageId}`);
        console.log(`\n💡 Check your inbox at: ${testEmail}`);
        console.log('   (Also check spam/junk folder)\n');
      } else {
        console.log('\n✅ SMTP verification complete (no test email sent)');
      }

      console.log('\n🚀 Your SMTP configuration is ready!');
      console.log('\n📝 Next steps:');
      console.log('1. Add these credentials to Vercel:');
      console.log('   - Go to: https://vercel.com/dashboard');
      console.log('   - Select project → Settings → Environment Variables');
      console.log('   - Add: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
      console.log('2. Redeploy your application');
      console.log('3. Test at: https://getdeals.co.ke/admin/users\n');
    });

  } catch (error) {
    console.error('\n❌ SMTP Test Failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    
    if (error.message.includes('authentication') || error.message.includes('Invalid login')) {
      console.log('   Issue: Authentication failed');
      console.log('   Solutions:');
      console.log('   1. For Gmail: Use App Password (not regular password)');
      console.log('   2. For Brevo: Generate new SMTP key');
      console.log('   3. Check SMTP_USER matches your account email');
      console.log('   4. Verify no extra spaces in credentials');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('   Issue: Cannot connect to SMTP server');
      console.log('   Solutions:');
      console.log('   1. Check SMTP_HOST is correct');
      console.log('   2. Verify internet connection');
      console.log('   3. Check if port is blocked by firewall');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('   Issue: Connection timeout');
      console.log('   Solutions:');
      console.log('   1. Check SMTP_PORT (should be 587 or 465)');
      console.log('   2. Verify firewall allows SMTP traffic');
      console.log('   3. Try different network/VPN');
    } else {
      console.log('   Check error message above for details');
      console.log('   Verify all SMTP credentials are correct');
    }
    
    console.log('\n💡 Need help? Check SMTP_SETUP_GUIDE.md\n');
    process.exit(1);
  }
}

// Run the test
testSMTP();
