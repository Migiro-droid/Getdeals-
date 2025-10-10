import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useOrders } from "./OrdersContext";

interface OrderNotificationContextValue {
  hasNewOrders: boolean;
  newOrdersCount: number;
  acknowledgeOrders: () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextValue | undefined>(undefined);

const LS_KEY = "getdeals_last_viewed_orders";

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { orders } = useOrders();
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
    } catch {
      return Date.now();
    }
  });

  // Calculate new orders (orders created after last viewed timestamp)
  const newOrders = orders.filter(order => {
    const orderTime = new Date(order.date).getTime();
    return orderTime > lastViewedTimestamp;
  });

  const hasNewOrders = newOrders.length > 0;
  const newOrdersCount = newOrders.length;

  // Function to acknowledge/mark orders as viewed
  const acknowledgeOrders = useCallback(() => {
    const now = Date.now();
    setLastViewedTimestamp(now);
    try {
      localStorage.setItem(LS_KEY, now.toString());
    } catch (error) {
      console.error("Failed to save last viewed timestamp:", error);
    }
  }, []);

  // Save to localStorage whenever timestamp changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, lastViewedTimestamp.toString());
    } catch (error) {
      console.error("Failed to save last viewed timestamp:", error);
    }
  }, [lastViewedTimestamp]);

  const value: OrderNotificationContextValue = {
    hasNewOrders,
    newOrdersCount,
    acknowledgeOrders,
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error("useOrderNotification must be used within OrderNotificationProvider");
  }
  return context;
};
