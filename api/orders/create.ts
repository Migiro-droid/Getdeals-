import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
}


const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      console.warn('⚠️ Order creation attempted without payment confirmation');
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        order_reference: orderReference,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        order_items: orderData.items,
        subtotal: Math.round(orderData.subtotal * 100), 
        delivery_fee: Math.round(orderData.delivery_fee * 100),
        total_amount: Math.round(orderData.total_amount * 100), // Changed from 'total' to 'total_amount'
        delivery_method: orderData.delivery_method,
        delivery_address: orderData.delivery_method === 'speedy' && orderData.delivery_address 
          ? { address: orderData.delivery_address }
          : orderData.delivery_method === 'pickup' && orderData.pickup_location
          ? { pickup_location: orderData.pickup_location }
          : null,
        payment_method: orderData.payment_method,
        payment_reference: orderData.payment_reference,
        payment_status: 'completed',
        status: 'confirmed', 
        notes: `M-Pesa Receipt: ${orderData.mpesa_receipt_number || 'N/A'}, Checkout: ${orderData.checkout_request_id || 'N/A'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error(' Error creating order:', orderError);
      console.error('Full error details:', JSON.stringify(orderError, null, 2));
      return res.status(500).json({
        success: false,
        error: 'Failed to create order in database',
        details: orderError.message || orderError.hint || JSON.stringify(orderError)
      });
    }

    console.log('Order created successfully:', order.id);

    
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

    
    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        order_reference: order.order_reference,
        total_amount: order.total / 100, 
        status: order.status,
        created_at: order.created_at,
        items: orderData.items,
        payment_reference: order.payment_reference,
        mpesa_receipt_number: orderData.mpesa_receipt_number ?? null
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