import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";

type ProductsCtx = {
  all: Product[];
  add: (p: Omit<Product, "id">) => Promise<Product>;
  update: (id: string, patch: Partial<Product>) => void;
  remove: (id: string) => void;
  restoreDefaults: () => void;
  version: number;
  // selectors
  featured: Product[];
  discounted: Product[];
  byCategory: (cat: string) => Product[];
};

const ProductsContext = createContext<ProductsCtx | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [all, setAll] = useState<Product[]>([]);
  const [version, setVersion] = useState(0);
  const api = {
    async list() {
      // Try Vercel API first, fallback to localhost for development
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : "http://localhost:4000";
      const r = await fetch(`${baseUrl}/api/products`);
      const text = await r.text();
      if (!r.ok) {
        let msg = text;
        try { const j = JSON.parse(text); msg = j.message || JSON.stringify(j); } catch (e) {}
        throw new Error(`Failed to fetch products: ${r.status} ${r.statusText} - ${msg}`);
      }
      return JSON.parse(text) as Product[];
    },
    async add(p: Omit<Product, "id">) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : "http://localhost:4000";
      const r = await fetch(`${baseUrl}/api/products`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(p) 
      });
      const text = await r.text();
      if (!r.ok) {
        let msg = text;
        try { const j = JSON.parse(text); msg = j.message || JSON.stringify(j); } catch (e) {}
        throw new Error(`Failed to add product: ${r.status} ${r.statusText} - ${msg}`);
      }
      return JSON.parse(text) as Product;
    },
    async update(id: string, patch: Partial<Product>) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : "http://localhost:4000";
        
      const r = await fetch(`${baseUrl}/api/products/${id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(patch) 
      });
      if (!r.ok) throw new Error("Failed to update product");
      return (await r.json()) as Product;
    },
    async remove(id: string) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : "http://localhost:4000";
        
      const r = await fetch(`${baseUrl}/api/products/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete product");
      return true;
    },
    async reset() {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : "http://localhost:4000";
        
      const r = await fetch(`${baseUrl}/api/products/reset`, { method: "POST" });
      if (!r.ok) throw new Error("Failed to reset products");
      return true;
    }
  };

  // initial fetch
  useEffect(() => {
    api.list()
      .then(setAll)
      .catch(() => setAll([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add: ProductsCtx["add"] = useCallback(async (p) => {
    // perform add and return the created product, re-fetch list to stay in sync
    const created = await api.add(p);
    const latest = await api.list();
    setAll(latest);
    setVersion((v) => v + 1);
    return created;
  }, []);

  const update: ProductsCtx["update"] = useCallback((id, patch) => {
    setAll((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  setVersion((v) => v + 1);
    api.update(id, patch).catch((e) => {
      console.error(e);
      // on failure, refetch to sync
      api.list().then(setAll).catch(console.error);
    });
  }, []);

  const remove: ProductsCtx["remove"] = useCallback((id) => {
    setAll((prev) => prev.filter((p) => p.id !== id));
  setVersion((v) => v + 1);
    api.remove(id).catch((e) => {
      console.error(e);
      api.list().then(setAll).catch(console.error);
    });
  }, []);

  const restoreDefaults = useCallback(() => {
    api.reset()
      .then(() => api.list().then(setAll))
      .catch(console.error);
  setVersion((v) => v + 1);
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
