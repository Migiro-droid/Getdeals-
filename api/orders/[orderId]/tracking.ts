import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orderId = req.query.orderId as string;

    if (!orderId) {
      console.warn('⚠️ No order ID provided in request');
      return res.status(400).json({ success: false, error: 'Order ID required' });
    }

    console.log(`📍 Fetching tracking info for order: ${orderId}`);
    console.log(`🔍 Using Supabase URL: ${supabaseUrl}`);

    // First, try to fetch the order to verify it exists
    const { data: orders, error: listError } = await supabase
      .from('orders')
      .select('id, order_reference, status')
      .eq('id', orderId)
      .limit(1);

    if (listError) {
      // Detect RLS policy issues
      const isRLSError = 
        listError.code === 'PGRST116' ||
        listError.code === '42501' ||
        listError.message?.includes('permission denied') ||
        listError.message?.includes('row-level security') ||
        listError.message?.includes('policy');

      if (isRLSError) {
        console.error('🔒 RLS POLICY BLOCKING ACCESS!');
        console.error('The RLS policy on the orders table is blocking service role access');
        console.error('Solution: Apply the migration 20251027_fix_rls_policies_for_tracking.sql');
        console.error('Details:', {
          code: listError.code,
          message: listError.message,
          details: listError.details,
          hint: listError.hint
        });
        
        return res.status(403).json({
          success: false,
          error: 'RLS Policy Blocking Access',
          hint: 'Database RLS policies need to be configured. Please apply the RLS migration.',
          code: 'RLS_POLICY_ERROR',
          details: process.env.NODE_ENV === 'development' ? listError.message : undefined
        });
      }

      console.error('❌ Error listing orders:', {
        code: listError.code,
        message: listError.message,
        details: listError.details,
        hint: listError.hint
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to query orders',
        details: listError.message
      });
    }

    if (!orders || orders.length === 0) {
      console.warn(`⚠️ No order found with ID: ${orderId}`);
      console.log(`📊 This could indicate: order doesn't exist, RLS policy blocks access, or DB replication lag`);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    console.log(`✓ Order found: ${orders[0].order_reference}`);

    // Now fetch the full order with delivery info
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_reference,
        status,
        delivery_method,
        delivery_address,
        leta_order_id,
        leta_reference,
        leta_status,
        leta_tracking_url,
        rider_name,
        rider_phone,
        rider_latitude,
        rider_longitude,
        delivery_otp,
        last_location_update,
        created_at,
        updated_at
      `
      )
      .eq('id', orderId)
      .single();

    if (error) {
      // Detect RLS policy issues
      const isRLSError = 
        error.code === 'PGRST116' ||
        error.code === '42501' ||
        error.message?.includes('permission denied') ||
        error.message?.includes('row-level security') ||
        error.message?.includes('policy');

      if (isRLSError) {
        console.error('🔒 RLS POLICY BLOCKING DETAILED FETCH!');
        console.error('Solution: Apply the migration 20251027_fix_rls_policies_for_tracking.sql');
        console.error('Details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        return res.status(403).json({
          success: false,
          error: 'RLS Policy Blocking Access',
          code: 'RLS_POLICY_ERROR',
          hint: 'Database RLS policies need to be configured.'
        });
      }

      console.error('❌ Error fetching order details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order',
        details: error.message
      });
    }

    if (!order) {
      console.error('❌ Order returned null despite existence check');
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Build tracking response
    const tracking = {
      orderId: order.id,
      orderReference: order.order_reference,
      status: order.status,
      deliveryMethod: order.delivery_method,
      trackingUrl: order.leta_tracking_url,
      
      // For delivery orders
      ...(order.delivery_method === 'speedy' && {
        deliveryAddress:
          typeof order.delivery_address === 'string'
            ? order.delivery_address
            : (order.delivery_address as any)?.address || 'Delivery Location',
        letaOrderId: order.leta_order_id,
        letaReference: order.leta_reference,
        letaStatus: order.leta_status,
        
        // Rider info
        ...(order.rider_name && {
          rider: {
            name: order.rider_name,
            phone: order.rider_phone,
            latitude: order.rider_latitude,
            longitude: order.rider_longitude,
          },
        }),
        
        deliveryOtp: order.delivery_otp,
        lastUpdate: order.last_location_update,
      }),
      
      // For pickup orders
      ...(order.delivery_method === 'pickup' && {
        pickupLocation:
          typeof order.delivery_address === 'string'
            ? order.delivery_address
            : (order.delivery_address as any)?.pickup_location || 'Pickup Location',
      }),
      
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    console.log('✅ Tracking info:', tracking);

    return res.status(200).json({
      success: true,
      tracking: tracking,
      message: `Tracking info for order ${order.order_reference}`
    });
  } catch (error) {
    console.error('❌ Error fetching tracking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
  }
}
