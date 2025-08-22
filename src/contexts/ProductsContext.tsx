import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { products as staticProducts } from "@/data/products";
import { getApiBase } from '@/lib/api';

type ProductsCtx = {
  all: Product[];
  add: (p: Omit<Product, "id">) => Promise<Product>;
  update: (id: string, patch: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  restoreDefaults: () => Promise<void>;
  version: number;
  // selectors
  featured: Product[];
  discounted: Product[];
  byCategory: (cat: string) => Product[];
};

const ProductsContext = createContext<ProductsCtx | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [all, setAll] = useState<Product[]>(staticProducts);
  const [version, setVersion] = useState(0);

  // API operations for real database management
  const api = {
    async list() {
      try {
        const baseUrl = getApiBase();
        const response = await fetch(`${baseUrl}/api/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
      } catch (error) {
        console.warn('API failed, using static products:', error);
        return [...staticProducts];
      }
    },
    async add(p: Omit<Product, "id">) {
      try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        if (!response.ok) throw new Error('Failed to create product');
        return await response.json();
      } catch (error) {
        console.error('Failed to add product:', error);
        throw error;
      }
    },
    async update(id: string, patch: Partial<Product>) {
      try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        if (!response.ok) throw new Error('Failed to update product');
        return await response.json();
      } catch (error) {
        console.error('Failed to update product:', error);
        throw error;
      }
    },
    async remove(id: string) {
      try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/products/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete product');
        return true;
      } catch (error) {
        console.error('Failed to delete product:', error);
        throw error;
      }
    },
    async reset() {
      try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/products/reset`, {
          method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to reset products');
        return true;
      } catch (error) {
        console.error('Failed to reset products:', error);
        throw error;
      }
    }
  };

  // Initial load - fetch products from API
  useEffect(() => {
    api.list().then(products => {
      setAll(products);
    }).catch(error => {
      console.warn('Failed to load products from API, using static data:', error);
      setAll([...staticProducts]);
    });
  }, []);

  const add: ProductsCtx["add"] = useCallback(async (p) => {
    const created = await api.add(p);
    setAll((prev) => [created, ...prev]);
    setVersion((v) => v + 1);
    return created;
  }, []);

  const update: ProductsCtx["update"] = useCallback(async (id, patch) => {
    try {
      const updated = await api.update(id, patch);
      setAll((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setVersion((v) => v + 1);
    } catch (error) {
      console.error('Failed to update product:', error);
      // Fallback to local update for better UX
      setAll((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      setVersion((v) => v + 1);
    }
  }, []);

  const remove: ProductsCtx["remove"] = useCallback(async (id) => {
    try {
      await api.remove(id);
      setAll((prev) => prev.filter((p) => p.id !== id));
      setVersion((v) => v + 1);
    } catch (error) {
      console.error('Failed to remove product:', error);
      // Fallback to local removal for better UX
      setAll((prev) => prev.filter((p) => p.id !== id));
      setVersion((v) => v + 1);
    }
  }, []);

  const restoreDefaults = useCallback(async () => {
    try {
      await api.reset();
      const products = await api.list();
      setAll(products);
      setVersion((v) => v + 1);
    } catch (error) {
      console.error('Failed to restore defaults:', error);
      setAll([...staticProducts]);
      setVersion((v) => v + 1);
    }
  }, []);

  const featured = useMemo(() => all.slice(0, 3), [all]);
  const discounted = useMemo(() => all.filter((p) => p.originalPrice && p.originalPrice > p.price), [all]);
  const byCategory = useCallback((cat: string) => all.filter((p) => p.category === cat), [all]);

  const value: ProductsCtx = { all, add, update, remove, restoreDefaults, version, featured, discounted, byCategory };
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
};
