import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { products as staticProducts } from "@/data/products";

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
  const [all, setAll] = useState<Product[]>(staticProducts);
  const [version, setVersion] = useState(0);

  // For now, we'll use static data and simulate API operations
  const api = {
    async list() {
      return [...staticProducts];
    },
    async add(p: Omit<Product, "id">) {
      const newProduct: Product = {
        ...p,
        id: `product-${Date.now()}`,
      };
      return newProduct;
    },
    async update(id: string, patch: Partial<Product>) {
      // For static data, we'll just return the updated product
      const existing = staticProducts.find(p => p.id === id);
      if (!existing) throw new Error("Product not found");
      return { ...existing, ...patch };
    },
    async remove(id: string) {
      return true;
    },
    async reset() {
      return true;
    }
  };

  // Initial load - just use static data
  useEffect(() => {
    setAll([...staticProducts]);
  }, []);

  const add: ProductsCtx["add"] = useCallback(async (p) => {
    const created = await api.add(p);
    setAll((prev) => [created, ...prev]);
    setVersion((v) => v + 1);
    return created;
  }, []);

  const update: ProductsCtx["update"] = useCallback((id, patch) => {
    setAll((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setVersion((v) => v + 1);
  }, []);

  const remove: ProductsCtx["remove"] = useCallback((id) => {
    setAll((prev) => prev.filter((p) => p.id !== id));
    setVersion((v) => v + 1);
  }, []);

  const restoreDefaults = useCallback(() => {
    setAll([...staticProducts]);
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
