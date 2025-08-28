import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Product operations
export async function getProducts() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      image: product.image,
      discount: product.discount || undefined,
      items: product.items || [],
      itemsDetail: product.itemsDetail || undefined,
      category: product.category,
      description: product.description || undefined,
      createdAt: product.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function createProduct(product) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        id: uuidv4(),
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        discount: product.discount,
        items: product.items || [],
        itemsDetail: product.itemsDetail || {},
        category: product.category,
        description: product.description,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      originalPrice: data.originalPrice || undefined,
      image: data.image,
      discount: data.discount || undefined,
      items: data.items || [],
      itemsDetail: data.itemsDetail || undefined,
      category: data.category,
      description: data.description || undefined,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

export async function updateProduct(id, updates) {
  try {
    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.originalPrice !== undefined) updateData.originalPrice = updates.originalPrice;
    if (updates.image) updateData.image = updates.image;
    if (updates.discount !== undefined) updateData.discount = updates.discount;
    if (updates.items) updateData.items = updates.items;
    if (updates.itemsDetail) updateData.itemsDetail = updates.itemsDetail;
    if (updates.category) updateData.category = updates.category;
    if (updates.description !== undefined) updateData.description = updates.description;
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      originalPrice: data.originalPrice || undefined,
      image: data.image,
      discount: data.discount || undefined,
      items: data.items || [],
      itemsDetail: data.itemsDetail || undefined,
      category: data.category,
      description: data.description || undefined,
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

export async function deleteProduct(id) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// User operations
export async function getUsers() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Order operations
export async function getOrders() {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        user:users(*),
        items:order_items(*, product:products(*))
      `)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    
    return data.map(order => ({
      id: order.id,
      userId: order.userId,
      items: order.items || [],
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod || undefined,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Seed data function
export async function seedDatabase() {
  console.log('🌱 Seeding database...');
  // Add your seed data here
  console.log('✅ Database seeding function ready!');
}
