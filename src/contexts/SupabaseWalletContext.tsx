import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "./SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

interface WalletTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "payment";
  amount: number;
  description?: string;
  created_at: string;
  wallet_id?: string;
}

type SupabaseWalletContextType = {
  balance: number;
  transactions: WalletTransaction[];
  loading: boolean;
  deposit: (amount: number, description?: string) => Promise<{ ok: boolean; error?: string }>;
  withdraw: (amount: number, description?: string) => Promise<{ ok: boolean; error?: string }>;
  refreshWallet: () => Promise<void>;
};

const SupabaseWalletContext = createContext<SupabaseWalletContextType | undefined>(undefined);

export const SupabaseWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchWallet = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get or create wallet
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code === 'PGRST116') {
        // Wallet doesn't exist, create it
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([{ user_id: user.id, balance: 0 }])
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      } else if (walletError) {
        throw walletError;
      }

      setBalance(Number(wallet.balance) || 0);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      setTransactions((transactionsData as WalletTransaction[]) || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, toast]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const deposit = useCallback(async (amount: number, description?: string): Promise<{ ok: boolean; error?: string }> => {
    if (!user || amount <= 0) {
      return { ok: false, error: "Invalid deposit amount" };
    }

    try {
      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      const newBalance = Number(wallet.balance) + amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Add transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert([{
          wallet_id: wallet.id,
          type: 'deposit',
          amount,
          description: description || 'Wallet top-up'
        }]);

      if (transactionError) throw transactionError;

      await fetchWallet(); // Refresh wallet data
      return { ok: true };
    } catch (error) {
      console.error('Error depositing to wallet:', error);
      return { ok: false, error: "Failed to deposit funds" };
    }
  }, [user, fetchWallet]);

  const withdraw = useCallback(async (amount: number, description?: string): Promise<{ ok: boolean; error?: string }> => {
    if (!user || amount <= 0) {
      return { ok: false, error: "Invalid withdrawal amount" };
    }

    if (amount > balance) {
      return { ok: false, error: "Insufficient balance" };
    }

    try {
      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      const newBalance = Number(wallet.balance) - amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Add transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert([{
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount,
          description: description || 'Wallet withdrawal'
        }]);

      if (transactionError) throw transactionError;

      await fetchWallet(); // Refresh wallet data
      return { ok: true };
    } catch (error) {
      console.error('Error withdrawing from wallet:', error);
      return { ok: false, error: "Failed to withdraw funds" };
    }
  }, [user, balance, fetchWallet]);

  const refreshWallet = useCallback(async () => {
    await fetchWallet();
  }, [fetchWallet]);

  const value: SupabaseWalletContextType = {
    balance,
    transactions,
    loading,
    deposit,
    withdraw,
    refreshWallet,
  };

  return (
    <SupabaseWalletContext.Provider value={value}>
      {children}
    </SupabaseWalletContext.Provider>
  );
};

export const useSupabaseWallet = () => {
  const ctx = useContext(SupabaseWalletContext);
  if (!ctx) throw new Error("useSupabaseWallet must be used within SupabaseWalletProvider");
  return ctx;
};