import { supabase } from './supabase';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  reference?: string;
  phone_number?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface WalletBalance {
  balance: number;
  user_id: string;
  updated_at: string;
}

export interface DepositRequest {
  amount: number;
  phone: string;
}

export interface DepositResponse {
  success: boolean;
  transaction_id?: string;
  reference?: string;
  message?: string;
  error?: string;
  transaction_record_id?: string;
}

class WalletService {
  /**
   * Initiate a deposit to the user's wallet
   */
  async initiateDeposit(request: DepositRequest): Promise<DepositResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('deposit-funds', {
        body: {
          amount: request.amount,
          phone: request.phone
        }
      });

      if (error) {
        console.error('Deposit function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to initiate deposit'
        };
      }

      return data;
    } catch (error) {
      console.error('Deposit request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's current wallet balance
   */
  async getWalletBalance(): Promise<WalletBalance | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('wallets')
        .select('balance, user_id, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet balance:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return null;
    }
  }

  /**
   * Get user's wallet transaction history
   */
  async getTransactionHistory(limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Get a specific transaction by reference
   */
  async getTransactionByReference(reference: string): Promise<WalletTransaction | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('reference', reference)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching transaction by reference:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get transaction by reference:', error);
      return null;
    }
  }

  /**
   * Get pending transactions (useful for checking deposit status)
   */
  async getPendingTransactions(): Promise<WalletTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get pending transactions:', error);
      return [];
    }
  }

  /**
   * Subscribe to wallet balance changes
   */
  subscribeToWalletChanges(userId: string, callback: (balance: WalletBalance) => void) {
    return supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as WalletBalance);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to transaction changes
   */
  subscribeToTransactionChanges(userId: string, callback: (transaction: WalletTransaction) => void) {
    return supabase
      .channel('transaction_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as WalletTransaction);
          }
        }
      )
      .subscribe();
  }

  /**
   * Refresh wallet balance (useful after deposits)
   */
  async refreshWalletBalance(): Promise<WalletBalance | null> {
    // Simply fetch the latest balance
    return this.getWalletBalance();
  }
}

export const walletService = new WalletService();