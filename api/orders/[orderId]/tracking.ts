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
    // Debug: Log all available parameters
    console.log('[TRACKING] Full request object:', {
      query: req.query,
      params: (req as any).params,
      url: req.url,
      path: req.url?.split('?')[0],
    });

    // Handle Vercel dynamic routes - the parameter name matches the file name [orderId]
    const orderId = (req.query.orderId as string) || 
                    ((req as any).params?.orderId as string) ||
                    (req.url?.split('orders/')[1]?.split('/')[0]);

    if (!orderId) {
      console.error('[TRACKING] No order ID provided - all extraction methods failed');
      console.log('[TRACKING] Request query:', req.query);
      console.log('[TRACKING] Request URL:', req.url);
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID required',
        debug: {
          query: req.query,
          url: req.url,
        }
      });
    }

    console.log(`[TRACKING] Fetching tracking info for order: ${orderId}`);

    // Fetch order with delivery info
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

    if (error || !order) {
      console.error('[TRACKING] Order lookup failed:', { 
        error: error?.message || error, 
        orderId,
        errorDetails: error
      });
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found', 
        orderId,
        debug: {
          queryUsed: orderId,
          errorMessage: error?.message || error,
        }
      });
    }

    console.log(`[TRACKING] Order found. Status: ${order.status}, Method: ${order.delivery_method}`);

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
