import AfricasTalking from 'africastalking';

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'africastalking';
    
    if (this.provider === 'africastalking') {
      this.client = AfricasTalking({
        apiKey: process.env.AFRICASTALKING_API_KEY,
        username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
      });
      this.sms = this.client.SMS;
    }
  }

  async sendOrderConfirmationSMS(phoneNumber, order) {
    const message = `Your order #${order.orderNumber} for KES ${(order.total / 100).toLocaleString()} has been placed. Thank you for shopping with GetDeals!`;
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendOrderStatusSMS(phoneNumber, orderNumber, status) {
    let message;
    
    switch (status) {
      case 'CONFIRMED':
        message = `Your order #${orderNumber} has been confirmed and is being prepared.`;
        break;
      case 'PREPARING':
        message = `Your order #${orderNumber} is being prepared for delivery/pickup.`;
        break;
      case 'OUT_FOR_DELIVERY':
        message = `Your order #${orderNumber} is out for delivery!`;
        break;
      case 'DELIVERED':
        message = `Your order #${orderNumber} has been delivered. Thank you for shopping with GetDeals!`;
        break;
      default:
        message = `Your order #${orderNumber} status has been updated.`;
    }
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendBulkSMS(recipients, message) {
    const phoneNumbers = recipients.map(r => r.phone).filter(Boolean);
    
    if (phoneNumbers.length === 0) {
      return { success: false, error: 'No valid phone numbers provided' };
    }

    return this.sendSMS(phoneNumbers, message);
  }

  async sendWelcomeSMS(phoneNumber, message) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    return this.sendSMS(formattedPhone, message);
  }

  async sendSMS(to, message) {
    if (this.provider === 'africastalking') {
      return this.sendAfricasTalkingSMS(to, message);
    }
    
    return { success: false, error: 'SMS provider not configured' };
  }

  async sendAfricasTalkingSMS(to, message) {
    try {
      const options = {
        to: Array.isArray(to) ? to : [to],
        message: message,
        from: 'GetDeals', // Your sender ID
      };

      const result = await this.sms.send(options);
      
      return {
        success: true,
        data: result,
        recipients: result.SMSMessageData?.Recipients || [],
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  formatPhoneNumber(phone) {
    // Format phone number for Kenya (254)
    if (!phone) return null;
    
    let formatted = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.slice(1);
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
      formatted = '254' + formatted;
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.slice(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }
    
    return '+' + formatted;
  }
}

export default SMSService;
