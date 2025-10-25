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
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    console.log(`[API] Fetching orders for user: ${userId}`);

    // Fetch orders for the user
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Error fetching orders:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[API] Fetched ${(data ?? []).length} orders for user ${userId}`);
    console.log('[API] Order IDs:', (data ?? []).map(o => o.id));

    return res.status(200).json({
      success: true,
      count: (data ?? []).length,
      orders: data ?? []
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
