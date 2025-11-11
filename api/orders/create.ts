import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
}


const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function createLetaOrder(letaOrderPayload: any) {
  try {
    const letaApiUrl = process.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';
    const letaToken = process.env.LETA_API_TOKEN || process.env.VITE_LETA_TOKEN;

    if (!letaToken) {
      console.warn(' LETA_API_TOKEN not configured');
      return { success: false, error: 'Leta token not configured' };
    }

    console.log(` Sending request to Leta API: ${letaApiUrl}/orders/add`);
    console.log('Payload:', JSON.stringify(letaOrderPayload, null, 2));

    const response = await fetch(`${letaApiUrl}/orders/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${letaToken}`,
      },
      body: JSON.stringify(letaOrderPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(` Leta API error (${response.status}):`, responseData);
      return {
        success: false,
        error: responseData.message || `Http error: ${response.status}`,
        status: response.status,
      };
    }

    console.log(`Leta order created successfully:`, responseData);
    return { success: true, data: responseData };
  } catch (error) {
    console.error(' Error creating Leta order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CreateOrderRequest {
  user_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_method: string;
  delivery_address?: string;
  pickup_location?: string;
  payment_method: string;
  payment_reference: string; 
  payment_confirmed: boolean;
  mpesa_receipt_number?: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const orderData: CreateOrderRequest = req.body;

    console.log(' Received order data:', {
      user_id: orderData.user_id,
      items_count: orderData.items?.length,
      total_amount: orderData.total_amount,
      payment_reference: orderData.payment_reference,
      payment_confirmed: orderData.payment_confirmed,
      delivery_method: orderData.delivery_method
    });
    
    if (!orderData.user_id || !orderData.items || !orderData.total_amount || !orderData.payment_reference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, items, total_amount, payment_reference'
      });
    }

    
    if (!orderData.payment_confirmed) {
      console.warn(' Order creation attempted without payment confirmation');
      return res.status(400).json({
        success: false,
        error: 'Cannot create order without payment confirmation'
      });
    }

   
  const orderReference = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    console.log(' Creating order:', {
      orderReference,
      user_id: orderData.user_id,
      total_amount: orderData.total_amount,
      payment_reference: orderData.payment_reference,
      items_count: orderData.items.length
    });

    // Build order object matching the actual Supabase schema
    const orderPayload: any = {
      user_id: orderData.user_id,
      order_reference: orderReference,
      customer_email: orderData.customer_email,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      order_items: orderData.items, // Store items as JSONB
      status: 'confirmed',
      payment_status: 'completed',
    };

    // Add numeric fields - ensure they're proper INTEGER type (stored in cents)
    if (orderData.total_amount) {
      orderPayload.total_amount = Math.round(Number(orderData.total_amount) * 100); // Convert to cents
    }
    if (orderData.subtotal) {
      orderPayload.subtotal = Math.round(Number(orderData.subtotal) * 100);
    }
    if (orderData.delivery_fee !== undefined) {
      orderPayload.delivery_fee = Math.round(Number(orderData.delivery_fee) * 100);
    }

    // Add optional fields
    if (orderData.delivery_method) {
      orderPayload.delivery_method = orderData.delivery_method;
    }
    if (orderData.payment_method) {
      orderPayload.payment_method = orderData.payment_method;
    }

    // Add delivery address as JSONB
    if (orderData.delivery_address) {
      orderPayload.delivery_address = JSON.stringify({
        address: orderData.delivery_address
      });
    }
    if (orderData.pickup_location) {
      orderPayload.pickup_location = orderData.pickup_location;
    }

    // Add payment reference if available
    if (orderData.payment_reference) {
      orderPayload.payment_reference = orderData.payment_reference;
    }

    // Add notes with payment info
    const mpesaReceipt = orderData.mpesa_receipt_number || 'N/A';
    const checkoutId = orderData.checkout_request_id || 'N/A';
    orderPayload.notes = `M-Pesa Receipt: ${mpesaReceipt}, Checkout: ${checkoutId}`;

    console.log('[CREATE] Order payload:', JSON.stringify(orderPayload, null, 2));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      console.error(' Error creating order:', orderError);
      console.error('Full error details:', JSON.stringify(orderError, null, 2));
      console.error('Order payload that failed:', JSON.stringify(orderPayload, null, 2));
      return res.status(500).json({
        success: false,
        error: 'Failed to create order in database',
        details: orderError.message || orderError.hint || JSON.stringify(orderError)
      });
    }

    console.log('[CREATE] Order created successfully:', {
      orderId: order.id,
      orderReference: order.order_reference,
      status: order.status,
      deliveryMethod: order.delivery_method,
      totalAmount: order.total_amount
    });

    // Verify order can be queried immediately
    const { data: verifyOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order.id)
      .single();

    if (verifyError || !verifyOrder) {
      console.error('[CREATE] WARNING: Order could not be verified immediately after insert:', {
        error: verifyError,
        orderId: order.id
      });
    } else {
      console.log('[CREATE] Order verified in database immediately after insert');
    }

    
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: Math.round(item.price * 100), 
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error(' Error creating order items (non-critical):', itemsError);
      
    } else {
      console.log(' Order items created successfully');
    }

  
    let paymentUpdateError = null;

    if (orderData.payment_reference) {
      const { error } = await supabase
        .from('payments')
        .update({
          order_id: order.id,
          updated_at: new Date().toISOString()
        })
        .eq('reference', orderData.payment_reference);
      paymentUpdateError = error;
    } else if (orderData.checkout_request_id) {
      const { error } = await supabase
        .from('payments')
        .update({
          order_id: order.id,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', orderData.checkout_request_id);
      paymentUpdateError = error;
    }

    if (paymentUpdateError) {
      console.error(' Error linking payment to order (non-critical):', paymentUpdateError);
    } else {
      console.log(' Payment linked to order');
    }

    // Create delivery order with Leta
    let letaOrderResult = null;
    let deliveryWarning: string | null = null;
    
    if (orderData.delivery_method === 'speedy' && orderData.delivery_address) {
      console.log(`[LETA] Initiating delivery for order: ${order.order_reference}`);
      
      // Get active depot from database
      const { data: depotData, error: depotError } = await supabase
        .from('depots')
        .select('code, latitude, longitude')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (depotError || !depotData) {
        console.warn('[LETA] No active depot found, using default fallback');
      }

      const depot = depotData || {
        code: 'getdeals-nairobi',
        latitude: -1.2860273,
        longitude: 36.8079678
      };

      // Parse delivery address - could be string or object
      let deliveryAddressName = 'Delivery Location';
      if (typeof orderData.delivery_address === 'string') {
        deliveryAddressName = orderData.delivery_address;
      } else if (typeof orderData.delivery_address === 'object' && orderData.delivery_address !== null && 'address' in orderData.delivery_address) {
        deliveryAddressName = (orderData.delivery_address as any).address;
      }

      // Build Leta order payload with proper structure
      const letaOrderPayload = {
        reference: `GD-${order.order_reference}`,
        customer: {
          phone_number: orderData.customer_phone.replace(/\s+/g, ''),
          email: orderData.customer_email,
          name: orderData.customer_name || 'Customer',
        },
        depot_code: depot.code,
        dropoff: {
          latitude: '-1.2860273', // String format per Leta API spec
          longitude: '36.8079678', // String format per Leta API spec
          name: deliveryAddressName,
        },
        products: orderData.items.map((item: any) => ({
          code: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        payment_method: 'postpaid', // Changed to postpaid for GetDeals orders
        special_instruction: `GetDeals Order #${order.order_reference}. Items: ${orderData.items.length}. Payment: ${orderData.payment_method}`,
        cargo_description: orderData.items
          .map((item: any) => `${item.quantity}x ${item.name}`)
          .join(', '),
      };

      console.log('[LETA] Order payload:', JSON.stringify(letaOrderPayload, null, 2));

      letaOrderResult = await createLetaOrder(letaOrderPayload);

      if (letaOrderResult.success && letaOrderResult.data) {
        console.log(`[LETA] Order created successfully. ID: ${letaOrderResult.data.id}`);

        // Update GetDeals order with Leta tracking info
        const { error: letaUpdateError } = await supabase
          .from('orders')
          .update({
            leta_order_id: letaOrderResult.data.id,
            leta_reference: letaOrderResult.data.reference,
            leta_status: letaOrderResult.data.status || 'pending',
            leta_tracking_url: letaOrderResult.data.tracking_url || `https://tracking.leta.ai/${letaOrderResult.data.id}`,
          })
          .eq('id', order.id);

        if (letaUpdateError) {
          console.error('[LETA] Failed to link tracking to order:', letaUpdateError);
          deliveryWarning = 'Order confirmed! Tracking link will be updated within 5 minutes.';
        } else {
          console.log('[LETA] Order successfully linked with tracking');
        }
      } else {
        console.error(`[LETA] Order creation failed:`, letaOrderResult.error);
        console.warn('[LETA] GetDeals order created but delivery pending');
        deliveryWarning = 'Your order is confirmed. Delivery assignment in progress - a rider will be assigned shortly.';
      }
    } else if (orderData.delivery_method === 'pickup') {
      console.log(`[PICKUP] Order ${order.order_reference} is pickup - no delivery integration needed`);
    } else {
      console.log(`[ORDER] Order ${order.order_reference} created - delivery method: ${orderData.delivery_method}`);
    }

    if (orderData.payment_method !== 'mobile-money' && orderData.payment_method !== 'wallet') {
      try {
        const baseUrl = process.env.FRONTEND_URL || 'https://getdeals.co.ke';
        
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order-confirmation',
            recipientEmail: orderData.customer_email,
            data: {
              customerName: orderData.customer_name,
              orderNumber: order.order_reference,
              total: orderData.total_amount,
              items: orderData.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price * item.quantity
              })),
              deliveryAddress: typeof orderData.delivery_address === 'string' 
                ? orderData.delivery_address 
                : (orderData.delivery_address as any)?.address || (orderData.delivery_address as any)?.pickup_location || 'Not specified',
              paymentMethod: orderData.payment_method,
              createdAt: order.created_at,
              trackingUrl: letaOrderResult?.success ? letaOrderResult.data?.tracking_url : undefined
            }
          })
        });
        
        console.log(' Order confirmation email sent');
      } catch (emailError) {
        console.error(' Failed to send order confirmation email:', emailError);
      }
    }
    
    return res.status(201).json({
      success: true,
      ...(deliveryWarning && { deliveryWarning }),
      order: {
        id: order.id,
        order_reference: order.order_reference,
        total_amount: typeof order.total_amount === 'number'
          ? order.total_amount / 100
          : orderData.total_amount,
        status: order.status,
        created_at: order.created_at,
        items: orderData.items,
        payment_reference: order.payment_reference,
        mpesa_receipt_number: orderData.mpesa_receipt_number ?? null,
        ...(letaOrderResult?.success && letaOrderResult.data && {
          leta_order_id: letaOrderResult.data.id,
          leta_reference: letaOrderResult.data.reference,
          tracking_url: letaOrderResult.data.tracking_url,
          delivery_status: 'initiated'
        })
      }
    });

  } catch (error) {
    console.error(' Order creation failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}