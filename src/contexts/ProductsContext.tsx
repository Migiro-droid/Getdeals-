import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { products as seedProducts, type Product } from "@/data/products";

type ProductsCtx = {
  all: Product[];
  add: (p: Omit<Product, "id">) => Product;
  update: (id: string, patch: Partial<Product>) => void;
  remove: (id: string) => void;
  restoreDefaults: () => void;
  // selectors
  featured: Product[];
  discounted: Product[];
  byCategory: (cat: string) => Product[];
};

const LS_KEY = "getdeals_products_overrides_v1";

type Store = {
  overrides: Record<string, Product>; // include add or replace by id
};

const ProductsContext = createContext<ProductsCtx | undefined>(undefined);

function mergeProducts(store: Store): Product[] {
  const map = new Map<string, Product>();
  for (const p of seedProducts) map.set(p.id, p);
  for (const id of Object.keys(store.overrides)) map.set(id, store.overrides[id]);
  return Array.from(map.values());
}

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Store) : { overrides: {} };
    } catch {
      return { overrides: {} };
    }
  });

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
  }, [store]);

  const all = useMemo(() => mergeProducts(store), [store]);

  const add: ProductsCtx["add"] = useCallback((p) => {
    const id = `${p.category}-${Date.now().toString(36)}`;
    const np: Product = { id, ...p } as Product;
    setStore((s) => ({ overrides: { ...s.overrides, [np.id]: np } }));
    return np;
  }, []);

  const update: ProductsCtx["update"] = useCallback((id, patch) => {
    setStore((s) => {
      const current = s.overrides[id] ?? seedProducts.find((p) => p.id === id);
      if (!current) return s;
      const next = { ...current, ...patch, id } as Product;
      return { overrides: { ...s.overrides, [id]: next } };
    });
  }, []);

  const remove: ProductsCtx["remove"] = useCallback((id) => {
    setStore((s) => {
      const next = { ...s.overrides };
      if (next[id]) delete next[id];
      else {
        // mark deletion by storing a tombstone with category "deleted" (optional)
        next[id] = { id, name: "(deleted)", price: 0, image: "", category: "deleted" } as Product;
      }
      return { overrides: next };
    });
  }, []);

  const restoreDefaults = useCallback(() => setStore({ overrides: {} }), []);

  const featured = useMemo(() => all.slice(0, 3), [all]);
  const discounted = useMemo(() => all.filter((p) => p.originalPrice && p.originalPrice > p.price), [all]);
  const byCategory = useCallback((cat: string) => all.filter((p) => p.category === cat), [all]);

  const value: ProductsCtx = { all, add, update, remove, restoreDefaults, featured, discounted, byCategory };
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
};
