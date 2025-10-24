import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  orderId: string;
  description?: string;
}

interface MpesaSTKResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { phoneNumber, amount, orderId, description = 'GetDeals Payment' }: STKPushRequest = req.body;

    // Validate required fields
    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, amount, orderId'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    if (amount > 70000) {
      return res.status(400).json({
        success: false,
        error: 'Amount exceeds M-Pesa transaction limit (KES 70,000)'
      });
    }

    // Validate phone number format
    const phoneRegex = /^(?:\+?254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Format phone number (ensure 254 prefix)
    const formattedPhone = phoneNumber.replace(/^\+?/, '').replace(/^0/, '254');

    console.log(' Initiating STK Push:', {
      phoneNumber: formattedPhone,
      amount,
      orderId,
      environment: process.env.MPESA_ENVIRONMENT
    });

    // Get M-Pesa access token
    const accessToken = await getMpesaAccessToken();
    
    // Generate password and timestamp
    const { password, timestamp } = generateMpesaPassword();

    // Prepare STK Push payload
    const stkPushPayload = {
      BusinessShortCode: parseInt(process.env.MPESA_SHORTCODE!),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.round(amount),
      PartyA: parseInt(formattedPhone),
      PartyB: 5686122, // Till number
      PhoneNumber: parseInt(formattedPhone),
      CallBackURL: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://getdeals.co.ke'}/api/payments/mpesa/callback`,
      AccountReference: orderId,
      TransactionDesc: description
    };

    console.log('📡 STK Push Payload:', {
      ...stkPushPayload,
      Password: '[HIDDEN]'
    });

    const mpesaUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const mpesaResponse = await axios.post<MpesaSTKResponse>(mpesaUrl, stkPushPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(' M-Pesa STK Response:', mpesaResponse.data);

    // Check if STK push was initiated successfully
    if (mpesaResponse.data.ResponseCode === '0') {
      // Save comprehensive payment record to Supabase
      const paymentData = {
        order_id: orderId, // This will be the order reference string
        amount: Math.round(amount * 100), // Store in cents
        method: 'mpesa',
        status: 'pending',
        phone_number: formattedPhone,
        reference: orderId,
        transaction_id: mpesaResponse.data.CheckoutRequestID,
        merchant_request_id: mpesaResponse.data.MerchantRequestID,
        mpesa_receipt_number: null, // Will be filled by callback
        transaction_date: null, // Will be filled by callback
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);

      if (paymentError) {
        console.error('❌ Error saving payment record:', paymentError);
        // Continue anyway - the transaction was initiated
      } else {
        console.log('✅ Payment record saved successfully');
      }

      // Note: Transaction log will be created by the callback handler

      return res.status(200).json({
        success: true,
        CheckoutRequestID: mpesaResponse.data.CheckoutRequestID,
        MerchantRequestID: mpesaResponse.data.MerchantRequestID,
        ResponseCode: mpesaResponse.data.ResponseCode,
        ResponseDescription: mpesaResponse.data.ResponseDescription,
        CustomerMessage: mpesaResponse.data.CustomerMessage
      });

    } else {
      console.error(' STK Push failed:', mpesaResponse.data);
      return res.status(400).json({
        success: false,
        error: mpesaResponse.data.ResponseDescription || 'STK Push initiation failed'
      });
    }

  } catch (error: any) {
    console.error(' STK Push Error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during payment initiation'
    });
  }
}

async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa Consumer Key and Secret are required');
  }
  
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const tokenUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  console.log('Getting M-Pesa access token from:', tokenUrl);

  try {
    const response = await axios.get(tokenUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.access_token) {
      throw new Error('No access token received from M-Pesa API');
    }

    console.log('M-Pesa access token obtained successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
}

function generateMpesaPassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const shortcode = process.env.MPESA_SHORTCODE || process.env.MPESA_BUSINESS_SHORT_CODE;
  const passkey = process.env.MPESA_PASSKEY;
  
  if (!shortcode || !passkey) {
    throw new Error('M-Pesa shortcode and passkey are required');
  }
  
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  
  return { password, timestamp };
}