import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
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
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ 
      success: true,
      message: 'CORS preflight successful'
    });
  }

  // Handle GET for webhook URL validation (Rukisha may ping the endpoint)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true,
      message: 'Rukisha webhook endpoint is active',
      endpoint: '/api/webhooks/rukisha',
      accepts: 'POST requests with callback data'
    });
  }

  // Only allow POST requests for actual callbacks
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST for callbacks.' 
    });
  }

  try {
    console.log('📞 Rukisha webhook received');
    console.log('📦 Request headers:', JSON.stringify(req.headers));
    console.log('📦 Request body:', JSON.stringify(req.body));
    
    const callbackData: RukishaCallback = req.body;
    
    // Validate request body exists
    if (!callbackData || typeof callbackData !== 'object') {
      console.error('❌ Invalid request body - not an object');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body. Expected JSON object.' 
      });
    }

    // Validate required fields
    if (!callbackData.TransactionID || !callbackData.Status) {
      console.error('❌ Invalid callback data - missing required fields');
      console.error('   Received fields:', Object.keys(callbackData));
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid callback data. Missing TransactionID or Status.',
        received_fields: Object.keys(callbackData)
      });
    }

    const {
      TransactionID,
      TransactionType,
      Amount,
      Phone,
      Status,
      Reference,
      ConfirmationCode,
      Timestamp
    } = callbackData;

    // Find the transaction by reference or transaction ID
    let transaction;
    
    if (Reference) {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('reference', Reference)
        .single();
      
      if (error) {
        console.log(' Transaction not found by reference, trying by transaction_id');
      } else {
        transaction = data;
      }
    }

    // Fallback to transaction ID lookup
    if (!transaction) {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('transaction_id', TransactionID)
        .single();
      
      if (error) {
        console.error(' Transaction not found:', { Reference, TransactionID });
        return res.status(404).json({ 
          success: false, 
          error: 'Transaction not found' 
        });
      }
      
      transaction = data;
    }

    console.log('📋 Found transaction:', transaction.id);

    // Update transaction status
    const updateData: any = {
      status: Status,
      updated_at: new Date().toISOString(),
    };

    // Add additional data if available
    if (ConfirmationCode) updateData.confirmation_code = ConfirmationCode;
    if (Timestamp) updateData.processed_at = new Date(Timestamp).toISOString();

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

    // If payment successful, update wallet balance
    if (Status === 'completed' && TransactionType === 'deposit') {
      const depositAmount = Amount || transaction.amount;
      
      console.log('💰 Processing successful deposit:', { 
        userId: transaction.user_id, 
        amount: depositAmount 
      });

      // Recalculate wallet balance from completed transactions only
      const { error: walletError } = await supabase.rpc('safe_increment_wallet_balance', {
        p_user_id: transaction.user_id,
        p_amount: 0 // Just trigger recalculation since transaction is already marked completed
      });

      if (walletError) {
        console.error(' Failed to update wallet balance:', walletError);
        // Continue anyway - transaction status is updated
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