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
    // In Vercel functions with dynamic routes, the parameter is in req.query with the bracket name
    // File: [orderId]/tracking.ts -> Parameter: req.query.orderId
    let orderId = req.query.orderId as string;

    // Debug: Log all available parameters
    console.log('[TRACKING] Parameter extraction attempt:', {
      'req.query.orderId': req.query.orderId,
      'req.params?.orderId': (req as any).params?.orderId,
      'req.url': req.url,
      'typeof orderId': typeof orderId,
      'orderId value': orderId,
    });

    // If orderId is an array (Vercel sometimes does this), take the first element
    if (Array.isArray(orderId)) {
      console.log('[TRACKING] orderId was array, extracting first element');
      orderId = orderId[0];
    }

    if (!orderId || orderId.trim() === '') {
      console.error('[TRACKING] No valid order ID extracted from parameters');
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID required',
        debug: {
          received: req.query.orderId,
          url: req.url,
        }
      });
    }

    console.log(`[TRACKING] Looking up order with ID: ${orderId}`);

    // Fetch order with delivery info - select columns that exist in the schema
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_reference,
        status,
        delivery_method,
        payment_status,
        total_amount,
        subtotal,
        delivery_fee,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        pickup_location,
        payment_method,
        order_items,
        created_at,
        updated_at
      `
      )
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('[TRACKING] Order lookup failed:', { 
        error: error?.message || error, 
        orderId,
        errorDetails: error
      });

      // Try a simpler query to see if the order exists at all
      const { data: simpleCheck, error: simpleError } = await supabase
        .from('orders')
        .select('id, order_reference')
        .eq('id', orderId);

      console.error('[TRACKING] Simple check result:', {
        found: (simpleCheck && simpleCheck.length > 0),
        count: simpleCheck?.length || 0,
        simpleError: simpleError?.message
      });

      return res.status(404).json({ 
        success: false, 
        error: 'Order not found', 
        orderId,
        debug: {
          queryUsed: orderId,
          errorMessage: error?.message || error,
          simpleCheckFound: simpleCheck && simpleCheck.length > 0,
        }
      });
    }

    console.log(`[TRACKING] Order found. Status: ${order.status}, Method: ${order.delivery_method}`);

    // Build tracking response with available data
    const tracking = {
      orderId: order.id,
      orderReference: order.order_reference,
      status: order.status,
      deliveryMethod: order.delivery_method,
      paymentStatus: order.payment_status,
      total: typeof order.total_amount === 'number' ? order.total_amount / 100 : 0, // Convert from cents to KES
      subtotal: typeof order.subtotal === 'number' ? order.subtotal / 100 : 0,
      deliveryFee: typeof order.delivery_fee === 'number' ? order.delivery_fee / 100 : 0,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
      delivery: {
        address: typeof order.delivery_address === 'string' ? order.delivery_address : (order.delivery_address as any)?.address,
        pickupLocation: order.pickup_location,
      },
      items: order.order_items,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    console.log('[TRACKING] Tracking info response ready');

    return res.status(200).json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error('[TRACKING] Error fetching tracking:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
