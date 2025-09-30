import pkg from '@getbrevo/brevo';
const { TransactionalEmailsApi, ContactsApi, ApiClient } = pkg;

class BrevoService {
  constructor() {
    // Initialize Brevo API client
    this.apiKey = process.env.BREVO_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not set in environment variables');
    }

    // Set up the default client configuration
    const defaultClient = ApiClient.instance;
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = this.apiKey;

    this.transactionalEmailsApi = new TransactionalEmailsApi();
    this.contactsApi = new ContactsApi();
  }

  async sendTransactionalEmail({
    to,
    subject,
    templateId,
    templateData = {},
    sender = null
  }) {
    try {
      const sendSmtpEmail = {
        to: Array.isArray(to) ? to : [{ email: to }],
        subject,
        templateId,
        params: templateData,
        sender: sender || {
          name: process.env.BREVO_SENDER_NAME || 'GetDeals Kenya',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@getdeals.co.ke'
        }
      };

      const response = await this.transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
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
        details: error.body || error
      };
    }
  }

  async sendOrderConfirmation(customerEmail, orderData) {
    return this.sendTransactionalEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      templateId: parseInt(process.env.BREVO_ORDER_CONFIRMATION_TEMPLATE_ID),
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
  }

  async sendPaymentConfirmation(customerEmail, paymentData) {
    return this.sendTransactionalEmail({
      to: customerEmail,
      subject: `Payment Confirmed - ${paymentData.transactionId}`,
      templateId: parseInt(process.env.BREVO_PAYMENT_CONFIRMATION_TEMPLATE_ID),
      templateData: {
        customerName: paymentData.customerName,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        orderNumber: paymentData.orderNumber,
        paymentDate: paymentData.paidAt
      }
    });
  }

  async sendWelcomeEmail(customerEmail, customerData) {
    return this.sendTransactionalEmail({
      to: customerEmail,
      subject: 'Welcome to GetDeals Kenya!',
      templateId: parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID),
      templateData: {
        customerName: customerData.name,
        customerEmail: customerData.email,
        organization: customerData.organization,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    });
  }

  async sendPasswordReset(customerEmail, resetData) {
    return this.sendTransactionalEmail({
      to: customerEmail,
      subject: 'Reset Your Password - GetDeals Kenya',
      templateId: parseInt(process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID),
      templateData: {
        customerName: resetData.customerName,
        resetLink: resetData.resetLink,
        expiryTime: resetData.expiryTime
      }
    });
  }

  async addContactToList(email, firstName, lastName, listId, attributes = {}) {
    try {
      const createContact = {
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          ...attributes
        },
        listIds: [listId]
      };

      const response = await this.contactsApi.createContact(createContact);
      return {
        success: true,
        contactId: response.id,
        data: response
      };
    } catch (error) {
      // Contact might already exist
      if (error.status === 400 && error.body?.message?.includes('Contact already exist')) {
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
        details: error.body || error
      };
    }
  }

  // SMTP-based email sending (fallback or for simple emails)
  async sendSimpleEmail(to, subject, htmlContent, textContent = '') {
    try {
      const sendSmtpEmail = {
        to: Array.isArray(to) ? to : [{ email: to }],
        subject,
        htmlContent,
        textContent,
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'GetDeals Kenya',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@getdeals.co.ke'
        }
      };

      const response = await this.transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
      return {
        success: true,
        messageId: response.messageId,
        data: response
      };
    } catch (error) {
      console.error('Brevo simple email send error:', error);
      return {
        success: false,
        error: error.message,
        details: error.body || error
      };
    }
  }
}

export default BrevoService;