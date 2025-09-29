import axios from 'axios';

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;

    this.baseUrl = this.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  async getAccessToken() {
    const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  generatePassword() {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  async initiateSTKPush(phoneNumber, amount, orderId, description = 'GetDeals Payment') {
    try {
      console.log('🔄 Initiating STK Push...');
      console.log('📱 Phone:', phoneNumber);
      console.log('💰 Amount:', amount);
      console.log('🆔 Order ID:', orderId);
      console.log('🌍 Environment:', this.environment);
      console.log('🏢 Shortcode:', this.shortcode);
      console.log('🔗 Callback URL:', this.callbackUrl);

      const accessToken = await this.getAccessToken();
      console.log('✅ Access token obtained');

      const { password, timestamp } = this.generatePassword();

      // Format phone number (remove + and ensure it starts with 254)
      const formattedPhone = phoneNumber.replace(/^\+?/, '').replace(/^0/, '254');
      console.log('📞 Formatted phone:', formattedPhone);
      
      // Validate phone number format
      if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
        console.error('❌ Invalid phone number format:', formattedPhone);
        console.error('Expected format: 254XXXXXXXXX (12 digits)');
        throw new Error(`Invalid phone number format: ${formattedPhone}. Expected format: 254XXXXXXXXX`);
      }

      const stkPushData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), 
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: orderId,
        TransactionDesc: description,
      };

      console.log('📤 STK Push payload:', JSON.stringify(stkPushData, null, 2));
      console.log('🔔 STK Push should appear on phone:', formattedPhone);
      console.log('💰 Amount:', amount, 'KES');
      console.log('📱 If STK push doesn\'t appear, check:');
      console.log('   - Phone has 3G/4G network');
      console.log('   - M-Pesa account is active');
      console.log('   - Phone number is correct');
      console.log('   - No ongoing USSD session');

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        stkPushData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage,
      };
    } catch (error) {
      console.error('🚨 STK Push error:', error.response?.data || error.message);
      
      const errorData = error.response?.data;
      let errorMessage = 'Failed to initiate payment';
      
      if (errorData) {
        console.error('📋 Full error response:', JSON.stringify(errorData, null, 2));
        
        // Handle specific error codes
        if (errorData.errorCode === '500.001.1001') {
          errorMessage = 'Invalid credentials. Please check your Consumer Key, Consumer Secret, and ensure they match your shortcode.';
        } else if (errorData.errorCode === '400.002.02') {
          errorMessage = 'Invalid callback URL. Must be HTTPS and publicly accessible.';
        } else if (errorData.errorMessage) {
          errorMessage = errorData.errorMessage;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: errorData?.errorCode,
        responseCode: errorData?.ResponseCode,
        fullError: errorData // Include full error for debugging
      };
    }
  }

  async querySTKPushStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const queryData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        queryData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc,
        ...response.data,
      };
    } catch (error) {
      console.error('STK Push query error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errorMessage || 'Failed to query payment status',
      };
    }
  }

  processCallback(callbackData) {
    try {
      const { Body } = callbackData;
      const { stkCallback } = Body;

      const result = {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
      };

      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];

        result.success = true;
        result.amount = this.getCallbackValue(callbackMetadata, 'Amount');
        result.mpesaReceiptNumber = this.getCallbackValue(callbackMetadata, 'MpesaReceiptNumber');
        result.transactionDate = this.getCallbackValue(callbackMetadata, 'TransactionDate');
        result.phoneNumber = this.getCallbackValue(callbackMetadata, 'PhoneNumber');
      } else {
        // Payment failed
        result.success = false;
        result.error = stkCallback.ResultDesc;
      }

      return result;
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      return {
        success: false,
        error: 'Failed to process callback',
      };
    }
  }

  getCallbackValue(metadata, name) {
    const item = metadata.find(item => item.Name === name);
    return item ? item.Value : null;
  }
}

export default MpesaService;
