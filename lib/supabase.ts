import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';
import { v4 as uuidv4 } from 'uuid';

// Environment variables with fallbacks
// Support both Vite's import.meta.env (browser) and process.env (Node scripts)
const _env: any = ((typeof (globalThis as any).process === 'object' && (globalThis as any).process.env && Object.keys((globalThis as any).process.env).length > 0)
  ? (globalThis as any).process.env
  : ((import.meta as any)?.env ?? {}));

// Ensure we have valid URLs with fallbacks
const supabaseUrl = _env.VITE_SUPABASE_URL || 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseAnonKey = _env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';
const supabaseServiceKey = _env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

// Validate URLs before using them
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error('Invalid Supabase URL. Please check VITE_SUPABASE_URL environment variable.');
}

console.log('🗃️ Supabase config:', {
  url: supabaseUrl?.substring(0, 30) + '...',
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  env: _env.NODE_ENV || 'unknown'
});

// Client-side Supabase client for general use
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin client with service role key for admin operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Authentication helpers
export const auth = {
  // Sign up new user
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

  // Sign in user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  },

  // Update user profile
  updateProfile: async (updates: any) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    return { data, error };
  },

  // Sign in with OAuth provider
  signInWithOAuth: async (provider: 'google' | 'facebook') => {
    // Determine the correct redirect URL based on environment
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
  
  // Handle OAuth callback
  handleOAuthCallback: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  }
};

// Product management helpers for admin
export const productAPI = {
  // Get all products (use admin client for consistent access)
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    return { data, error };
  },

  // Get product by ID (use admin client for consistent access)
  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create new product (admin only)
  create: async (product: any) => {
    const now = new Date().toISOString();
    const productWithId = {
      ...product,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    // normalize to DB column names / allowed fields
    const dbProduct = normalizeProductForDb(productWithId, { noTimestamps: false });

    // @ts-ignore
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(dbProduct)
      .select()
      .single();
    return { data, error };
  },

  // Update product (admin only)
  update: async (id: string, updates: any) => {
    const dbUpdates = normalizeProductForDb(updates, { partial: true, noTimestamps: true });

    // @ts-ignore
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete product (admin only)
  delete: async (id: string) => {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Bulk operations
  createBulk: async (products: any[]) => {
    const dbProducts = products.map(p => normalizeProductForDb(p, { noTimestamps: true }));

    // @ts-ignore
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(dbProducts)
      .select();
    return { data, error };
  }
};

// Helper: normalize product payload to DB-compatible shape
function normalizeProductForDb(product: any, opts?: { partial?: boolean; noTimestamps?: boolean }) {
  // Use a minimal safe whitelist to avoid sending columns that might not exist
  // in the live Supabase schema. This keeps payloads minimal and lets the DB
  // apply defaults (timestamps, flags) server-side.
  let allowed = ['id', 'name', 'price', 'originalPrice', 'image', 'category', 'description'];

  // Include timestamps if not explicitly disabled
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

// Categories management helpers
export const categoryAPI = {
  // Get all categories
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });
    return { data, error };
  },

  // Get category by ID
  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Create new category (admin only)
  create: async (category: Database['public']['Tables']['categories']['Insert']) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(category)
      .select()
      .single();
    return { data, error };
  },

  // Update category (admin only)
  update: async (id: string, updates: Database['public']['Tables']['categories']['Update']) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Delete category (admin only)
  delete: async (id: string) => {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);
    return { error };
  }
};

// User management helpers for admin - using profiles table
export const userAPI = {
  // Get all users (admin only)
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get user by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single();
    return { data, error };
  },

  // Update user profile
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', id)
      .select()
      .single();
    return { data, error };
  },

  // Create user profile (used in auth signup)
  create: async (user: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(user)
      .select()
      .single();
    return { data, error };
  },

  // Update user role (admin only) - Note: profiles table doesn't have role field
  updateRole: async (id: string, role: string) => {
    // This might not be needed if profiles table doesn't have role field
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        // role, // Comment out if profiles table doesn't have role field
        updated_at: new Date().toISOString()
      })
      .eq('user_id', id)
      .select()
      .single();
    return { data, error };
  }
};

// Order management helpers
export const orderAPI = {
  // Get all orders (admin) or user orders
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

  // Create new order
  create: async (order: Database['public']['Tables']['orders']['Insert']) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    return { data, error };
  },

  // Update order status (admin)
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

// Real-time helpers
export const realtime = {
  // Subscribe to table changes
  subscribeToTable: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  },

  // Subscribe to specific user's data
  subscribeToUserData: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `userId=eq.${userId}` },
        callback
      )
      .subscribe();
  },

  // Unsubscribe
  unsubscribe: (subscription: any) => {
    return supabase.removeChannel(subscription);
  }
};

// Storage helpers
export const storage = {
  // Upload file
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    return { data, error };
  },

  // Delete file
  deleteFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  },

  // Get public URL
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Create signed URL
  createSignedUrl: async (bucket: string, path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { data, error };
  }
};

// Admin utility functions
export const adminUtils = {
  // Check if user is admin
  isAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) return false;
    return data && data.role === 'admin';
  },

  // Promote user to admin
  makeAdmin: async (userId: string) => {
    return await userAPI.updateRole(userId, 'admin');
  },

  // Get admin dashboard stats
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
