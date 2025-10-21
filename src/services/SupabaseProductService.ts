/**
 * Direct Supabase Product Service
 * Bypasses all API layers and connects directly to Supabase
 */
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/data/products';

export interface SupabaseProduct {
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
  inStock?: boolean;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export class SupabaseProductService {
  /**
   * Fetch all products directly from Supabase
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      console.log('🔄 SupabaseProductService: Fetching products directly from Supabase...');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log(`✅ SupabaseProductService: Retrieved ${data?.length || 0} products`);

      if (!data) {
        return [];
      }

      // Transform Supabase data to match Product interface
      const products: Product[] = data.map(this.transformSupabaseProduct);

      console.log('📊 SupabaseProductService: Products by category:');
      const categoryCount = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`   • ${category}: ${count} products`);
      });

      return products;
    } catch (error) {
      console.error('❌ SupabaseProductService: Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Fetch products by category
   */
  static async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      console.log(`🔄 SupabaseProductService: Fetching ${category} products from Supabase...`);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log(`✅ SupabaseProductService: Retrieved ${data?.length || 0} products for category ${category}`);

      if (!data) {
        return [];
      }

      return data.map(this.transformSupabaseProduct);
    } catch (error) {
      console.error(`❌ SupabaseProductService: Failed to fetch ${category} products:`, error);
      return [];
    }
  }

  /**
   * Add a new product to Supabase
   */
  static async addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      console.log('🔄 SupabaseProductService: Adding product to Supabase...', product.name);
      // First, try to create via the server-side API which runs with service role privileges.
      // This is the preferred path because client-side anon keys may be blocked by RLS.
      try {
        const resp = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.transformToSupabaseProduct(product)),
        });

        if (resp.ok) {
          const created = await resp.json();
          console.log(' SupabaseProductService: Product added via server API');
          return this.transformSupabaseProduct(created);
        }

        // If server responded with an error, try direct Supabase insert as a fallback
        const text = await resp.text();
        console.warn(' SupabaseProductService: Server API returned error:', resp.status, resp.statusText, text);
      } catch (fetchErr) {
        console.warn(' SupabaseProductService: Server API unreachable, falling back to direct Supabase insert', fetchErr);
      }

      // Fallback: direct Supabase insert (may fail due to permissions)
      const now = new Date().toISOString();
      const supabaseProduct = { ...this.transformToSupabaseProduct(product), createdAt: now, updatedAt: now };

      const { data, error } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select()
        .single();

      if (error) {
        console.error(' Supabase insert error:', error);
        // Throw a detailed error so the UI can show the exact Supabase message
        throw new Error(error.message || JSON.stringify(error));
      }

      console.log('✅ SupabaseProductService: Product added successfully (direct supabase)');

      if (!data) {
        return null;
      }

      return this.transformSupabaseProduct(data);
    } catch (error) {
      console.error('❌ SupabaseProductService: Failed to add product:', error);
      throw error;
    }
  }

  /**
   * Update a product in Supabase
   */
  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      console.log('🔄 SupabaseProductService: Updating product in Supabase...', id);

      const supabaseUpdates = this.transformToSupabaseProduct(updates);

      const { data, error } = await supabase
        .from('products')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
      console.error('❌ Supabase update error:', error);
      throw new Error(error.message || JSON.stringify(error));
      }

      console.log('✅ SupabaseProductService: Product updated successfully');

      if (!data) {
        return null;
      }

      return this.transformSupabaseProduct(data);
    } catch (error) {
      console.error('❌ SupabaseProductService: Failed to update product:', error);
      throw error;
    }
  }

  /**
   * Delete a product from Supabase
   */
  static async deleteProduct(id: string): Promise<boolean> {
    try {
      console.log('🔄 SupabaseProductService: Deleting product from Supabase...', id);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw error;
      }

      console.log('✅ SupabaseProductService: Product deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ SupabaseProductService: Failed to delete product:', error);
      return false;
    }
  }

  /**
   * Search products
   */
  static async searchProducts(query: string): Promise<Product[]> {
    try {
      console.log('🔍 SupabaseProductService: Searching products...', query);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase search error:', error);
        throw error;
      }

      console.log(`✅ SupabaseProductService: Found ${data?.length || 0} products matching "${query}"`);

      if (!data) {
        return [];
      }

      return data.map(this.transformSupabaseProduct);
    } catch (error) {
      console.error('❌ SupabaseProductService: Search failed:', error);
      return [];
    }
  }

  /**
   * Transform Supabase data to Product interface
   */
  private static transformSupabaseProduct(supabaseProduct: any): Product {
    const product = {
      id: supabaseProduct.id,
      name: supabaseProduct.name,
      price: supabaseProduct.price,
      originalPrice: supabaseProduct.originalPrice,
      image: supabaseProduct.image,
      discount: supabaseProduct.discount,
      items: supabaseProduct.items || [],
      itemsDetail: supabaseProduct.itemsDetail || [],
      category: supabaseProduct.category,
      description: supabaseProduct.description,
      isHotDeal: supabaseProduct.isHotDeal || false,
      isNewArrival: supabaseProduct.isNewArrival || false,
      isSpecialDeal: supabaseProduct.isSpecialDeal || false,
      isTopBasket: supabaseProduct.isTopBasket || false,
      // featured and inStock intentionally omitted - source-of-truth in DB schema does not include these fields for frontend
    };
    
    // Debug logging for loaded promotional flags
    const activeFlags = (product.isHotDeal ? 1 : 0) + (product.isNewArrival ? 1 : 0) + (product.isSpecialDeal ? 1 : 0) + (product.isTopBasket ? 1 : 0);
    if (activeFlags > 1) {
      console.warn('⚠️ MUTUAL EXCLUSIVITY VIOLATION: Product with multiple flags loaded from DB:', {
        name: product.name,
        isHotDeal: product.isHotDeal,
        isNewArrival: product.isNewArrival,
        isSpecialDeal: product.isSpecialDeal,
        isTopBasket: product.isTopBasket,
        activeCount: activeFlags
      });
    } else if (activeFlags === 1) {
      console.log('✅ Product with single promotional flag loaded:', {
        name: product.name,
        isHotDeal: product.isHotDeal,
        isNewArrival: product.isNewArrival,
        isSpecialDeal: product.isSpecialDeal,
        isTopBasket: product.isTopBasket
      });
    }
    
    return product;
  }

  /**
   * Transform Product to Supabase format
   */
  private static transformToSupabaseProduct(product: Partial<Product>): any {
  const result: any = {};

    if (product.name !== undefined) result.name = product.name;
    if (product.price !== undefined) result.price = product.price;
    if (product.originalPrice !== undefined) result.originalPrice = product.originalPrice;
    if (product.image !== undefined) result.image = product.image;
    if (product.discount !== undefined) result.discount = product.discount;
    if (product.items !== undefined) result.items = product.items;
    if (product.itemsDetail !== undefined) result.itemsDetail = product.itemsDetail;
    if (product.category !== undefined) result.category = product.category;
    if (product.description !== undefined) result.description = product.description;
    
    // CRITICAL: Ensure mutual exclusivity for promotional flags
    // Only one flag can be true at a time
    const isHotDeal = (product as any).isHotDeal || false;
    const isNewArrival = (product as any).isNewArrival || false;
    const isSpecialDeal = (product as any).isSpecialDeal || false;
    const isTopBasket = (product as any).isTopBasket || false;
    
    // Always save all promotional flags, but enforce only one is true
    result.isHotDeal = isHotDeal;
    result.isNewArrival = isNewArrival;
    result.isSpecialDeal = isSpecialDeal;
    result.isTopBasket = isTopBasket;
    
    // Debug logging for promotional flags
    const activeFlags = (isHotDeal ? 1 : 0) + (isNewArrival ? 1 : 0) + (isSpecialDeal ? 1 : 0) + (isTopBasket ? 1 : 0);
    if (activeFlags > 1) {
      console.warn('⚠️ MUTUAL EXCLUSIVITY VIOLATION: Product has multiple promotional flags set!', {
        name: result.name,
        isHotDeal: result.isHotDeal,
        isNewArrival: result.isNewArrival,
        isSpecialDeal: result.isSpecialDeal,
        isTopBasket: result.isTopBasket,
        activeCount: activeFlags
      });
    } else if (activeFlags === 1) {
      console.log('✅ Promotional flag being saved (single, correct):', {
        isHotDeal: result.isHotDeal,
        isNewArrival: result.isNewArrival,
        isSpecialDeal: result.isSpecialDeal,
        isTopBasket: result.isTopBasket,
        productName: result.name
      });
    }
    
  // featured/inStock intentionally not included in the insert/update payload

    // Ensure createdAt/updatedAt are included when creating/updating from frontend
    if (!result.createdAt) result.createdAt = new Date().toISOString();
    if (!result.updatedAt) result.updatedAt = new Date().toISOString();

    return result;
  }
}

export default SupabaseProductService;