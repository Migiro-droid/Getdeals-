import { createClient } from '@supabase/supabase-js';
import { Client as PgClient } from 'pg';
import type { Product } from '../src/data/products';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase URL or service role key not set. lib/db will not be able to connect to Postgres.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

// Helper to run arbitrary SQL (DDL/DML) using the Postgres direct client with the service role key.
let pgClient: PgClient | null = null;
export async function executeSQL(query: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  if (!pgClient) {
  // Prefer a pooled DATABASE_URL (pgbouncer) or DIRECT_URL if provided in env.
  const pgConn = process.env.DATABASE_URL || process.env.DIRECT_URL || SUPABASE_URL.replace(/^https?:\/\//, 'postgresql://');
  pgClient = new PgClient({ connectionString: pgConn });
    await pgClient.connect();
  }
  const res = await pgClient.query(query);
  return res;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: any[];
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase getProducts error:', error);
      return [];
    }

    return (data || []).map((product: any) => ({
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

export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const payload = {
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
    discount: product.discount,
    items: product.items || [],
    itemsDetail: product.itemsDetail || [],
    category: product.category,
    description: product.description,
  };

  const { data, error } = await supabase.from('products').insert([payload]).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('Supabase updateProduct error:', error);
      return null;
    }
    return data as Product;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteProduct error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// User operations
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
    if (error) {
      console.error('Supabase getUsers error:', error);
      return [];
    }
    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Order operations
export async function getOrders(): Promise<Order[]> {
  try {
    // Select orders with items and user
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), users(*)')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase getOrders error:', error);
      return [];
    }

    return (data || []).map((order: any) => ({
      id: order.id,
      userId: order.userId,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
      })),
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

// Seed data function for migration
export async function seedDatabase() {
  const { products } = await import('../src/data/products');
  console.log('🌱 Seeding database with products via Supabase...');

  for (const product of products) {
    try {
      await supabase.from('products').upsert(product);
    } catch (e) {
      console.error('Failed to upsert product', product.id, e);
    }
  }

  console.log(`✅ Seeded ${products.length} products successfully!`);
}
