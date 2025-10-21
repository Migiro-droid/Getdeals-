import React, { createContext, useContext, useEffect, useState } from "react";
import { useProducts } from "@/contexts/ProductsContext";
import { SupabaseInventoryService, InventoryItem as SupabaseInventoryItem } from "@/services/SupabaseInventoryService";

export interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  reservedQuantity?: number;
  lowStockThreshold: number;
  lastRestocked?: string;
  supplier?: string;
  costPrice?: number;
  location?: string;
  reorderLevel?: number;
  reorderQuantity?: number;
  // Marks items that were created by the demo seeder so we can safely undo
  demoSeed?: boolean;
}

interface InventoryContextValue {
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  updateStock: (id: string, newStock: number) => Promise<void>;
  restockItem: (id: string, quantity: number) => Promise<void>;
  getInStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  getLowStockItems: () => InventoryItem[];
  getTotalValue: () => number;
  // Toggles demo inventory: load if not loaded; clear if already loaded
  seedInventory: () => void;
  isInventorySeeded: boolean;
  clearDemoInventory: () => void;
  hasDemoInventory: boolean;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { all: products } = useProducts();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert products to inventory items
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!products || products.length === 0) {
        console.log('⚠️ InventoryContext: No products available from ProductsContext');
        setError('No products found');
        setIsLoading(false);
        return;
      }

      console.log(`📦 InventoryContext: Converting ${products.length} products to inventory items...`);
      
      // Transform products to inventory items
      const inventoryItems: InventoryItem[] = products.map((product: any) => ({
        id: `inv-${product.id}`,
        productId: product.id,
        name: product.name,
        category: product.category || 'Uncategorized',
        price: product.price || 0,
        image: product.image || '/placeholder.svg',
        stock: 50, // Default stock level
        reservedQuantity: 0,
        lowStockThreshold: 10,
        lastRestocked: null,
        supplier: 'Main Supplier',
        costPrice: (product.price || 0) * 0.6,
        location: 'Main Warehouse',
        reorderLevel: 10,
        reorderQuantity: 100,
        demoSeed: false,
      }));

      console.log(`✅ InventoryContext: Created ${inventoryItems.length} inventory items from products`);
      setInventory(inventoryItems);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process inventory';
      console.error('❌ InventoryContext: Error processing inventory:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [products]);

  const isInventorySeeded = false; // No more demo seeding
  const isDemoInventoryItem = (it: InventoryItem) => false; // No more demo items
  const hasDemoInventory = false; // No more demo inventory

  const seedInventory = () => {
    console.log('ℹ️ InventoryContext: Demo seeding is disabled - inventory is fetched from database');
  };

  const clearDemoInventory = () => {
    console.log('ℹ️ InventoryContext: Clear demo is disabled - inventory is managed in database');
  };

  const updateStock = async (id: string, newStock: number) => {
    // Optimistic update
    const updatedInventory = inventory.map(item => 
      item.id === id ? { ...item, stock: Math.max(0, newStock) } : item
    );
    setInventory(updatedInventory);

    // Update in database
    const success = await SupabaseInventoryService.updateStock(id, newStock);
    if (!success) {
      console.error('Failed to update stock in database');
    }
  };

  const restockItem = async (id: string, quantity: number) => {
    // Optimistic update
    const updatedInventory = inventory.map(item => 
      item.id === id ? { 
        ...item, 
        stock: item.stock + quantity,
        lastRestocked: new Date().toISOString()
      } : item
    );
    setInventory(updatedInventory);

    // Update in database
    const success = await SupabaseInventoryService.restockItem(id, quantity);
    if (!success) {
      console.error('Failed to restock item in database');
    }
  };

  const getInStockItems = () => inventory.filter(item => item.stock > 0);
  const getOutOfStockItems = () => inventory.filter(item => item.stock === 0);
  const getLowStockItems = () => inventory.filter(item => item.stock > 0 && item.stock <= item.lowStockThreshold);
  
  const getTotalValue = () => inventory.reduce((total, item) => total + (item.stock * item.price), 0);

  const value: InventoryContextValue = {
    inventory,
    isLoading,
    error,
    updateStock,
    restockItem,
    getInStockItems,
    getOutOfStockItems,
    getLowStockItems,
    getTotalValue,
    seedInventory,
    isInventorySeeded,
    clearDemoInventory,
    hasDemoInventory,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
};
