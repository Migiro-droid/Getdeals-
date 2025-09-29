import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    const port = parseInt(process.env.SMTP_PORT) || 587;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendContactFormEmail(formData) {
    const { name, email, phone, subject, message } = formData;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || 'admin@getdeals.co.ke',
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from GetDeals Contact Form</em></p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending contact email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendOrderConfirmation(order, userEmail) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Dear ${order.user?.name || 'Customer'},</p>
        <p>Thank you for your order! Your order has been confirmed.</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Total:</strong> KES ${(order.total / 100).toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        
        <h3>Items</h3>
        <ul>
          ${order.items.map(item => `
            <li>${item.name} x ${item.quantity} - KES ${(item.price / 100).toLocaleString()}</li>
          `).join('')}
        </ul>
        
        <p>We'll notify you when your order is ready for pickup or delivery.</p>
        <p>Thank you for shopping with GetDeals!</p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAdminCredentials(adminData) {
    const { name, email, password, role, permissions } = adminData;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to GetDeals Admin Panel - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to GetDeals Admin Panel</h1>
            <hr style="border: none; height: 3px; background: linear-gradient(90deg, #3498db, #2ecc71); margin: 20px 0;">
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #34495e; margin-bottom: 20px;">Dear ${name},</p>
            
            <p style="font-size: 16px; color: #34495e; line-height: 1.6; margin-bottom: 25px;">
              You have been granted access to the GetDeals Admin Panel. Below are your login credentials and account details:
            </p>
            
            <div style="background: #ecf0f1; padding: 20px; border-radius: 6px; margin: 25px 0;">
              <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px;">🔐 Login Credentials</h3>
              <p style="margin: 8px 0; color: #34495e;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0; color: #34495e;"><strong>Temporary Password:</strong> <code style="background: #34495e; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
              <p style="margin: 8px 0; color: #34495e;"><strong>Role:</strong> ${role}</p>
            </div>
            
            <div style="background: #e8f5e8; border-left: 4px solid #2ecc71; padding: 15px; margin: 20px 0;">
              <h4 style="color: #27ae60; margin-top: 0; margin-bottom: 10px;">📋 Your Permissions</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${permissions.map(permission => `
                  <span style="background: #2ecc71; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; display: inline-block;">${permission}</span>
                `).join('')}
              </div>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">⚠️ Important Security Notice</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Please change your password immediately after logging in</li>
                <li>Never share your login credentials with anyone</li>
                <li>Log out when you're done using the admin panel</li>
                <li>Contact the main administrator if you notice any suspicious activity</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://getdeals.co.ke'}/admin/login" 
                 style="background: linear-gradient(135deg, #3498db, #2ecc71); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);">
                🚀 Access Admin Panel
              </a>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d; line-height: 1.6; margin-top: 25px;">
              If you have any questions or need assistance, please contact our support team or the main administrator.
            </p>
            
            <p style="font-size: 16px; color: #34495e; margin-top: 20px;">
              Welcome to the team!<br>
              <strong>The GetDeals Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px;">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} GetDeals Kenya. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending admin credentials email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkEmail(recipients, subject, message) {
    const promises = recipients.map(async (recipient) => {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipient.email,
        subject: subject,
        html: `
          <h2>${subject}</h2>
          <p>Dear ${recipient.name || 'Customer'},</p>
          <div>${message.replace(/\n/g, '<br>')}</div>
          <hr>
          <p><em>From the GetDeals Team</em></p>
        `,
      };

      try {
        const info = await this.transporter.sendMail(mailOptions);
        return { email: recipient.email, success: true, messageId: info.messageId };
      } catch (error) {
        return { email: recipient.email, success: false, error: error.message };
      }
    });

    return Promise.all(promises);
  }
}

export default EmailService;
