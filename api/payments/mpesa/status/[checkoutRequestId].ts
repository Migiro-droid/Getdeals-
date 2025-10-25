import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { checkoutRequestId } = req.query;

  if (!checkoutRequestId || typeof checkoutRequestId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing checkoutRequestId parameter'
    });
  }

  try {
    console.log(' Checking payment status for:', checkoutRequestId);

    
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', checkoutRequestId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { 
      console.error('Database error:', dbError);
    }

    console.log('💾 Database payment record:', payment);

    
    if (payment && payment.status === 'success') {
      return res.status(200).json({
        success: true,
        resultCode: '0',
        resultDesc: 'Payment confirmed from database',
        mpesaReceiptNumber: payment.mpesa_receipt_number,
        transactionDate: payment.transaction_date,
        amount: payment.amount / 100, 
        paymentConfirmed: true,
        source: 'database'
      });
    }

    
    const mpesaResult = await queryMpesaStatus(checkoutRequestId);
    
    if (mpesaResult.success) {
      
      const isPaymentSuccessful = mpesaResult.ResultCode === '0' || mpesaResult.resultCode === '0';
      
      if (isPaymentSuccessful && payment) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'success',
            mpesa_receipt_number: mpesaResult.mpesaReceiptNumber || mpesaResult.MpesaReceiptNumber,
            transaction_date: mpesaResult.TransactionDate,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', checkoutRequestId);

        if (updateError) {
          console.error('Error updating payment status:', updateError);
        } else {
          console.log(' Payment status updated in database');
        }
      }

      // ✅ Return paymentConfirmed based on ResultCode
      const paymentConfirmed = isPaymentSuccessful;

      console.log(`📤 Returning payment confirmed: ${paymentConfirmed}, ResultCode: ${mpesaResult.ResultCode || mpesaResult.resultCode}`);

      return res.status(200).json({
        success: true,
        paymentConfirmed: paymentConfirmed,
        resultCode: mpesaResult.ResultCode || mpesaResult.resultCode,
        resultDesc: mpesaResult.ResultDesc || mpesaResult.resultDesc,
        mpesaReceiptNumber: mpesaResult.mpesaReceiptNumber || mpesaResult.MpesaReceiptNumber,
        transactionDate: mpesaResult.TransactionDate,
        amount: payment?.amount ? payment.amount / 100 : undefined,
        source: 'mpesa-api'
      });
    } else {
      return res.status(200).json({
        success: false,
        paymentConfirmed: false,
        resultCode: '1',
        resultDesc: 'Payment status unknown - M-Pesa query failed',
        error: mpesaResult.error,
        source: 'error'
      });
    }

  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      paymentConfirmed: false
    });
  }
}

async function queryMpesaStatus(checkoutRequestId: string) {
  try {
    
    const accessToken = await getMpesaAccessToken();
    
  
    const { password, timestamp } = generateMpesaPassword();
    const shortCode = process.env.MPESA_SHORTCODE || process.env.MPESA_BUSINESS_SHORT_CODE;

    if (!shortCode) {
      throw new Error('M-Pesa shortcode not configured');
    }

    const queryData = {
      BusinessShortCode: parseInt(shortCode, 10),
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const queryUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData),
    });

    const data = await response.json();
    console.log('📱 M-Pesa query response:', data);

    if (!response.ok) {
      return {
        success: false,
        error: `M-Pesa API error: ${data.errorMessage || 'Unknown error'}`
      };
    }

    return {
      success: true,
      ...data
    };

  } catch (error) {
    console.error('M-Pesa query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'M-Pesa query failed'
    };
  }
}

async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const tokenUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  
  const response = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
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