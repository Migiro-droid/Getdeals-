import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import SupabaseProductService from '@/services/SupabaseProductService';
import { supabase } from '@/integrations/supabase/client';

type ProductsCtx = {
  all: Product[];
  add: (p: Omit<Product, "id">) => Promise<Product>;
  update: (id: string, patch: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  restoreDefaults: () => Promise<void>;
  version: number;
  featured: Product[];
  discounted: Product[];
  byCategory: (cat: string) => Product[];
};

const ProductsContext = createContext<ProductsCtx | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [all, setAll] = useState<Product[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    console.log('🚀 ProductsContext: Component mounted, loading products from Supabase...');
    loadProducts();
  }, []);

  useEffect(() => {
    console.log('🔄 ProductsContext: Setting up real-time subscription for products...');

    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('📡 ProductsContext: Real-time update received');
          // Refresh products when any change occurs
          loadProducts();
        }
      )
      .subscribe((status) => {
        console.log('📡 ProductsContext: Subscription status:', status);
      });

    return () => {
      console.log('🔄 ProductsContext: Cleaning up real-time subscription...');
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      console.log('🔄 ProductsContext: Fetching products directly from Supabase...');
      const products = await SupabaseProductService.getAllProducts();

      console.log(`✅ ProductsContext: Retrieved ${products.length} products from Supabase`);
      console.log('📊 ProductsContext: Products by category:');

      const categoryCount = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`   • ${category}: ${count} products`);
      });

      setAll(products);
    } catch (error) {
      console.error('❌ ProductsContext: Failed to load products from Supabase:', error);
      setAll([]);
    }
  }, []);

  const add: ProductsCtx["add"] = useCallback(async (p) => {
    try {
      console.log('🔄 ProductsContext: Adding product to Supabase...', p.name);
      const created = await SupabaseProductService.addProduct(p);

      if (!created) {
        throw new Error('Failed to create product - no response from Supabase');
      }

      console.log('✅ ProductsContext: Product added, refreshing list...');
      await loadProducts();
      setVersion((v) => v + 1);
      return created;
    } catch (error) {
      console.error('❌ ProductsContext: Failed to add product:', error);
      throw error;
    }
  }, [loadProducts]);

  const update: ProductsCtx["update"] = useCallback(async (id, patch) => {
    try {
      console.log('🔄 ProductsContext: Updating product in Supabase...', id);
      await SupabaseProductService.updateProduct(id, patch);

      console.log('✅ ProductsContext: Product updated, refreshing list...');
      await loadProducts();
      setVersion((v) => v + 1);
    } catch (error) {
      console.error('❌ ProductsContext: Failed to update product:', error);
      throw error;
    }
  }, [loadProducts]);

  const remove: ProductsCtx["remove"] = useCallback(async (id) => {
    try {
      console.log('🔄 ProductsContext: Deleting product from Supabase...', id);
      const success = await SupabaseProductService.deleteProduct(id);

      if (!success) {
        throw new Error('Failed to delete product from Supabase');
      }

      console.log('✅ ProductsContext: Product deleted, refreshing list...');
      await loadProducts();
      setVersion((v) => v + 1);
    } catch (error) {
      console.error('❌ ProductsContext: Failed to remove product:', error);
      throw error;
    }
  }, [loadProducts]);

  const restoreDefaults = useCallback(async () => {
    console.log('⚠️ ProductsContext: Restore defaults not implemented for Supabase');

    await loadProducts();
    setVersion((v) => v + 1);
  }, [loadProducts]);

  const featured = useMemo(() => all.slice(0, 3), [all]);
  const discounted = useMemo(() => all.filter((p) => p.originalPrice && p.originalPrice > p.price), [all]);
  const byCategory = useCallback((cat: string) => {
    const categoryProducts = all.filter((p) => p.category === cat);
    console.log(`📊 ProductsContext: byCategory('${cat}') returned ${categoryProducts.length} products`);
    return categoryProducts;
  }, [all]);

  const value: ProductsCtx = { all, add, update, remove, restoreDefaults, version, featured, discounted, byCategory };
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
};
