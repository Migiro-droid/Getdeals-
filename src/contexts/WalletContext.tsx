import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

type TxType = "deposit" | "withdraw" | "payment";
export interface WalletTransaction {
  id: string;
  type: TxType;
  amount: number; 
  date: string;
  note?: string;
}

interface WalletContextType {
  balance: number;
  walletId: string;
  transactions: WalletTransaction[];
  deposit: (amount: number, note?: string) => { ok: boolean; error?: string };
  withdraw: (
    amount: number,
    note?: string,
    type?: Exclude<TxType, "deposit">
  ) => { ok: boolean; error?: string };
  reset: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("wallet.balance");
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const raw = localStorage.getItem("wallet.transactions");
      return raw ? (JSON.parse(raw) as WalletTransaction[]) : [];
    } catch {
      return [];
    }
  });
  const [walletId, setWalletId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem("wallet.id");
      if (existing) return existing;
      const id = `WAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now()
        .toString()
        .slice(-4)}`;
      localStorage.setItem("wallet.id", id);
      return id;
    } catch {
      return `WAL-${Date.now()}`;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("wallet.balance", String(balance));
    } catch {}
  }, [balance]);

  useEffect(() => {
    try {
      localStorage.setItem("wallet.transactions", JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  const addTx = (tx: Omit<WalletTransaction, "id" | "date"> & { date?: string }) => {
    const full: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: tx.date || new Date().toISOString(),
      type: tx.type,
      amount: tx.amount,
      note: tx.note,
    };
    setTransactions((prev) => [full, ...prev]);
  };

  const deposit = (amount: number, note?: string) => {
    if (!Number.isFinite(amount) || amount <= 0)
      
      return { ok: false, error: "Amount must be positive" };
    setBalance((b) => b + amount);
    addTx({ type: "deposit", amount, note });
    return { ok: true };
  };

  const withdraw = (
    amount: number,
    note?: string,
    type: Exclude<TxType, "deposit"> = "withdraw"
  ) => {
    if (!Number.isFinite(amount) || amount <= 0)
      return { ok: false, error: "Amount must be positive" };
    if (amount > balance) return { ok: false, error: "Insufficient balance" };
    setBalance((b) => b - amount);
    addTx({ type, amount, note });
    return { ok: true };
  };

  const reset = () => {
    setBalance(0);
    setTransactions([]);
    try {
      localStorage.removeItem("wallet.balance");
      localStorage.removeItem("wallet.transactions");
    } catch {}
  };

  const value = useMemo(
    () => ({ balance, walletId, transactions, deposit, withdraw, reset }),
    [balance, walletId, transactions]
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};
