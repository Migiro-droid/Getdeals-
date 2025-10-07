import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { limit = '50', offset = '0', status, search } = req.query;

    // Try using the view first, fall back to direct query if view doesn't exist
    let query = supabase
      .from('orders_with_details')
      .select('*')
      .order('created_at', { ascending: false });

    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search && typeof search === 'string') {
      query = query.or(`order_reference.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    let { data: orders, error: ordersError } = await query;

    // If view doesn't exist, fall back to direct orders table query
    if (ordersError && ordersError.message?.includes('orders_with_details')) {
      console.log('View not found, using direct orders query...');
      
      let directQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        directQuery = directQuery.eq('status', status);
      }

      if (search && typeof search === 'string') {
        directQuery = directQuery.or(`order_reference.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      }

      directQuery = directQuery.range(offsetNum, offsetNum + limitNum - 1);

      const result = await directQuery;
      orders = result.data;
      ordersError = result.error;

      // Transform data to match expected format
      if (orders && !ordersError) {
        orders = orders.map((order: any) => ({
          ...order,
          total_amount_kes: order.total > 100000 ? order.total / 100 : order.total,
          subtotal_kes: order.subtotal > 100000 ? order.subtotal / 100 : order.subtotal,
          delivery_fee_kes: order.delivery_fee > 100000 ? order.delivery_fee / 100 : order.delivery_fee,
          items: order.order_items || [],
          delivery_address: typeof order.delivery_address === 'object' ? order.delivery_address?.address : order.delivery_address,
          pickup_location: typeof order.delivery_address === 'object' ? order.delivery_address?.pickup_location : null
        }));
      }
    }

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      });
    }

    
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (search && typeof search === 'string') {
      countQuery = countQuery.or(`order_reference.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting orders:', countError);
    }

   
    const { data: stats, error: statsError } = await supabase
      .from('orders')
      .select('status, total_amount')
      .not('total_amount', 'is', null);

    let orderStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    if (!statsError && stats) {
      orderStats = stats.reduce((acc: any, order: any) => {
        acc.total++;
        acc[order.status.toLowerCase()] = (acc[order.status.toLowerCase()] || 0) + 1;
        acc.totalRevenue += (order.total_amount || 0) / 100; 
        return acc;
      }, orderStats);
    }

    return res.status(200).json({
      success: true,
      orders: orders || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count || 0,
        hasMore: (count || 0) > offsetNum + limitNum
      },
      stats: orderStats
    });

  } catch (error) {
    console.error('Error in orders API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}