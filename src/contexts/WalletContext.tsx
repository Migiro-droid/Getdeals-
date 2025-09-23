import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WalletService, WalletData, WalletTransaction } from "../services/wallet-backend";
import { supabase } from "../../lib/supabase";

export interface WalletContextType {
  // Data
  balance: number;
  walletId: string;
  wallet: WalletData | null;
  transactions: WalletTransaction[];
  
  // Loading states
  loading: boolean;
  transactionsLoading: boolean;
  
  // Actions
  withdraw: (amount: number, note?: string) => Promise<{ ok: boolean; error?: string }>;
  deposit: (amount: number) => Promise<{ ok: boolean; error?: string }>;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Fetch wallet data
  const refreshWallet = useCallback(async () => {
    try {
      const result = await WalletService.getWallet();
      if (result.success && result.data) {
        setWallet(result.data);
      } else {
        console.error('Failed to load wallet:', result.error);
        if (result.error?.includes('not found')) {
          const createResult = await WalletService.createWallet();
          if (createResult.success && createResult.data) {
            setWallet(createResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      const result = await WalletService.getTransactions();
      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        console.error('Failed to load transactions:', result.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await refreshWallet();
        await refreshTransactions();
      } else {
        setWallet(null);
        setTransactions([]);
        setLoading(false);
        setTransactionsLoading(false);
      }
    };

    initializeWallet();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        refreshWallet();
        refreshTransactions();
      } else if (event === 'SIGNED_OUT') {
        setWallet(null);
        setTransactions([]);
        setLoading(false);
        setTransactionsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshWallet, refreshTransactions]);

  useEffect(() => {
    if (!wallet?.user_id) return;

    const walletSubscription = WalletService.subscribeToWalletUpdates(
      wallet.user_id,
      (updatedWallet) => {
        setWallet(updatedWallet);
      }
    );

    const transactionSubscription = WalletService.subscribeToTransactionUpdates(
      wallet.user_id,
      (newTransaction) => {
        setTransactions(prev => {
          const exists = prev.some(t => t.id === newTransaction.id);
          if (exists) {
            return prev.map(t => t.id === newTransaction.id ? newTransaction : t);
          } else {
            return [newTransaction, ...prev];
          }
        });
      }
    );

    return () => {
      walletSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  }, [wallet?.user_id]);

  const withdraw = async (amount: number, note?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: "Amount must be positive" };
      }

      if (!wallet || wallet.balance < amount) {
        return { ok: false, error: "Insufficient balance" };
      }

      const result = await WalletService.recordWithdrawal(amount, note || 'Withdrawal');
      
      if (result.success) {
        await refreshWallet();
        await refreshTransactions();
        return { ok: true };
      } else {
        return { ok: false, error: result.error || 'Withdrawal failed' };
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      return { ok: false, error: 'Network error' };
    }
  };

  // Note: This deposit function is a placeholder for compatibility.
  // The actual deposit logic is handled in WalletPage through WalletDepositService
  const deposit = async (amount: number): Promise<{ ok: boolean; error?: string }> => {
    return { ok: false, error: "Use the deposit button in the wallet interface instead" };
  };

  const value: WalletContextType = {
    balance: wallet?.balance || 0,
    walletId: wallet?.id || 'Loading...',
    wallet,
    transactions,
    
    loading,
    transactionsLoading,
    
    withdraw,
    deposit,
    refreshWallet,
    refreshTransactions,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};