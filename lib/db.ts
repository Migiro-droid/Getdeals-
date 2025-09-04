import { PrismaClient } from '@prisma/client';
import { supabase, supabaseAdmin } from './supabase';

declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma client for database operations
export const prisma = globalThis.prisma || new PrismaClient();

// Export Supabase clients
export { supabase, supabaseAdmin };

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  items: string[];
  itemsDetail?: { name: string; image: string }[];
  category: string;
  description?: string;
  createdAt?: string;
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      image: product.image,
      discount: product.discount || undefined,
      items: product.items,
      itemsDetail: product.itemsDetail as { name: string; image: string }[] || undefined,
      category: product.category,
      description: product.description || undefined,
      createdAt: product.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const created = await prisma.product.create({
    data: {
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      discount: product.discount,
      items: product.items || [],
      itemsDetail: product.itemsDetail || [],
      category: product.category,
      description: product.description,
    }
  });
  
  return {
    id: created.id,
    name: created.name,
    price: created.price,
    originalPrice: created.originalPrice || undefined,
    image: created.image,
    discount: created.discount || undefined,
    items: created.items,
    itemsDetail: created.itemsDetail as { name: string; image: string }[] || undefined,
    category: created.category,
    description: created.description || undefined,
  };
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.price && { price: updates.price }),
        ...(updates.originalPrice !== undefined && { originalPrice: updates.originalPrice }),
        ...(updates.image && { image: updates.image }),
        ...(updates.discount !== undefined && { discount: updates.discount }),
        ...(updates.items && { items: updates.items }),
        ...(updates.itemsDetail && { itemsDetail: updates.itemsDetail }),
        ...(updates.category && { category: updates.category }),
        ...(updates.description !== undefined && { description: updates.description }),
      }
    });

    return {
      id: updated.id,
      name: updated.name,
      price: updated.price,
      originalPrice: updated.originalPrice || undefined,
      image: updated.image,
      discount: updated.discount || undefined,
      items: updated.items,
      itemsDetail: updated.itemsDetail as { name: string; image: string }[] || undefined,
      category: updated.category,
      description: updated.description || undefined,
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// User operations
export async function getUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Order operations
export async function getOrders(): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return orders.map(order => ({
      id: order.id,
      userId: order.userId,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: item.product
      })),
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod || undefined,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Seed data function for migration
export async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // Add your seed data here or call this function with products parameter
  console.log('✅ Database seeding function ready!');
}
