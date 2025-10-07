import type { VercelRequest, VercelResponse } from '@vercel/node';

interface MpesaQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode?: string;
  ResultDesc?: string;
}


let accessTokenCache: { token: string; expires: number } | null = null;

async function getMpesaAccessToken(): Promise<string> {
 
  if (accessTokenCache && Date.now() < accessTokenCache.expires) {
    return accessTokenCache.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const tokenUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  
  try {
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
    
    
    accessTokenCache = {
      token: data.access_token,
      expires: Date.now() + (3500 * 1000) 
    };

    return data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

 
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
   
    const { checkoutRequestId } = req.query;

    
    if (!checkoutRequestId || typeof checkoutRequestId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: checkoutRequestId'
      });
    }

    
    const accessToken = await getMpesaAccessToken();

    
    const shortCode = process.env.MPESA_SHORTCODE || process.env.MPESA_BUSINESS_SHORT_CODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;

    if (!passkey) {
      return res.status(500).json({
        success: false,
        error: 'M-Pesa passkey not configured'
      });
    }

    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const queryData = {
      BusinessShortCode: parseInt(shortCode, 10),
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    console.log('Querying M-Pesa transaction status:', {
      checkoutRequestId,
      shortCode,
      timestamp
    });

    
    const queryUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    const mpesaResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData),
    });

    const mpesaData = await mpesaResponse.json();
    console.log('M-Pesa query response:', mpesaData);

    if (!mpesaResponse.ok) {
      return res.status(mpesaResponse.status).json({
        success: false,
        error: `M-Pesa API error: ${mpesaData.errorMessage || 'Unknown error'}`,
        details: mpesaData
      });
    }

    
    return res.status(200).json({
      success: true,
      ...mpesaData
    });

  } catch (error) {
    console.error('Error querying M-Pesa transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}