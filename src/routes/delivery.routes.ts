import express, { Request, Response, Router } from 'express';
import { createLetaOrder, getShippingCost, checkDriverAvailability, cancelLetaOrder, processLetaWebhook, updateOrderDeliveryAddress } from '@/services/orderService';
import { supabase } from '@/lib/supabase';
import { authenticateUser } from '@/middleware/auth';

const router = Router();

/**
 * POST /api/delivery/shipping-cost
 * Get shipping cost for delivery address
 * Body: { latitude: number, longitude: number }
 */
router.post('/shipping-cost', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const shippingCost = await getShippingCost(latitude, longitude);

    res.json({
      success: true,
      data: {
        shippingCost,
        currency: 'KES',
        estimatedDeliveryTime: '30-45 minutes'
      }
    });
  } catch (error) {
    console.error('Shipping cost error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate shipping cost'
    });
  }
});

/**
 * POST /api/delivery/check-availability
 * Check driver availability for delivery location
 * Body: { latitude: number, longitude: number }
 */
router.post('/check-availability', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const availability = await checkDriverAvailability(latitude, longitude);

    res.json({
      success: true,
      data: {
        driversAvailable: availability.success,
        metrics: availability.data
      }
    });
  } catch (error) {
    console.error('Driver availability check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check driver availability'
    });
  }
});

/**
 * POST /api/delivery/orders
 * Create a delivery order with Leta
 * Requires authentication
 * Body: Order data from GetDeals database
 */
router.post('/orders', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { getdealsOrderId } = req.body;

    if (!getdealsOrderId) {
      return res.status(400).json({
        success: false,
        error: 'GetDeals order ID is required'
      });
    }

    // Fetch order from database
    const { data: getdealsOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', getdealsOrderId)
      .single();

    if (fetchError || !getdealsOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Create order in Leta
    const letaOrder = await createLetaOrder(getdealsOrder);

    if (!letaOrder.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create delivery order'
      });
    }

    // Update GetDeals order with Leta details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        leta_order_id: letaOrder.data.id,
        order_reference: letaOrder.data.reference,
        leta_status: letaOrder.data.order_status,
        leta_tracking_url: letaOrder.data.tracking_url
      })
      .eq('id', getdealsOrderId);

    if (updateError) {
      console.error('Order update error:', updateError);
    }

    res.json({
      success: true,
      data: {
        letaOrder: letaOrder.data,
        trackingUrl: letaOrder.data.tracking_url
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    });
  }
});

/**
 * PUT /api/delivery/orders/:orderId/address
 * Update delivery address (before pickup)
 * Requires authentication
 */
router.put('/orders/:orderId/address', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { deliveryAddress } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Delivery address is required'
      });
    }

    // Fetch order
    const { data: getdealsOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !getdealsOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update in Leta
    const updateResult = await updateOrderDeliveryAddress(getdealsOrder, deliveryAddress);

    if (!updateResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update delivery address'
      });
    }

    // Update in GetDeals database
    const { error: dbError } = await supabase
      .from('orders')
      .update({
        delivery_address: deliveryAddress
      })
      .eq('id', orderId);

    if (dbError) {
      console.error('Database update error:', dbError);
    }

    res.json({
      success: true,
      data: { message: 'Delivery address updated successfully' }
    });
  } catch (error) {
    console.error('Address update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update address'
    });
  }
});

/**
 * POST /api/delivery/orders/:orderId/cancel
 * Cancel a delivery order
 * Requires authentication
 */
router.post('/orders/:orderId/cancel', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Fetch order
    const { data: getdealsOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !getdealsOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Cancel in Leta
    const cancelResult = await cancelLetaOrder(getdealsOrder);

    if (!cancelResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to cancel order'
      });
    }

    // Update GetDeals order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        leta_status: 'cancelled'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order cancellation error:', updateError);
    }

    res.json({
      success: true,
      data: { message: 'Order cancelled successfully' }
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order'
    });
  }
});

/**
 * POST /api/delivery/webhook
 * Webhook receiver for Leta order status updates
 * No authentication required (webhook signature verification required in production)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log('Webhook received:', payload);

    // Log webhook
    const { error: logError } = await supabase
      .from('leta_webhook_logs')
      .insert({
        order_id: payload.order_id,
        event_type: 'order_status_update',
        status: payload.order_status,
        payload: JSON.stringify(payload),
        processed: false
      });

    if (logError) {
      console.error('Webhook log error:', logError);
    }

    // Process webhook
    const result = await processLetaWebhook(payload);

    // Mark as processed
    await supabase
      .from('leta_webhook_logs')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('order_id', payload.order_id);

    // Emit Socket.io event for real-time updates
    // This assumes you have access to the io instance
    if (global.io && payload.getdeals_order_id) {
      global.io.to(`order-${payload.getdeals_order_id}`).emit('order-status-update', {
        status: payload.order_status,
        rider: payload.rider,
        otp: payload.delivery_otp,
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.success ? { message: 'Webhook processed successfully' } : { error: result.error }
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    });
  }
});

/**
 * GET /api/delivery/orders/:orderId/tracking
 * Get order with tracking information
 * Requires authentication
 */
router.get('/orders/:orderId/tracking', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Fetch order with tracking info
    const trackingData = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (trackingData.error) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: trackingData.data
    });
  } catch (error) {
    console.error('Tracking fetch error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tracking info'
    });
  }
});

/**
 * GET /api/delivery/orders/user/:userId
 * Get all orders for a user
 * Requires authentication
 */
router.get('/orders/user/:userId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch user orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        orders,
        total: orders?.length || 0
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders'
    });
  }
});

export default router;
