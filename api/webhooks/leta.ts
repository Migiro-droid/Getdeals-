import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LetaWebhookPayload {
  order_id: string;
  order_status: string;
  tracking_url?: string;
  delivery_otp?: string;
  rider?: {
    id: number;
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  reason?: string;
  error_message?: string;
}

/**
 * Process webhook updates from Leta API
 * Called when order status changes (assigned, in_transit, delivered, etc)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: LetaWebhookPayload = req.body;

    console.log(`\n🔔 LETA WEBHOOK RECEIVED:`);
    console.log(`Order ID: ${payload.order_id}`);
    console.log(`Status: ${payload.order_status}`);

    // Validate webhook
    if (!payload.order_id || !payload.order_status) {
      console.error('Invalid webhook payload:', payload);
      return res.status(400).json({
        success: false,
        error: 'Invalid payload - missing order_id or order_status',
      });
    }

    // Extract GetDeals order reference from Leta reference
    const letaReference = payload.order_id;
    const getdealsOrderRef = letaReference.replace('GD-', '');

    console.log(`📦 Looking for GetDeals order: ${getdealsOrderRef}`);

    // Find order by Leta order ID or reference
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_reference, customer_email')
      .or(
        `leta_order_id.eq.${payload.order_id},order_reference.eq.${getdealsOrderRef}`
      )
      .single();

    if (fetchError || !order) {
      console.warn(`⚠️ Order not found for Leta ID: ${payload.order_id}`);
      // Still return 200 to acknowledge receipt
      return res.status(200).json({
        success: true,
        warning: 'Order not found - webhook logged',
      });
    }

    console.log(`✅ Found GetDeals order: ${order.id}`);

    // Map Leta status to GetDeals status
    const statusMap: Record<string, string> = {
      pending: 'pending',
      assigned: 'assigned',
      pickup: 'in_transit',
      in_transit: 'in_transit',
      arriving: 'arriving',
      delivered: 'delivered',
      failed: 'failed',
      cancelled: 'cancelled',
    };

    const getdealsStatus = statusMap[payload.order_status] || payload.order_status;

    // Build update payload
    const updatePayload: any = {
      leta_status: payload.order_status,
      status:
        payload.order_status === 'delivered'
          ? 'delivered'
          : payload.order_status === 'failed' || payload.order_status === 'cancelled'
          ? 'cancelled'
          : 'in_transit',
      last_location_update: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add tracking URL if available
    if (payload.tracking_url) {
      updatePayload.leta_tracking_url = payload.tracking_url;
    }

    // Add delivery OTP if available
    if (payload.delivery_otp) {
      updatePayload.delivery_otp = payload.delivery_otp;
    }

    // Add rider information if available
    if (payload.rider) {
      updatePayload.rider_id = String(payload.rider.id);
      updatePayload.rider_name = payload.rider.name;
      updatePayload.rider_phone = payload.rider.phone;
      updatePayload.rider_latitude = payload.rider.latitude;
      updatePayload.rider_longitude = payload.rider.longitude;
    }

    // Add timestamps for status changes
    if (payload.order_status === 'pickup') {
      updatePayload.pickup_at = new Date().toISOString();
    } else if (payload.order_status === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }

    console.log(`🔄 Updating order with:`, updatePayload);

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order',
      });
    }

    console.log(`✅ Order updated successfully`);

    // Log webhook for audit trail
    try {
      await supabase.from('leta_webhook_logs').insert({
        order_id: order.id,
        leta_order_id: payload.order_id,
        status: payload.order_status,
        payload,
        processed: true,
        processed_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log webhook (non-critical):', logError);
    }

    // Send notification to user if status changed
    try {
      if (payload.order_status === 'delivered') {
        // Send delivery confirmation
        const baseUrl = process.env.FRONTEND_URL || 'https://getdeals.co.ke';
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'delivery-confirmation',
            recipientEmail: order.customer_email,
            data: {
              orderNumber: order.order_reference,
              deliveredAt: new Date().toISOString(),
            },
          }),
        });
      } else if (payload.order_status === 'failed' || payload.order_status === 'cancelled') {
        // Send failure notification
        const baseUrl = process.env.FRONTEND_URL || 'https://getdeals.co.ke';
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'delivery-failed',
            recipientEmail: order.customer_email,
            data: {
              orderNumber: order.order_reference,
              reason: payload.reason || payload.error_message || 'Unknown',
            },
          }),
        });
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to send notification (non-critical):', notificationError);
    }

    return res.status(200).json({
      success: true,
      message: `Order ${order.order_reference} updated to ${getdealsStatus}`,
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
