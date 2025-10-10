import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

/**
 * API Endpoint: Send Admin Credentials Email
 * POST /api/admin/send-credentials
 * 
 * Sends login credentials to newly created admin users via email
 * 
 * Required: SMTP credentials in environment variables
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, password, and role are required'
      });
    }

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'GetDeals Admin <noreply@getdeals.co.ke>';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP not configured. Missing environment variables:', {
        hasHost: !!smtpHost,
        hasUser: !!smtpUser,
        hasPass: !!smtpPass
      });

      // Return success but log warning - in development mode
      return res.status(200).json({
        success: true,
        warning: 'Email not sent: SMTP not configured',
        credentials: {
          email,
          password,
          message: 'Please provide these credentials to the user manually'
        }
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: false, // Use STARTTLS for port 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: true // Verify SSL certificates
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error',
        details: verifyError.message
      });
    }

    // Generate HTML email
    const htmlEmail = generateCredentialsEmail(name, email, password, role);

    // Send email
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'Your GetDeals Admin Account - Login Credentials',
      html: htmlEmail,
      text: generatePlainTextEmail(name, email, password, role)
    });

    console.log('✅ Email sent:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Credentials email sent successfully',
      messageId: info.messageId
    });

  } catch (error: any) {
    console.error('Error sending credentials email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
      credentials: {
        email: req.body.email,
        password: req.body.password,
        message: 'Please provide these credentials to the user manually'
      }
    });
  }
}

/**
 * Generate HTML email template
 */
function generateCredentialsEmail(name: string, email: string, password: string, role: string): string {
  const loginUrl = 'https://getdeals.co.ke/login';
  const supportEmail = 'support@getdeals.co.ke';
  
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your GetDeals Admin Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to GetDeals Admin</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your admin account has been created</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Your GetDeals admin account has been created with the role of <strong>${roleDisplay}</strong>. 
                Below are your login credentials:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #f8f9fa; border-radius: 8px; border: 2px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 500;">${email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 15px; border-top: 1px solid #dee2e6;">
                          <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</p>
                          <p style="margin: 0; color: #333333; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">${password}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 15px; border-top: 1px solid #dee2e6;">
                          <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Role</p>
                          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: 500;">${roleDisplay}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Login Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Login to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: bold;">
                      🔒 Important Security Information
                    </p>
                    <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; line-height: 1.6;">
                      • Please change your password immediately after your first login
                    </p>
                    <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; line-height: 1.6;">
                      • Do not share your credentials with anyone
                    </p>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                      • Keep this email secure or delete it after changing your password
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please contact our support team at 
                <a href="mailto:${supportEmail}" style="color: #667eea; text-decoration: none;">${supportEmail}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                This email contains sensitive information. Please keep it secure.
              </p>
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
  `.trim();
}

/**
 * Generate plain text email (fallback)
 */
function generatePlainTextEmail(name: string, email: string, password: string, role: string): string {
  const loginUrl = 'https://getdeals.co.ke/login';
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  return `
Welcome to GetDeals Admin

Hi ${name},

Your GetDeals admin account has been created with the role of ${roleDisplay}.

LOGIN CREDENTIALS:
==================
Email: ${email}
Temporary Password: ${password}
Role: ${roleDisplay}

Login URL: ${loginUrl}

IMPORTANT SECURITY INFORMATION:
================================
• Please change your password immediately after your first login
• Do not share your credentials with anyone
• Keep this email secure or delete it after changing your password

If you have any questions, please contact our support team.

© 2025 GetDeals. All rights reserved.
  `.trim();
}
