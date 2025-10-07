import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Initialize Supabase client with environment variables check
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId and status'
      });
    }

    console.log('Updating order status:', { orderId, status });

    // Validate status - database uses lowercase values
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    const lowerStatus = status.toLowerCase();
    
    if (!validStatuses.includes(lowerStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update the order status in the database
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: lowerStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_reference', orderId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating order status:', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    if (!data) {
      console.error('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    console.log('Order status updated successfully:', data);

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: data.order_reference,
        status: data.status.toLowerCase(),
        updated_at: data.updated_at
      }
    });

  } catch (error: any) {
    console.error('Error in update-status API:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message || 'Unknown error'}`
    });
  }
}
