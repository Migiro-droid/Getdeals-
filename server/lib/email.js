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
