import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

interface ReimbursementRequest {
  order_number: string;
  reason: string;
  amount?: number;
  admin_id?: string;
  admin_name?: string;
  notes?: string;
}

interface ReimbursementResponse {
  success: boolean;
  data?: {
    order_id: string;
    order_number: string;
    status: string;
    reimbursement_amount: number;
    reimbursed_at: string;
    audit_log_id: string;
  };
  error?: string;
}

const VALID_REASONS = [
  'customer_cancelled',
  'damaged_item',
  'price_dispute',
  'out_of_stock',
  'customer_return',
  'defective',
  'duplicate_order',
  'other'
];

/**
 * Reimbursement endpoint - handles order cancellations and refunds
 * POST /quickmart/orders/reimburse/
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Forwarded-Host, Origin, X-Forwarded-Proto, Content-Type, Accept, Authorization, Access-Control-Allow-Headers, GET, POST, PUT, DELETE'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      order_number,
      reason,
      amount,
      admin_id,
      admin_name,
      notes
    }: ReimbursementRequest = req.body;

    // Validate required fields
    if (!order_number || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_number, reason'
      });
    }

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`
      });
    }

    // Fetch order by order_reference
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', order_number)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({
        success: false,
        error: `Order not found: ${order_number}`
      });
    }

    // Check if order is already refunded
    if (order.status === 'refunded' || order.status === 'cancelled') {
      return res.status(409).json({
        success: false,
        error: `Order ${order_number} has already been refunded or cancelled`
      });
    }

    // Calculate refund amount
    const refundAmount = amount || (order.total_amount_kes || order.total || 0);

    const reimburseAt = new Date().toISOString();
    const auditLogId = uuidv4();

    // Begin transaction: update order and create audit log
    // Update order status to 'refunded'
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        refunded_at: reimburseAt,
        refunded_amount: refundAmount,
        refund_reason: reason,
        refunded_by: admin_id || 'system',
        is_locked: true,
        updated_at: reimburseAt
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }

    // Create reimbursement audit log entry
    const { error: auditError } = await supabase
      .from('checkout_audit_logs')
      .insert({
        id: auditLogId,
        order_id: order.id,
        order_reference: order_number,
        action: 'reimbursement',
        reason: reason,
        amount: refundAmount,
        admin_id: admin_id || 'system',
        admin_name: admin_name || 'System',
        notes: notes || null,
        created_at: reimburseAt
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail if audit log creation fails
    }

    // If user has wallet, credit the amount
    if (order.user_id) {
      try {
        const { data: wallet, error: walletFetchError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', order.user_id)
          .single();

        if (wallet && !walletFetchError) {
          // Update wallet balance
          await supabase
            .from('wallets')
            .update({
              balance: supabase.rpc('increment_wallet_balance', {
                wallet_id: wallet.id,
                amount: refundAmount
              })
            })
            .eq('id', wallet.id);

          // Create wallet transaction record
          await supabase
            .from('wallet_transactions')
            .insert({
              user_id: order.user_id,
              wallet_id: wallet.id,
              type: 'refund',
              amount: refundAmount,
              status: 'completed',
              description: `Refund for order ${order_number} - ${reason}`,
              completed_at: reimburseAt
            });
        }
      } catch (walletError) {
        console.error('Error processing wallet refund:', walletError);
        // Don't fail the reimbursement if wallet update fails
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order_number,
        status: 'refunded',
        reimbursement_amount: refundAmount,
        reimbursed_at: reimburseAt,
        audit_log_id: auditLogId
      }
    } as ReimbursementResponse);
  } catch (error) {
    console.error('Reimbursement error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
