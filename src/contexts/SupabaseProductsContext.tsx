import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_url: string;
  discount?: number;
  items?: string[];
  items_detail?: { name: string; image: string }[];
  category: string;
  description?: string;
  is_basket?: boolean;
  stock_quantity?: number;
  basket_items?: any;
  category_id?: string;
  created_at?: string;
  updated_at?: string;
}

type SupabaseProductsCtx = {
  all: Product[];
  loading: boolean;
  add: (p: Omit<Product, "id" | "created_at" | "updated_at">) => Promise<Product>;
  update: (id: string, patch: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  version: number;
  // selectors
  featured: Product[];
  discounted: Product[];
  byCategory: (cat: string) => Product[];
};

const SupabaseProductsContext = createContext<SupabaseProductsCtx | undefined>(undefined);

export const SupabaseProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [version, setVersion] = useState(0);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setAll(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const add: SupabaseProductsCtx["add"] = useCallback(async (productData) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productData.name,
          price: productData.price,
          original_price: productData.original_price,
          image_url: productData.image_url,
          category: productData.category,
          description: productData.description,
          items: productData.items,
          items_detail: productData.items_detail,
          is_basket: productData.is_basket || false,
          stock_quantity: productData.stock_quantity || 0,
          basket_items: productData.basket_items
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      const data = await response.json();
      setAll((prev) => [data, ...prev]);
      setVersion((v) => v + 1);

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const update: SupabaseProductsCtx["update"] = useCallback(async (id, patch) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      setAll((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      setVersion((v) => v + 1);

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const remove: SupabaseProductsCtx["remove"] = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setAll((prev) => prev.filter((p) => p.id !== id));
      setVersion((v) => v + 1);

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const refresh = useCallback(async () => {
    await fetchProducts();
    setVersion((v) => v + 1);
  }, [fetchProducts]);

  const featured = useMemo(() => all.slice(0, 3), [all]);
  const discounted = useMemo(() => all.filter((p) => p.original_price && p.original_price > p.price), [all]);
  const byCategory = useCallback((cat: string) => all.filter((p) => p.category === cat), [all]);

  const value: SupabaseProductsCtx = { 
    all, 
    loading, 
    add, 
    update, 
    remove, 
    refresh, 
    version, 
    featured, 
    discounted, 
    byCategory 
  };
  
  return <SupabaseProductsContext.Provider value={value}>{children}</SupabaseProductsContext.Provider>;
};

export const useSupabaseProducts = () => {
  const ctx = useContext(SupabaseProductsContext);
  if (!ctx) throw new Error("useSupabaseProducts must be used within SupabaseProductsProvider");
  return ctx;
};