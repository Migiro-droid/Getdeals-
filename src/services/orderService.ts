/**
 * Order Service - Integrates GetDeals orders with Leta delivery system
 * Maps existing order schema to Leta API requirements
 */

import { createClient } from '@supabase/supabase-js';
import { letaOrdersService, letaRatesService, letaDriversService } from './leta';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface GetDealsOrder {
  id: string;
  user_id: string;
  order_reference: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_items: any[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_method: string;
  delivery_address: {
    street?: string;
    city?: string;
    latitude: number;
    longitude: number;
    name?: string;
  };
  special_instruction?: string;
  cargo_description?: string;
  status: string;
  created_at: string;
}

interface LetaOrderResponse {
  id: string;
  reference: string;
  order_status: string;
  tracking_url: string;
  customer?: {
    phone_number: string;
  };
}

/**
 * Create order in Leta and link it to GetDeals order
 */
export async function createLetaOrder(getdealsOrder: GetDealsOrder) {
  try {
    // Get depot information
    const { data: depotData } = await supabase
      .from('depots')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!depotData) {
      throw new Error('No active depot configured');
    }

    // Create order in Leta
    const letaResponse = await letaOrdersService.createOrder({
      customer: {
        phone_number: getdealsOrder.customer_phone || '',
        email: getdealsOrder.customer_email,
        name: getdealsOrder.customer_name || 'Customer'
      },
      reference: getdealsOrder.order_reference,
      cargo_description: 
        getdealsOrder.cargo_description || 
        `GetDeals Order ${getdealsOrder.order_reference}`,
      special_instruction: getdealsOrder.special_instruction || '',
      dropoff: {
        name: getdealsOrder.delivery_address.name || 'Delivery Location',
        latitude: String(getdealsOrder.delivery_address.latitude),
        longitude: String(getdealsOrder.delivery_address.longitude)
      },
      depot_code: depotData.code,
      payment_method: getdealsOrder.payment_method === 'mpesa' ? 'postpaid' : 'postpaid',
      products: getdealsOrder.order_items.map(item => ({
        code: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    });

    if (!letaResponse.success || !letaResponse.data) {
      throw new Error(`Leta order creation failed: ${letaResponse.error?.message}`);
    }

    // Update GetDeals order with Leta details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        leta_order_id: letaResponse.data.id,
        leta_reference: letaResponse.data.reference,
        leta_status: letaResponse.data.order_status,
        leta_tracking_url: letaResponse.data.tracking_url,
        status: 'confirmed'
      })
      .eq('id', getdealsOrder.id);

    if (updateError) {
      console.error('Failed to update order with Leta details:', updateError);
      throw updateError;
    }

    return {
      success: true,
      data: letaResponse.data,
      message: 'Order created successfully in Leta'
    };
  } catch (error) {
    console.error('Error creating Leta order:', error);
    throw error;
  }
}

/**
 * Calculate shipping cost for delivery
 */
export async function getShippingCost(
  userLatitude: number,
  userLongitude: number
) {
  try {
    // Get depot coordinates
    const { data: depotData } = await supabase
      .from('depots')
      .select('latitude, longitude')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!depotData) {
      throw new Error('No active depot configured');
    }

    // Check rate cache first
    const { data: cachedRate } = await supabase
      .from('rata_cache')
      .select('*')
      .eq('origin_lat', depotData.latitude)
      .eq('origin_lng', depotData.longitude)
      .eq('destination_lat', userLatitude)
      .eq('destination_lng', userLongitude)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (cachedRate) {
      return {
        success: true,
        data: {
          distance: cachedRate.distance,
          price: cachedRate.price,
          duration: cachedRate.duration
        },
        cached: true
      };
    }

    // Calculate rate from Leta
    const rateResponse = await letaRatesService.calculateRate({
      origin: {
        latitude: depotData.latitude,
        longitude: depotData.longitude
      },
      destination: {
        latitude: userLatitude,
        longitude: userLongitude
      }
    });

    if (!rateResponse.success || !rateResponse.data) {
      throw new Error(`Rate calculation failed: ${rateResponse.error?.message}`);
    }

    // Cache the rate
    await supabase.from('rata_cache').insert({
      origin_lat: depotData.latitude,
      origin_lng: depotData.longitude,
      destination_lat: userLatitude,
      destination_lng: userLongitude,
      distance: rateResponse.data.distance,
      price: rateResponse.data.price,
      duration: rateResponse.data.duration
    });

    return {
      success: true,
      data: rateResponse.data,
      cached: false
    };
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    throw error;
  }
}

/**
 * Check driver availability for delivery area
 */
export async function checkDriverAvailability(
  userLatitude: number,
  userLongitude: number
) {
  try {
    const { data: depotData } = await supabase
      .from('depots')
      .select('latitude, longitude, order_wait_time')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!depotData) {
      throw new Error('No active depot configured');
    }

    const availabilityResponse = await letaDriversService.checkAvailability({
      origin: {
        latitude: depotData.latitude,
        longitude: depotData.longitude
      },
      destination: {
        latitude: userLatitude,
        longitude: userLongitude
      },
      search_radius: 5000,
      order_preparation_time: (depotData.order_wait_time || 15) * 60
    });

    return {
      success: availabilityResponse.success,
      data: availabilityResponse.data,
      message: availabilityResponse.error?.message || 'Drivers available'
    };
  } catch (error) {
    console.error('Error checking driver availability:', error);
    throw error;
  }
}

/**
 * Update order delivery address in Leta
 */
export async function updateOrderDeliveryAddress(
  getdealsOrder: GetDealsOrder,
  newAddress: {
    latitude: number;
    longitude: number;
    name?: string;
  }
) {
  try {
    if (!getdealsOrder.order_reference) {
      throw new Error('Order reference not found');
    }

    const updateResponse = await letaOrdersService.updateOrder({
      reference: getdealsOrder.order_reference,
      dropoff: {
        name: newAddress.name || 'Updated Delivery Location',
        latitude: String(newAddress.latitude),
        longitude: String(newAddress.longitude)
      }
    });

    if (!updateResponse.success) {
      throw new Error(`Update failed: ${updateResponse.error?.message}`);
    }

    // Update GetDeals order
    const { error } = await supabase
      .from('orders')
      .update({
        delivery_address: newAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', getdealsOrder.id);

    if (error) throw error;

    return {
      success: true,
      data: updateResponse.data,
      message: 'Delivery address updated'
    };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

/**
 * Cancel order in Leta
 */
export async function cancelLetaOrder(getdealsOrder: GetDealsOrder) {
  try {
    if (!getdealsOrder.order_reference) {
      throw new Error('Order reference not found');
    }

    const cancelResponse = await letaOrdersService.cancelOrder(
      getdealsOrder.order_reference
    );

    if (!cancelResponse.success) {
      throw new Error(`Cancellation failed: ${cancelResponse.error?.message}`);
    }

    // Update GetDeals order
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        leta_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', getdealsOrder.id);

    if (error) throw error;

    return {
      success: true,
      data: cancelResponse.data,
      message: 'Order cancelled successfully'
    };
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

/**
 * Process webhook from Leta
 */
export async function processLetaWebhook(webhookPayload: any) {
  try {
    // Log webhook
    const { error: logError } = await supabase
      .from('leta_webhook_logs')
      .insert({
        order_id: webhookPayload.order_id,
        event_type: 'order_status_update',
        status: webhookPayload.order_status,
        payload: webhookPayload,
        processed: false
      });

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Find order by Leta order ID
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('leta_order_id', webhookPayload.order_id)
      .single();

    if (fetchError || !orderData) {
      console.warn(`Order not found for Leta ID: ${webhookPayload.order_id}`);
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Update order with webhook data
    const updatePayload: any = {
      leta_status: webhookPayload.order_status,
      last_location_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (webhookPayload.delivery_otp) {
      updatePayload.delivery_otp = webhookPayload.delivery_otp;
    }

    if (webhookPayload.rider) {
      updatePayload.rider_id = webhookPayload.rider.id;
      updatePayload.rider_name = webhookPayload.rider.name;
      updatePayload.rider_phone = webhookPayload.rider.phone;
      updatePayload.rider_latitude = webhookPayload.rider.latitude;
      updatePayload.rider_longitude = webhookPayload.rider.longitude;
    }

    // Update status based on delivery status
    if (webhookPayload.order_status === 'delivered') {
      updatePayload.status = 'delivered';
      updatePayload.delivered_at = new Date().toISOString();
    } else if (webhookPayload.order_status === 'pickup') {
      updatePayload.status = 'in_transit';
      updatePayload.pickup_at = new Date().toISOString();
    } else if (webhookPayload.order_status === 'cancelled' || webhookPayload.order_status === 'failed') {
      updatePayload.status = 'cancelled';
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderData.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw updateError;
    }

    // Mark webhook as processed
    await supabase
      .from('leta_webhook_logs')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('order_id', webhookPayload.order_id);

    return {
      success: true,
      orderId: orderData.id,
      message: `Order updated to ${webhookPayload.order_status}`
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get order with all delivery tracking info
 */
export async function getOrderWithTracking(orderId: string) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: order,
      tracking: {
        letaOrderId: order.leta_order_id,
        status: order.leta_status,
        trackingUrl: order.leta_tracking_url,
        rider: {
          name: order.rider_name,
          phone: order.rider_phone,
          latitude: order.rider_latitude,
          longitude: order.rider_longitude
        },
        deliveryOtp: order.delivery_otp,
        lastUpdate: order.last_location_update
      }
    };
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

/**
 * Get all orders for a user with delivery status
 */
export async function getUserOrders(userId: string) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: orders.map(order => ({
        ...order,
        tracking: {
          status: order.leta_status,
          trackingUrl: order.leta_tracking_url,
          riderName: order.rider_name
        }
      }))
    };
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
}
