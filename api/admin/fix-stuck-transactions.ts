import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('🔧 Starting stuck transactions fix...');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: stuckTransactions, error: queryError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('status', 'pending')
      .eq('transaction_type', 'deposit')
      .lt('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error(' Error querying stuck transactions:', queryError);
      return res.status(500).json({ 
        success: false, 
        error: 'Database query failed' 
      });
    }

    if (!stuckTransactions || stuckTransactions.length === 0) {
      console.log(' No stuck transactions found');
      return res.status(200).json({
        success: true,
        message: 'No stuck transactions found',
        processed: 0
      });
    }

    console.log(`🔍 Found ${stuckTransactions.length} potentially stuck transactions`);

    let processedCount = 0;
    let errors = [];

    for (const transaction of stuckTransactions) {
      try {
        console.log(` Processing transaction ${transaction.transaction_id}...`);

        const { error: updateError } = await supabase
          .from('wallet_transactions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            mpesa_receipt_number: transaction.mpesa_receipt_number || 'MANUAL_FIX'
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error(` Failed to update transaction ${transaction.id}:`, updateError);
          errors.push({
            transaction_id: transaction.transaction_id,
            error: updateError.message
          });
          continue;
        }

        const { error: balanceError } = await supabase.rpc('safe_increment_wallet_balance', {
          p_user_id: transaction.user_id,
          p_amount: 0 
        });

        if (balanceError) {
          console.error(` Failed to update wallet balance for transaction ${transaction.id}:`, balanceError);
          
          await supabase
            .from('wallet_transactions')
            .update({ 
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          errors.push({
            transaction_id: transaction.transaction_id,
            error: `Balance update failed: ${balanceError.message}`
          });
          continue;
        }

        try {
          await supabase
            .channel('wallet-updates')
            .send({
              type: 'broadcast',
              event: 'balance_updated',
              payload: {
                user_id: transaction.user_id,
                transaction_id: transaction.id,
                depositAmount: transaction.amount,
                source: 'manual_fix'
              }
            });
        } catch (notifyError) {
          console.warn(` Failed to send notification for ${transaction.id}:`, notifyError);
        }

        processedCount++;
        console.log(`Successfully processed transaction ${transaction.transaction_id} (KES ${transaction.amount})`);

      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
        errors.push({
          transaction_id: transaction.transaction_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Processing complete: ${processedCount}/${stuckTransactions.length} transactions fixed`);

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${processedCount} stuck transactions`,
      processed: processedCount,
      total_found: stuckTransactions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error(' Stuck transactions fix error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}