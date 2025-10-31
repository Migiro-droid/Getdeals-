import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

interface CheckoutRequest {
  order_number: string;
  action: 'checkout' | 'verify';
  admin_id?: string;
  admin_name?: string;
  notes?: string;
}

interface CheckoutResponse {
  success: boolean;
  data?: {
    order_id: string;
    order_number: string;
    status: string;
    checked_out_at: string;
    audit_log_id: string;
  };
  error?: string;
}

/**
 * Checkout endpoint - marks order as picked up and locks it
 * POST /quickmart/orders/checkout/
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
    const { order_number, action, admin_id, admin_name, notes }: CheckoutRequest = req.body;

    // Validate required fields
    if (!order_number || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_number, action'
      });
    }

    if (!['checkout', 'verify'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "checkout" or "verify"'
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

    // Check if order is already checked out
    if (order.status === 'completed' || order.status === 'picked_up') {
      return res.status(409).json({
        success: false,
        error: `Order ${order_number} has already been checked out`
      });
    }

    // Check if order is cancelled or refunded
    if (['cancelled', 'refunded'].includes(order.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot checkout ${order.status} order`
      });
    }

    // For 'verify' action, just return order details without updating status
    if (action === 'verify') {
      return res.status(200).json({
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_reference,
          status: order.status,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount_kes || order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          delivery_address: order.delivery_address,
          pickup_location: order.pickup_location,
          items: order.items || [],
          created_at: order.created_at
        }
      });
    }

    // Execute checkout transaction
    const checkedOutAt = new Date().toISOString();
    const auditLogId = uuidv4();

    // Update order status to 'picked_up' and lock it
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'picked_up',
        checked_out_at: checkedOutAt,
        checked_out_by: admin_id || 'system',
        is_locked: true,
        updated_at: checkedOutAt
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('checkout_audit_logs')
      .insert({
        id: auditLogId,
        order_id: order.id,
        order_reference: order_number,
        action: 'checkout',
        admin_id: admin_id || 'system',
        admin_name: admin_name || 'System',
        notes: notes || null,
        created_at: checkedOutAt
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the entire request if audit log creation fails
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order_number,
        status: 'picked_up',
        checked_out_at: checkedOutAt,
        audit_log_id: auditLogId
      }
    } as CheckoutResponse);
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
