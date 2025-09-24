import SMSService from './sms.js';
import ReceiptService from './receipt.js';
import EmailService from './email.js';

class NotificationService {
  constructor() {
    this.smsService = new SMSService();
    this.receiptService = new ReceiptService();
    this.emailService = new EmailService();
  }

  /**
   * Send complete payment confirmation (SMS + E-receipt)
   * This is the main method to call when a payment is confirmed
   */
  async sendPaymentConfirmation(orderData, paymentDetails = {}) {
    const notifications = {
      sms: { success: false, error: null },
      receipt: { success: false, error: null }
    };

    try {
      // Extract customer information
      const customerPhone = orderData.mpesa_phone || orderData.customer?.phone || orderData.phone;
      const customerEmail = orderData.user?.email || orderData.customer?.email;
      const orderNumber = orderData.orderNumber || orderData.id;

      console.log(`📱 Starting payment confirmation notifications for order ${orderNumber}`);
      console.log(`📞 Customer phone: ${customerPhone}`);
      console.log(`📧 Customer email: ${customerEmail}`);

      // Prepare payment confirmation data for SMS
      const paymentData = {
        orderNumber: orderNumber,
        amount: (orderData.total || 0) / 100, // Convert from cents
        items: this.extractItemsForSMS(orderData.items || []),
        paymentMethod: paymentDetails.paymentMethod || orderData.payment_method || 'M-Pesa',
        transactionId: paymentDetails.transactionId || paymentDetails.mpesaReceiptNumber
      };

      // Send SMS confirmation
      if (customerPhone) {
        try {
          const smsResult = await this.smsService.sendPaymentConfirmationSMS(customerPhone, paymentData);
          notifications.sms = smsResult;
          
          if (smsResult.success) {
            console.log(`✅ Payment confirmation SMS sent to ${customerPhone}`);
          } else {
            console.error(`❌ Failed to send payment confirmation SMS:`, smsResult.error);
          }
        } catch (smsError) {
          console.error('❌ SMS service error:', smsError);
          notifications.sms = { success: false, error: smsError.message };
        }
      } else {
        console.warn('⚠️ No customer phone number available for SMS');
        notifications.sms = { success: false, error: 'No phone number available' };
      }

      // Generate and send e-receipt
      if (customerEmail) {
        try {
          const receiptData = await this.receiptService.generateReceiptData(orderData, {
            transactionId: paymentDetails.transactionId || paymentDetails.mpesaReceiptNumber,
            paymentDate: paymentDetails.paymentDate || new Date().toISOString()
          });
          
          const receiptResult = await this.receiptService.sendEReceipt(receiptData);
          notifications.receipt = receiptResult;
          
          if (receiptResult.success) {
            console.log(`✅ E-receipt sent successfully for order ${orderNumber}`);
            
            // Send follow-up SMS about e-receipt
            if (customerPhone && notifications.sms.success) {
              try {
                await this.smsService.sendEReceiptSMS(customerPhone, orderNumber, true);
                console.log(`✅ E-receipt notification SMS sent`);
              } catch (followUpError) {
                console.error(`❌ Failed to send e-receipt notification SMS:`, followUpError);
              }
            }
          } else {
            console.error(`❌ Failed to send e-receipt for order ${orderNumber}:`, receiptResult.error);
            
            // Send SMS indicating e-receipt processing
            if (customerPhone && notifications.sms.success) {
              try {
                await this.smsService.sendEReceiptSMS(customerPhone, orderNumber, false);
                console.log(`✅ E-receipt processing notification SMS sent`);
              } catch (followUpError) {
                console.error(`❌ Failed to send e-receipt processing SMS:`, followUpError);
              }
            }
          }
        } catch (receiptError) {
          console.error('❌ Receipt service error:', receiptError);
          notifications.receipt = { success: false, error: receiptError.message };
        }
      } else {
        console.warn('⚠️ No customer email available for e-receipt');
        notifications.receipt = { success: false, error: 'No email address available' };
      }

      return {
        success: notifications.sms.success || notifications.receipt.success,
        notifications
      };

    } catch (error) {
      console.error('❌ Payment confirmation notification error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }

  /**
   * Send order status update notifications
   */
  async sendOrderStatusUpdate(orderData, newStatus) {
    try {
      const customerPhone = orderData.mpesa_phone || orderData.customer?.phone || orderData.phone;
      const orderNumber = orderData.orderNumber || orderData.id;

      if (!customerPhone) {
        console.warn('⚠️ No customer phone number available for status update SMS');
        return { success: false, error: 'No phone number available' };
      }

      const result = await this.smsService.sendOrderStatusSMS(customerPhone, orderNumber, newStatus);
      
      if (result.success) {
        console.log(`✅ Order status SMS sent for order ${orderNumber}: ${newStatus}`);
      } else {
        console.error(`❌ Failed to send order status SMS:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Order status notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome SMS for new wallet users
   */
  async sendWalletWelcomeSMS(phoneNumber, customerName) {
    try {
      const message = `Welcome to GetDeals Wallet, ${customerName}! 🎉 
Enjoy instant payments, 5% cashback on orders, and zero transaction fees. 
Your smart shopping journey starts now! - GetDeals Kenya`;

      const result = await this.smsService.sendWelcomeSMS(phoneNumber, message);
      
      if (result.success) {
        console.log(`✅ Wallet welcome SMS sent to ${phoneNumber}`);
      } else {
        console.error(`❌ Failed to send wallet welcome SMS:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Wallet welcome SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk promotional notifications
   */
  async sendPromotionalNotifications(recipients, message, subject = 'Special Offer from GetDeals') {
    try {
      const results = {
        sms: { sent: 0, failed: 0, errors: [] },
        email: { sent: 0, failed: 0, errors: [] }
      };

      // Send SMS to recipients with phone numbers
      const smsRecipients = recipients.filter(r => r.phone);
      if (smsRecipients.length > 0) {
        const smsResult = await this.smsService.sendBulkSMS(smsRecipients, message);
        if (smsResult.success) {
          results.sms.sent = smsRecipients.length;
        } else {
          results.sms.failed = smsRecipients.length;
          results.sms.errors.push(smsResult.error);
        }
      }

      // Send emails to recipients with email addresses
      const emailRecipients = recipients.filter(r => r.email);
      if (emailRecipients.length > 0) {
        const emailResults = await this.emailService.sendBulkEmail(emailRecipients, subject, message);
        
        emailResults.forEach(result => {
          if (result.success) {
            results.email.sent++;
          } else {
            results.email.failed++;
            results.email.errors.push(result.error);
          }
        });
      }

      console.log(`📢 Promotional notifications sent - SMS: ${results.sms.sent}, Email: ${results.email.sent}`);
      return { success: true, results };

    } catch (error) {
      console.error('❌ Promotional notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract and format items for SMS (keeping it concise)
   */
  extractItemsForSMS(items) {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => ({
      name: (item.product?.name || item.name || 'Unknown Item').substring(0, 30), // Limit length for SMS
      quantity: item.quantity || 1
    }));
  }

  /**
   * Send delivery notifications
   */
  async sendDeliveryNotification(orderData, trackingInfo = {}) {
    try {
      const customerPhone = orderData.mpesa_phone || orderData.customer?.phone || orderData.phone;
      const orderNumber = orderData.orderNumber || orderData.id;

      if (!customerPhone) {
        console.warn('⚠️ No customer phone number available for delivery notification');
        return { success: false, error: 'No phone number available' };
      }

      const { estimatedTime, driverName, driverPhone } = trackingInfo;
      
      let message = `Your GetDeals order #${orderNumber} is on the way! 🚚`;
      
      if (estimatedTime) {
        message += `\nETA: ${estimatedTime}`;
      }
      
      if (driverName && driverPhone) {
        message += `\nDriver: ${driverName} (${driverPhone})`;
      }
      
      message += '\nTrack your order in the GetDeals app. Thank you for shopping with us!';

      const result = await this.smsService.sendSMS(customerPhone, message);
      
      if (result.success) {
        console.log(`✅ Delivery notification SMS sent for order ${orderNumber}`);
      } else {
        console.error(`❌ Failed to send delivery notification SMS:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Delivery notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default NotificationService;