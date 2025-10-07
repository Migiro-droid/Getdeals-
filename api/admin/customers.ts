import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type CustomerStatus = 'active' | 'inactive' | 'blocked';

type SupabaseProfile = {
  user_id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  organization_number?: string | null;
  getdeals_number?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
  last_sign_in_at?: string | null;
  is_active?: boolean | null;
  status?: string | null;
  account_status?: string | null;
  metadata?: { notes?: string } | null;
};

type SupabaseWallet = {
  user_id: string;
  balance: number | string | null;
  is_active?: boolean | null;
  getdeals_number?: string | null;
  updated_at?: string | null;
};

type SupabaseOrder = {
  user_id: string;
  total: number | string | null;
  created_at?: string | null;
};

type CustomerPayload = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address?: string;
  joinDate: string | null;
  lastOrderDate: string | null;
  totalOrders: number;
  totalSpent: number;
  status: CustomerStatus;
  preferredLocation?: string;
  notes?: string;
  getdealsNumber: string | null;
  walletBalance: number;
  walletActive: boolean;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: SupabaseClient | null = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
} else {
  console.warn('[admin/customers] Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY.');
}

function mapStatus(profile: SupabaseProfile): CustomerStatus {
  const candidates = [profile.account_status, profile.status]
    .map((value) => (typeof value === 'string' ? value.toLowerCase() : value))
    .filter(Boolean) as string[];

  if (candidates.includes('blocked')) return 'blocked';
  if (candidates.includes('inactive')) return 'inactive';
  if (candidates.includes('active')) return 'active';

  if (profile.is_active === false) return 'inactive';
  return 'active';
}

function buildName(profile: SupabaseProfile): string {
  if (profile.full_name && profile.full_name.trim().length > 0) {
    return profile.full_name.trim();
  }

  const parts = [profile.first_name, profile.last_name]
    .map((part) => (part && part.trim().length > 0 ? part.trim() : null))
    .filter(Boolean) as string[];

  if (parts.length > 0) {
    return parts.join(' ');
  }

  if (profile.email && profile.email.trim().length > 0) {
    return profile.email.trim();
  }

  if (profile.phone && profile.phone.trim().length > 0) {
    return profile.phone.trim();
  }

  return 'Unknown User';
}

function normalizeCurrency(value: number | string | null | undefined, divisor = 1): number {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return 0;
  return numeric / divisor;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!supabaseClient) {
    return res.status(500).json({ success: false, error: 'Supabase is not configured' });
  }

  try {
    const { data: profiles, error: profileError } = await supabaseClient
      .from('user_profile')
      .select(
        `
        user_id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        organization,
        organization_number,
        getdeals_number,
        created_at,
        updated_at,
        last_login_at,
        last_sign_in_at,
        is_active,
        status,
        account_status,
        metadata
      `
      )
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('[admin/customers] Failed to fetch profiles:', profileError);
      throw profileError;
    }

    const profileRows = (profiles || []) as SupabaseProfile[];
    const userIds = profileRows.map((profile) => profile.user_id).filter(Boolean);

    let walletRows: SupabaseWallet[] = [];
    let orderRows: SupabaseOrder[] = [];

    if (userIds.length > 0) {
      const [{ data: wallets, error: walletError }, { data: orders, error: ordersError }] = await Promise.all([
        supabaseClient
          .from('wallets')
          .select('user_id, balance, is_active, getdeals_number, updated_at')
          .in('user_id', userIds),
        supabaseClient
          .from('orders')
          .select('user_id, total, created_at')
          .in('user_id', userIds)
      ]);

      if (walletError) {
        console.error('[admin/customers] Failed to fetch wallets:', walletError);
        throw walletError;
      }

      if (ordersError) {
        console.error('[admin/customers] Failed to fetch orders:', ordersError);
        throw ordersError;
      }

      walletRows = (wallets || []) as SupabaseWallet[];
      orderRows = (orders || []) as SupabaseOrder[];
    }

    const walletByUser = new Map<string, SupabaseWallet>();
    for (const wallet of walletRows) {
      walletByUser.set(wallet.user_id, wallet);
    }

    const orderStats = new Map<string, { totalOrders: number; totalSpent: number; lastOrderDate: string | null }>();
    for (const order of orderRows) {
      if (!order.user_id) continue;
      const existing = orderStats.get(order.user_id) || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
      existing.totalOrders += 1;
      const orderTotal = normalizeCurrency(order.total, 100); // totals stored in cents
      existing.totalSpent += orderTotal;

      if (order.created_at) {
        if (!existing.lastOrderDate || new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
      }

      orderStats.set(order.user_id, existing);
    }

    const customers: CustomerPayload[] = profileRows.map((profile) => {
      const wallet = walletByUser.get(profile.user_id);
      const stats = orderStats.get(profile.user_id) || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };

      return {
        id: profile.user_id,
        name: buildName(profile),
        email: profile.email ?? null,
        phone: profile.phone ?? null,
        address: profile.organization || undefined,
        joinDate: profile.created_at ?? null,
        lastOrderDate: stats.lastOrderDate,
        totalOrders: stats.totalOrders,
        totalSpent: Number(stats.totalSpent.toFixed(2)),
        status: mapStatus(profile),
        preferredLocation: profile.organization || undefined,
        notes: profile.metadata?.notes,
        getdealsNumber: profile.getdeals_number || wallet?.getdeals_number || null,
        walletBalance: Number(normalizeCurrency(wallet?.balance ?? 0).toFixed(2)),
        walletActive: wallet?.is_active === true,
      };
    });

    const summary = customers.reduce(
      (acc, customer) => {
        acc.total += 1;
        if (customer.status === 'active') acc.active += 1;
        if (customer.status === 'inactive') acc.inactive += 1;
        if (customer.status === 'blocked') acc.blocked += 1;
        acc.totalOrders += customer.totalOrders;
        acc.totalSpent += customer.totalSpent;
        return acc;
      },
      { total: 0, active: 0, inactive: 0, blocked: 0, totalOrders: 0, totalSpent: 0 }
    );

    return res.status(200).json({ success: true, customers, summary });
  } catch (error) {
    console.error('[admin/customers] Unexpected error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load customers' });
  }
}
