import React, { createContext, useContext, useEffect, useState } from "react";
import { products } from "@/data/products";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  lowStockThreshold: number;
  lastRestocked?: string;
  supplier?: string;
}

interface InventoryContextValue {
  inventory: InventoryItem[];
  updateStock: (id: string, newStock: number) => void;
  restockItem: (id: string, quantity: number) => void;
  getInStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  getLowStockItems: () => InventoryItem[];
  getTotalValue: () => number;
  seedInventory: () => void;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

const LS_INVENTORY = "getdeals_inventory_v1";

// Generate random stock levels for demo purposes
const generateRandomStock = () => Math.floor(Math.random() * 150) + 1; // 1-150
const generateLowStockThreshold = () => Math.floor(Math.random() * 20) + 5; // 5-25

const suppliers = [
  "Kenya Cereals Ltd",
  "East Africa Distributors", 
  "Nairobi Wholesale Co",
  "Farmers Choice Ltd",
  "Metro Suppliers",
  "Valley Foods",
  "Coast Provisions"
];

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_INVENTORY);
      if (raw) {
        return JSON.parse(raw) as InventoryItem[];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_INVENTORY, JSON.stringify(inventory));
    } catch {}
  }, [inventory]);

  const seedInventory = () => {
    const inventoryItems: InventoryItem[] = products.map((product) => {
      const stock = generateRandomStock();
      const lowStockThreshold = generateLowStockThreshold();
      // Some items should be out of stock for demo
      const finalStock = Math.random() < 0.15 ? 0 : stock; // 15% chance out of stock
      
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        stock: finalStock,
        lowStockThreshold,
        lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)]
      };
    });
    
    setInventory(inventoryItems);
  };

  const updateStock = (id: string, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, stock: Math.max(0, newStock) } : item
    ));
  };

  const restockItem = (id: string, quantity: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        stock: item.stock + quantity,
        lastRestocked: new Date().toISOString()
      } : item
    ));
  };

  const getInStockItems = () => inventory.filter(item => item.stock > 0);
  const getOutOfStockItems = () => inventory.filter(item => item.stock === 0);
  const getLowStockItems = () => inventory.filter(item => item.stock > 0 && item.stock <= item.lowStockThreshold);
  
  const getTotalValue = () => inventory.reduce((total, item) => total + (item.stock * item.price), 0);

  const value: InventoryContextValue = {
    inventory,
    updateStock,
    restockItem,
    getInStockItems,
    getOutOfStockItems,
    getLowStockItems,
    getTotalValue,
    seedInventory
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
};
