class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseUrl = 'https://api.brevo.com/v3';
    
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not set in environment variables');
    }
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data;
  }

  async sendTransactionalEmail({
    to,
    subject,
    templateId,
    templateData = {},
    sender = null,
    htmlContent = null,
    textContent = null
  }) {
    try {
      const emailData = {
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        sender: sender || {
          name: process.env.BREVO_SENDER_NAME || 'GetDeals Kenya',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@getdeals.co.ke'
        }
      };

      if (templateId) {
        emailData.templateId = parseInt(templateId);
        emailData.params = templateData;
      } else {
        emailData.subject = subject;
        if (htmlContent) emailData.htmlContent = htmlContent;
        if (textContent) emailData.textContent = textContent;
      }

      const response = await this.makeRequest('/smtp/email', 'POST', emailData);
      
      return {
        success: true,
        messageId: response.messageId,
        data: response
      };
    } catch (error) {
      console.error('Brevo email send error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  async sendSimpleEmail(to, subject, htmlContent, textContent = '') {
    return this.sendTransactionalEmail({
      to,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendOrderConfirmation(customerEmail, orderData) {
    const templateId = process.env.BREVO_ORDER_CONFIRMATION_TEMPLATE_ID;
    
    if (templateId && templateId !== '1') {
      // Use Brevo template if configured
      return this.sendTransactionalEmail({
        to: customerEmail,
        templateId,
        templateData: {
          customerName: orderData.customerName,
          orderNumber: orderData.orderNumber,
          orderTotal: orderData.total,
          orderItems: orderData.items,
          deliveryAddress: orderData.deliveryAddress,
          paymentMethod: orderData.paymentMethod,
          orderDate: orderData.createdAt
        }
      });
    } else {
      // Use fallback HTML template
      const { EmailTemplates } = await import('./email-templates.js');
      const { subject, htmlContent } = EmailTemplates.getOrderConfirmationEmail(orderData);
      
      return this.sendSimpleEmail(customerEmail, subject, htmlContent);
    }
  }

  async sendPaymentConfirmation(customerEmail, paymentData) {
    const templateId = process.env.BREVO_PAYMENT_CONFIRMATION_TEMPLATE_ID;
    
    if (templateId && templateId !== '2') {
      // Use Brevo template if configured
      return this.sendTransactionalEmail({
        to: customerEmail,
        templateId,
        templateData: {
          customerName: paymentData.customerName,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount,
          paymentMethod: paymentData.method,
          orderNumber: paymentData.orderNumber,
          paymentDate: paymentData.paidAt
        }
      });
    } else {
      // Use fallback HTML template
      const { EmailTemplates } = await import('./email-templates.js');
      const { subject, htmlContent } = EmailTemplates.getPaymentConfirmationEmail(paymentData);
      
      return this.sendSimpleEmail(customerEmail, subject, htmlContent);
    }
  }

  async sendWelcomeEmail(customerEmail, customerData) {
    const templateId = process.env.BREVO_WELCOME_TEMPLATE_ID;
    
    if (templateId && templateId !== '1') {
      // Use Brevo template if configured
      return this.sendTransactionalEmail({
        to: customerEmail,
        templateId,
        templateData: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          organization: customerData.organization,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        }
      });
    } else {
      // Use fallback HTML template
      const { EmailTemplates } = await import('./email-templates.js');
      const { subject, htmlContent, textContent } = EmailTemplates.getWelcomeEmail(
        customerData.name,
        customerData.organization || 'Not specified'
      );
      
      return this.sendSimpleEmail(customerEmail, subject, htmlContent, textContent);
    }
  }

  async sendPasswordReset(customerEmail, resetData) {
    return this.sendTransactionalEmail({
      to: customerEmail,
      subject: 'Reset Your Password - GetDeals Kenya',
      templateId: process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID,
      templateData: {
        customerName: resetData.customerName,
        resetLink: resetData.resetLink,
        expiryTime: resetData.expiryTime
      }
    });
  }

  async addContactToList(email, firstName, lastName, listId, attributes = {}) {
    try {
      const contactData = {
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          ...attributes
        },
        listIds: [listId]
      };

      const response = await this.makeRequest('/contacts', 'POST', contactData);
      
      return {
        success: true,
        contactId: response.id,
        data: response
      };
    } catch (error) {
      // Contact might already exist
      if (error.message.includes('400') && error.message.includes('Contact already exist')) {
        return {
          success: true,
          message: 'Contact already exists',
          contactId: null
        };
      }

      console.error('Brevo add contact error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  async getAccount() {
    try {
      const response = await this.makeRequest('/account');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default BrevoService;