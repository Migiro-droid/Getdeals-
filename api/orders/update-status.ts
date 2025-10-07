import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId and status'
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    const upperStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update the order status in the database
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: upperStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_reference', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: data.order_reference,
        status: data.status.toLowerCase(),
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Error in update-status API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
