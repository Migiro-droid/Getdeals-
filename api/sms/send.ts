// SMS Send API Endpoint through Africas Talking

import { VercelRequest, VercelResponse } from '@vercel/node';
import SMSService from '../../src/services/sms-service';

interface SMSRequestBody {
  type: 'order-confirmation' | 'payment-confirmation' | 'order-status' | 'otp' | 'delivery' | 'generic';
  phoneNumber: string;
  data: Record<string, any>;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { type, phoneNumber, data }: SMSRequestBody = req.body;

    if (!type || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, phoneNumber'
      });
    }

    if (!SMSService.isConfigured()) {
      console.warn(' SMS service not configured');
      return res.status(503).json({
        success: false,
        error: 'SMS service is not configured. Set SMS_API_KEY and SMS_USERNAME in environment variables.'
      });
    }

    let result;

    switch (type) {
      case 'order-confirmation':
        if (!data.orderNumber || !data.total || data.itemCount === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Missing data for order confirmation: orderNumber, total, itemCount'
          });
        }
        result = await SMSService.sendOrderConfirmation(phoneNumber, {
          orderNumber: data.orderNumber,
          total: data.total,
          itemCount: data.itemCount
        });
        break;

      case 'payment-confirmation':
        if (!data.amount || !data.orderNumber || !data.method) {
          return res.status(400).json({
            success: false,
            error: 'Missing data for payment confirmation: amount, orderNumber, method'
          });
        }
        result = await SMSService.sendPaymentConfirmation(phoneNumber, {
          amount: data.amount,
          orderNumber: data.orderNumber,
          method: data.method,
          transactionId: data.transactionId
        });
        break;

      case 'order-status':
        if (!data.orderNumber || !data.status) {
          return res.status(400).json({
            success: false,
            error: 'Missing data for order status: orderNumber, status'
          });
        }
        result = await SMSService.sendOrderStatusUpdate(phoneNumber, {
          orderNumber: data.orderNumber,
          status: data.status,
          estimatedTime: data.estimatedTime,
          location: data.location
        });
        break;

      case 'otp':
        if (!data.code || !data.purpose) {
          return res.status(400).json({
            success: false,
            error: 'Missing data for OTP: code, purpose (login|password-reset|verification)'
          });
        }
        result = await SMSService.sendOTP(phoneNumber, {
          code: data.code,
          purpose: data.purpose,
          expiryMinutes: data.expiryMinutes || 5
        });
        break;

      case 'delivery':
        if (!data.orderNumber || !data.driverName || !data.driverPhone || !data.estimatedTime || !data.address) {
          return res.status(400).json({
            success: false,
            error: 'Missing data for delivery notification: orderNumber, driverName, driverPhone, estimatedTime, address'
          });
        }
        result = await SMSService.sendDeliveryNotification(phoneNumber, {
          orderNumber: data.orderNumber,
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          estimatedTime: data.estimatedTime,
          address: data.address
        });
        break;

      case 'generic':
        if (!data.message) {
          return res.status(400).json({
            success: false,
            error: 'Missing data for generic SMS: message'
          });
        }
        result = await SMSService.sendGenericSMS(phoneNumber, data.message);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown SMS type: ${type}. Valid types: order-confirmation, payment-confirmation, order-status, otp, delivery, generic`
        });
    }

    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      message: result.success ? 'SMS sent successfully' : 'Failed to send SMS'
    });

  } catch (error) {
    console.error(' SMS API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: 'Failed to send SMS'
    });
  }
}
