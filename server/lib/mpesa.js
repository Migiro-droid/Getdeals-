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

  validateCredentials() {
    const missing = [];
    if (!this.consumerKey) missing.push('MPESA_CONSUMER_KEY');
    if (!this.consumerSecret) missing.push('MPESA_CONSUMER_SECRET');
    if (!this.passkey) missing.push('MPESA_PASSKEY');
    if (!this.callbackUrl) missing.push('MPESA_CALLBACK_URL');
    
    if (missing.length > 0) {
      throw new Error(`Missing M-Pesa credentials: ${missing.join(', ')}. Please add them to your .env file.`);
    }
  }

  async getAccessToken() {
    const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('M-Pesa Access Token Response:', response.data);
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
      // Validate credentials first
      this.validateCredentials();
      
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      
      const formattedPhone = phoneNumber.replace(/^\+?/, '').replace(/^0/, '254');
      
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

      console.log('STK Push Request Data:', stkPushData);
      console.log('Access Token:', accessToken ? 'Present' : 'Missing');

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

      console.log('STK Push Response:', response.data);

      return {
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage,
      };
    } catch (error) {
      console.error('STK Push error details:', error.response?.data || error.message);
      console.error('STK Push error status:', error.response?.status);
      console.error('STK Push error headers:', error.response?.headers);
      return {
        success: false,
        error: error.response?.data?.errorMessage || 'Failed to initiate payment',
        responseCode: error.response?.data?.ResponseCode,
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
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
        
        result.success = true;
        result.amount = this.getCallbackValue(callbackMetadata, 'Amount');
        result.mpesaReceiptNumber = this.getCallbackValue(callbackMetadata, 'MpesaReceiptNumber');
        result.transactionDate = this.getCallbackValue(callbackMetadata, 'TransactionDate');
        result.phoneNumber = this.getCallbackValue(callbackMetadata, 'PhoneNumber');
      } else {
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
