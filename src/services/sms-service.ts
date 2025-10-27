

interface SMSConfig {
  apiKey: string;
  username: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  details?: any;
}

interface SMSTemplate {
  type: 'order-confirmation' | 'payment-confirmation' | 'order-status' | 'otp' | 'delivery' | 'cancellation';
  phoneNumber: string;
  data: Record<string, any>;
}

class SMSService {
  private apiKey: string;
  private username: string;
  private apiUrl: string = 'https://api.sandbox.africastalking.com/version1/messaging';

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.username = process.env.SMS_USERNAME || '';
    
    // Use production URL if API key is set
    if (this.apiKey) {
      this.apiUrl = 'https://api.africastalking.com/version1/messaging';
    }
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.username;
  }

  /**
   * Send SMS message
   */
  async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<SMSResult> {
    if (!this.isConfigured()) {
      console.warn('⚠️ SMS service not configured. Set SMS_API_KEY and SMS_USERNAME in .env');
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    try {
      // Validate phone number format (Kenya)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!formattedPhone) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      console.log('📱 Sending SMS to:', formattedPhone);
      console.log('📝 Message:', message);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: new URLSearchParams({
          username: this.username,
          to: formattedPhone,
          message: message,
          enqueue: '1' // Queue messages if network is down
        }).toString()
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ SMS API Error:', errorData);
        return {
          success: false,
          error: `SMS API returned status ${response.status}`,
          details: errorData
        };
      }

      const data = await response.json();
      
      // Check if message was sent successfully
      if (data.SMSMessageData?.Recipients?.[0]) {
        const recipient = data.SMSMessageData.Recipients[0];
        
        if (recipient.statusCode === 101) {
          // 101 = Success
          console.log('✅ SMS sent successfully:', recipient.messageId);
          return {
            success: true,
            messageId: recipient.messageId,
            status: recipient.status
          };
        } else {
          console.error('❌ SMS failed with status code:', recipient.statusCode);
          return {
            success: false,
            error: `SMS failed with status code ${recipient.statusCode}`,
            details: recipient
          };
        }
      }

      return {
        success: false,
        error: 'Invalid API response',
        details: data
      };

    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(
    phoneNumber: string,
    orderData: {
      orderNumber: string;
      total: number;
      itemCount: number;
    }
  ): Promise<SMSResult> {
    const message = `Order Confirmed! Order #${orderData.orderNumber} for KES ${orderData.total.toLocaleString()} (${orderData.itemCount} items). Track your order at getdeals.co.ke/account`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(
    phoneNumber: string,
    paymentData: {
      amount: number;
      orderNumber: string;
      method: string;
      transactionId?: string;
    }
  ): Promise<SMSResult> {
    const message = `Payment Confirmed! KES ${paymentData.amount.toLocaleString()} received for Order #${paymentData.orderNumber} via ${paymentData.method}. ${paymentData.transactionId ? `ID: ${paymentData.transactionId}` : ''}`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send order status update SMS
   */
  async sendOrderStatusUpdate(
    phoneNumber: string,
    statusData: {
      orderNumber: string;
      status: 'processing' | 'ready' | 'delivered' | 'cancelled';
      estimatedTime?: string;
      location?: string;
    }
  ): Promise<SMSResult> {
    let statusMessage = '';
    
    switch (statusData.status) {
      case 'processing':
        statusMessage = `Order #${statusData.orderNumber} is being prepared. ${statusData.estimatedTime ? `Ready in approximately ${statusData.estimatedTime}` : ''}`;
        break;
      case 'ready':
        statusMessage = `Great news! Order #${statusData.orderNumber} is ready for pickup/delivery at ${statusData.location || 'your location'}. Visit getdeals.co.ke to track`;
        break;
      case 'delivered':
        statusMessage = `Order #${statusData.orderNumber} has been delivered. Thank you for shopping with GetDeals! Rate your experience at getdeals.co.ke`;
        break;
      case 'cancelled':
        statusMessage = `Order #${statusData.orderNumber} has been cancelled. Please contact support if you have questions. Support: support@getdeals.co.ke`;
        break;
    }

    return this.sendSMS(phoneNumber, statusMessage);
  }

  /**
   * Send OTP/2FA SMS
   */
  async sendOTP(
    phoneNumber: string,
    otpData: {
      code: string;
      purpose: 'login' | 'password-reset' | 'verification';
      expiryMinutes?: number;
    }
  ): Promise<SMSResult> {
    const expiry = otpData.expiryMinutes || 5;
    let purposeText = '';
    
    switch (otpData.purpose) {
      case 'login':
        purposeText = 'to sign in to your GetDeals account';
        break;
      case 'password-reset':
        purposeText = 'to reset your GetDeals password';
        break;
      case 'verification':
        purposeText = 'to verify your account';
        break;
    }

    const message = `Your GetDeals verification code is: ${otpData.code}. Use this ${purposeText}. Code expires in ${expiry} minutes. Do not share this code.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send delivery notification SMS
   */
  async sendDeliveryNotification(
    phoneNumber: string,
    deliveryData: {
      orderNumber: string;
      driverName: string;
      driverPhone: string;
      estimatedTime: string;
      address: string;
    }
  ): Promise<SMSResult> {
    const message = `Your order #${deliveryData.orderNumber} is on the way! Driver: ${deliveryData.driverName}. Contact: ${deliveryData.driverPhone}. ETA: ${deliveryData.estimatedTime} at ${deliveryData.address}. Track: getdeals.co.ke`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send generic SMS (for custom messages)
   */
  async sendGenericSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Format phone number to international format
   * Supports: +254, 254, 07, 01 formats
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove spaces and special characters
    let phone = phoneNumber.replace(/[\s\-()]/g, '');

    // Handle various formats
    if (phone.startsWith('+254')) {
      return phone; // Already in correct format
    } else if (phone.startsWith('254')) {
      return '+' + phone; // Add + sign
    } else if (phone.startsWith('07') || phone.startsWith('01')) {
      // Kenya local format
      return '+254' + phone.substring(1);
    } else if (phone.length === 9 && (phone.startsWith('7') || phone.startsWith('1'))) {
      // 7xxxxx format
      return '+254' + phone;
    }

    // Invalid format
    console.error('❌ Invalid phone number format:', phoneNumber);
    return null;
  }

  /**
   * Batch send SMS to multiple recipients
   */
  async sendBatch(
    recipients: { phoneNumber: string; message: string }[]
  ): Promise<SMSResult[]> {
    const results = await Promise.all(
      recipients.map(({ phoneNumber, message }) =>
        this.sendSMS(phoneNumber, message)
      )
    );
    return results;
  }
}

// Export singleton instance
export default new SMSService();
