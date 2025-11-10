import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';
import { v4 as uuidv4 } from 'uuid';

const _env: any = ((typeof (globalThis as any).process === 'object' && (globalThis as any).process.env && Object.keys((globalThis as any).process.env).length > 0)
  ? (globalThis as any).process.env
  : ((import.meta as any)?.env ?? {}));

const supabaseUrl = _env.VITE_SUPABASE_URL || 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseAnonKey = _env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';
const supabaseServiceKey = _env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error('Invalid Supabase URL. Please check VITE_SUPABASE_URL environment variable.');
}

console.log(' Supabase config:', {
  url: supabaseUrl?.substring(0, 30) + '...',
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  env: _env.NODE_ENV || 'unknown'
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  },

  updateProfile: async (updates: any) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    return { data, error };
  },

  signInWithOAuth: async (provider: 'google' | 'facebook') => {
    const redirectTo = window.location.hostname === 'localhost' 
      ? `${window.location.origin}/auth/callback`
      : `https://getdeals.co.ke/auth/callback`;
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    return { data, error };
  },
  
  handleOAuthCallback: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  }
};

export const productAPI = {
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    return { data, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  create: async (product: any) => {
    const now = new Date().toISOString();
    const productWithId = {
      ...product,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const dbProduct = normalizeProductForDb(productWithId, { noTimestamps: false });

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(dbProduct)
      .select()
      .single();
    return { data, error };
  },

  update: async (id: string, updates: any) => {
    const dbUpdates = normalizeProductForDb(updates, { partial: true, noTimestamps: true });

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);
    return { error };
  },

  createBulk: async (products: any[]) => {
    const dbProducts = products.map(p => normalizeProductForDb(p, { noTimestamps: true }));

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(dbProducts)
      .select();
    return { data, error };
  }
};

function normalizeProductForDb(product: any, opts?: { partial?: boolean; noTimestamps?: boolean }) {
  let allowed = ['id', 'name', 'price', 'originalPrice', 'image', 'category', 'description'];

  if (!opts?.noTimestamps) {
    allowed = [...allowed, 'createdAt', 'updatedAt'];
  }

  const out: any = {};

  for (const k of Object.keys(product || {})) {
    if (!allowed.includes(k)) continue;
    out[k] = (product as any)[k];
  }

  return out;
}

export const categoryAPI = {
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });
    return { data, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  create: async (category: Database['public']['Tables']['categories']['Insert']) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(category)
      .select()
      .single();
    return { data, error };
  },

  update: async (id: string, updates: Database['public']['Tables']['categories']['Update']) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);
    return { error };
  }
};

export const userAPI = {
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single();
    return { data, error };
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', id)
      .select()
      .single();
    return { data, error };
  },

  create: async (user: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(user)
      .select()
      .single();
    return { data, error };
  },

  updateRole: async (id: string, role: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() } as any)
      .eq('user_id', id)
      .select()
      .single();
    return { data, error };
  }
};

export const orderAPI = {
  getAll: async (userId?: string) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        items:order_items(*, product:products(*)),
        address:addresses(*)
      `)
      .order('createdAt', { ascending: false });

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  create: async (order: Database['public']['Tables']['orders']['Insert']) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    return { data, error };
  },

  updateStatus: async (id: string, status: string) => {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  }
};

export const realtime = {
  subscribeToTable: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  },

  subscribeToUserData: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `userId=eq.${userId}` },
        callback
      )
      .subscribe();
  },

  unsubscribe: (subscription: any) => {
    return supabase.removeChannel(subscription);
  }
};

export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    return { data, error };
  },

  deleteFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  createSignedUrl: async (bucket: string, path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { data, error };
  }
};

export const adminUtils = {
  isAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) return false;
    return data && data.role === 'admin';
  },

  makeAdmin: async (userId: string) => {
    return await userAPI.updateRole(userId, 'admin');
  },

  getDashboardStats: async () => {
    const [productsResult, usersResult, ordersResult] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact' }),
      supabaseAdmin.from('users').select('id', { count: 'exact' }),
      supabaseAdmin.from('orders').select('id, total', { count: 'exact' })
    ]);

    const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    return {
      totalProducts: productsResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalOrders: ordersResult.count || 0,
      totalRevenue
    };
  }
};

export default supabase;
