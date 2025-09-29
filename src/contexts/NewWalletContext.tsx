import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { walletService, WalletTransaction, WalletBalance, DepositRequest, DepositResponse } from "../services/wallet-service";
import { supabase } from "../../lib/supabase";

export interface WalletContextType {
  // Data
  balance: number;
  walletData: WalletBalance | null;
  walletId?: string; // Alias to getdeals_number for UI display
  transactions: WalletTransaction[];
  pendingTransactions: WalletTransaction[];
  
  // Loading states
  loading: boolean;
  transactionsLoading: boolean;
  depositLoading: boolean;
  
  // Actions
  initiateDeposit: (request: DepositRequest) => Promise<DepositResponse>;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshPendingTransactions: () => Promise<void>;
  resetWalletData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletData, setWalletData] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);

  // Fetch wallet balance
  const refreshWallet = useCallback(async () => {
    try {
      const result = await walletService.getWalletBalance();
      setWalletData(result);
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch transaction history
  const refreshTransactions = useCallback(async () => {
    try {
      const result = await walletService.getTransactionHistory();
      setTransactions(result);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Fetch pending transactions
  const refreshPendingTransactions = useCallback(async () => {
    try {
      const result = await walletService.getPendingTransactions();
      setPendingTransactions(result);
    } catch (error) {
      console.error('Error refreshing pending transactions:', error);
      setPendingTransactions([]);
    }
  }, []);

  // Initialize wallet data when user signs in
  useEffect(() => {
    const initializeWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await refreshWallet();
        await refreshTransactions();
        await refreshPendingTransactions();
      } else {
        setWalletData(null);
        setTransactions([]);
        setPendingTransactions([]);
        setLoading(false);
        setTransactionsLoading(false);
      }
    };

    initializeWallet();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        refreshWallet();
        refreshTransactions();
        refreshPendingTransactions();
      } else if (event === 'SIGNED_OUT') {
        setWalletData(null);
        setTransactions([]);
        setPendingTransactions([]);
        setLoading(false);
        setTransactionsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshWallet, refreshTransactions, refreshPendingTransactions]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!walletData?.user_id) return;

    // Subscribe to wallet balance changes
    const walletSubscription = walletService.subscribeToWalletChanges(
      walletData.user_id,
      (updatedWallet) => {
        setWalletData(updatedWallet);
      }
    );

    // Subscribe to transaction changes
    const transactionSubscription = walletService.subscribeToTransactionChanges(
      walletData.user_id,
      (newTransaction) => {
        // Update transactions list
        setTransactions(prev => {
          const isCompleted = newTransaction.status === 'completed';
          const existingIndex = prev.findIndex(t => t.id === newTransaction.id);

          if (!isCompleted) {
            if (existingIndex === -1) return prev;
            const updated = [...prev];
            updated.splice(existingIndex, 1);
            return updated;
          }

          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = newTransaction;
            return updated;
          }

          return [newTransaction, ...prev].slice(0, 50);
        });

        // Update pending transactions list
        if (newTransaction.status === 'pending') {
          setPendingTransactions(prev => {
            const exists = prev.some(t => t.id === newTransaction.id);
            if (!exists) {
              return [newTransaction, ...prev];
            }
            return prev;
          });
        } else {
          // Remove from pending when status changes
          setPendingTransactions(prev => 
            prev.filter(t => t.id !== newTransaction.id)
          );
        }
      }
    );

    return () => {
      walletSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  }, [walletData?.user_id]);

  // Initiate deposit
  const initiateDeposit = async (request: DepositRequest): Promise<DepositResponse> => {
    setDepositLoading(true);
    try {
      const result = await walletService.initiateDeposit(request);
      
      if (result.success) {
        // Refresh pending transactions to show the new pending deposit
        await refreshPendingTransactions();
      }
      
      return result;
    } catch (error) {
      console.error('Deposit initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setDepositLoading(false);
    }
  };

  // Reset wallet data - permanently deletes incomplete transactions and clears local state
  const resetWalletData = useCallback(async () => {
    try {
      // Delete incomplete transactions from database
      const success = await walletService.clearIncompleteTransactions();
      
      if (success) {
        console.log('Successfully cleared incomplete transactions from database');
      } else {
        console.warn('Failed to clear transactions from database, clearing local state only');
      }
    } catch (error) {
      console.error('Error clearing transactions from database:', error);
    }
    
    // Clear local state regardless of database operation result
    setTransactions([]);
    setPendingTransactions([]);
    setWalletData(prevData => prevData ? { ...prevData, balance: 0 } : null);
  }, []);

  const value: WalletContextType = {
    balance: walletData?.balance || 0,
    walletData,
    walletId: walletData?.getdeals_number,
    transactions,
    pendingTransactions,
    
    loading,
    transactionsLoading,
    depositLoading,
    
    initiateDeposit,
    refreshWallet,
    refreshTransactions,
    refreshPendingTransactions,
    resetWalletData,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};