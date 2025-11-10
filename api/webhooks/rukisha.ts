import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RukishaCallback {
  TransactionID: string;
  TransactionType: string;
  Amount: number;
  Phone: string;
  ConfirmationCode: string;
  Timestamp: string;
  Status: 'completed' | 'failed' | 'pending';
  Reference?: string;
  Description?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ 
      success: true,
      message: 'CORS preflight successful'
    });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true,
      message: 'Rukisha webhook endpoint is active',
      endpoint: '/api/webhooks/rukisha',
      accepts: 'POST requests with callback data'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST for callbacks.' 
    });
  }

  try {
    console.log(' Rukisha webhook received');
    console.log(' Request headers:', JSON.stringify(req.headers));
    console.log(' Request body:', JSON.stringify(req.body));
    
    const rawData = req.body;
    
    if (!rawData || typeof rawData !== 'object') {
      console.error(' Invalid request body - not an object');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body. Expected JSON object.' 
      });
    }

    let callbackData: any;
    let reference: string;
    let status: string;
    let mpesaCode: string;
    let phone: string;
    let amount: number;

    if (rawData.data && rawData.reference) {
      console.log(' Detected new Rukisha format');
      callbackData = rawData.data;
      reference = rawData.reference;
      status = rawData.status;
      mpesaCode = rawData.mpesa_code || callbackData.MpesaReceiptNumber;
      phone = callbackData.phone;
      amount = callbackData.amount;
    } else if (rawData.TransactionID) {
      console.log(' Detected old format');
      callbackData = rawData;
      reference = callbackData.Reference;
      status = callbackData.Status;
      mpesaCode = callbackData.ConfirmationCode;
      phone = callbackData.Phone;
      amount = callbackData.Amount;
    } else {
      console.error('Invalid callback data - unknown format');
      console.error('Received fields:', Object.keys(rawData));
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid callback data format.',
        received_fields: Object.keys(rawData)
      });
    }

    console.log('📋 Parsed data:', { reference, status, mpesaCode, phone, amount });

    let transaction;
    
    if (reference) {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('reference', reference)
        .single();
      
      if (error) {
        console.error('Transaction not found by reference:', reference);
        return res.status(404).json({ 
          success: false, 
          error: 'Transaction not found',
          reference
        });
      }
      
      transaction = data;
    } else {
      console.error(' No reference provided');
      return res.status(400).json({ 
        success: false, 
        error: 'No transaction reference provided' 
      });
    }

    console.log(' Found transaction:', transaction.id);

    let transactionStatus: string;
    if (status === 'COMPLETE' || status === 'completed') {
      transactionStatus = 'completed';
    } else if (status === 'FAILED' || status === 'failed') {
      transactionStatus = 'failed';
    } else {
      transactionStatus = 'pending';
    }

    const updateData: any = {
      status: transactionStatus,
      updated_at: new Date().toISOString(),
      completed_at: transactionStatus === 'completed' ? new Date().toISOString() : null,
    };

    if (mpesaCode) {
      updateData.transaction_id = mpesaCode;
    }

    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      console.error(' Failed to update transaction:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update transaction' 
      });
    }

    console.log(' Transaction updated successfully');

    if (transactionStatus === 'completed' && transaction.type === 'deposit') {
      const depositAmount = amount || transaction.amount;
      
      console.log(' Processing successful deposit:', { 
        userId: transaction.user_id, 
        amount: depositAmount 
      });

      const { error: walletError } = await supabase.rpc('safe_increment_wallet_balance', {
        p_user_id: transaction.user_id,
        p_amount: 0 
      });

      if (walletError) {
        console.error(' Failed to update wallet balance:', walletError);
      } else {
        console.log(' Wallet balance updated successfully');
      }

      try {
        await supabase
          .channel('wallet-updates')
          .send({
            type: 'broadcast',
            event: 'balance_updated',
            payload: {
              user_id: transaction.user_id,
              new_balance: null, 
              transaction_id: transaction.id,
              depositAmount: depositAmount,
            }
          });
        
        console.log('📡 Real-time notification sent');
      } catch (notifyError) {
        console.warn('Failed to send real-time notification:', notifyError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Callback processed successfully',
      transaction_id: transaction.id
    });

  } catch (error) {
    console.error(' Webhook processing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}