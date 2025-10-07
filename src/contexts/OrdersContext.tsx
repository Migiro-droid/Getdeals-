import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Status values must match database constraint: ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
  pickupLocation?: string;
}

export interface Order {
  id: string;
  date: string; // ISO
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: "pickup" | "speedy";
  paymentMethod: "mpesa" | "card" | "wallet" | "cash";
  customer: OrderCustomer;
  status: OrderStatus;
  note?: string;
  // Marks seeded demo orders so admin can clear them without affecting real ones
  demoSeed?: boolean;
}

interface OrdersContextValue {
  orders: Order[];
  createOrder: (o: Omit<Order, "id" | "date" | "status"> & { status?: OrderStatus }) => Order;
  updateStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  getById: (id: string) => Order | undefined;
  metrics: {
    totalRevenue: number;
    orderCount: number;
    byStatus: Record<OrderStatus, number>;
    todayCount: number;
  };
  clearAll: () => void; // admin only helper
  seedOrders: (sample: Order[], replace?: boolean) => void; // admin only helper
  clearDemoOrders: () => void; // remove only demoSeed orders
  hasDemoOrders: boolean;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

const LS_KEY = "getdeals_orders_v1";

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Order[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const createOrder: OrdersContextValue["createOrder"] = useCallback((o) => {
    const id = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order: Order = {
      id,
      date: new Date().toISOString(),
      status: o.status ?? "pending",
      ...o,
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  const updateStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const getById = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);

  const metrics = useMemo(() => {
    const byStatus: OrdersContextValue["metrics"]["byStatus"] = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    let totalRevenue = 0;
    const today = new Date().toISOString().slice(0, 10);
    let todayCount = 0;
    for (const o of orders) {
      byStatus[o.status]++;
      totalRevenue += o.total;
      if (o.date.slice(0, 10) === today) todayCount++;
    }
    return { byStatus, totalRevenue, orderCount: orders.length, todayCount };
  }, [orders]);

  const clearAll = useCallback(() => setOrders([]), []);

  const seedOrders = useCallback((sample: Order[], replace: boolean = false) => {
    setOrders((prev) => {
      const merged = replace ? sample : [...sample, ...prev];
      // sort by date desc
      merged.sort((a, b) => b.date.localeCompare(a.date));
      return merged;
    });
  }, []);

  const isDemoOrder = (o: Order) => {
    // Consider as demo if explicitly flagged, or matches legacy demo signatures
    const email = o.customer?.email || "";
    return (
      o.demoSeed === true ||
      o.id.startsWith("DEMO-") ||
      email.endsWith("@example.com")
    );
  };

  const clearDemoOrders = useCallback(() => {
    setOrders((prev) => prev.filter((o) => !isDemoOrder(o)));
  }, []);

  const hasDemoOrders = useMemo(() => orders.some((o) => isDemoOrder(o)), [orders]);

  const value: OrdersContextValue = {
    orders,
    createOrder,
    updateStatus,
  deleteOrder,
    getById,
    metrics,
  clearAll,
  seedOrders,
  clearDemoOrders,
  hasDemoOrders,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
};
