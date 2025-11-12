import { supabase } from '../../lib/supabase';

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
  getdeals_number?: string; // Friendly external wallet identifier (GD-XXXXXX)
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
  private async ensureWalletIdentifier(userId: string): Promise<string | null> {
    // Get wallet which has getdeals_number (should already exist - don't generate)
    const { data: wallet, error: walletErr } = await (supabase.from('wallets') as any)
      .select('getdeals_number')
      .eq('user_id', userId)
      .single();

    if (!walletErr && wallet?.getdeals_number) {
      return wallet.getdeals_number as string;
    }

    // If missing, log the issue but don't auto-generate
    // GetDeals numbers should be assigned at wallet creation time
    console.warn('[wallet] getdeals_number not found for user', userId);
    return null;
  }
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
        .select('id, balance, user_id, updated_at, getdeals_number, is_active, created_at')
        .eq('user_id', user.id)
        .single();
      
      console.log('[wallet-service] getWalletBalance - Full wallet data:', { data, error, userId: user.id });
      
      // If wallet row found, return it (including existing getdeals_number)
      if (data) {
        const walletData = data as any;
        console.log('[wallet-service] Wallet getdeals_number from DB:', walletData.getdeals_number);
        return {
          balance: walletData.balance,
          user_id: walletData.user_id,
          updated_at: walletData.updated_at,
          getdeals_number: walletData.getdeals_number // Explicitly preserve from DB
        } as WalletBalance;
      }

      // If wallet row missing entirely, attempt lazy creation
      if (error) {
        console.warn('Wallet row missing or error fetching wallet. Attempting lazy creation...', error?.message);
        return await this.createWalletIfMissing(user.id);
      }

      return null;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return null;
    }
  }

  /**
   * Create wallet row if it doesn't exist (lazy bootstrap)
   */
  private async createWalletIfMissing(userId: string): Promise<WalletBalance | null> {
    try {
      // FIRST: Double-check wallet doesn't already exist (prevents duplicates)
      const { data: existingWallet, error: checkError } = await supabase
        .from('wallets')
        .select('balance, user_id, updated_at, getdeals_number')
        .eq('user_id', userId)
        .single();

      if (existingWallet && !checkError) {
        const wallet = existingWallet as any;
        console.log('[wallet-service] Wallet already exists, returning existing:', wallet.getdeals_number);
        return existingWallet as WalletBalance;
      }

      console.log('[wallet-service] No wallet found, creating new one...');

      // Create wallet row if it doesn't exist (the trigger will auto-assign getdeals_number)
      const { data: newWallet, error: insertError } = await supabase
        .from('wallets')
        .insert([{ user_id: userId, balance: 0, is_active: false }] as any)
        .select('balance, user_id, updated_at, getdeals_number, is_active')
        .single<any>();

      if (insertError) {
        console.error('Failed to lazily create wallet row:', insertError);
        return null;
      }
      
      console.log('[wallet-service] New wallet created with getdeals_number:', newWallet.getdeals_number);
      return newWallet as WalletBalance;
    } catch (error) {
      console.error('Error creating wallet:', error);
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
        .eq('status', 'completed')
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
          event: '*', // capture INSERT + UPDATE to initialize newly created wallets
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const walletData = payload.new as any;
            
            // Ensure getdeals_number is preserved - never replace with undefined
            if (walletData.getdeals_number === undefined || walletData.getdeals_number === null) {
              console.warn('[wallet] Real-time update has null getdeals_number, refetching fresh data...');
              // If getdeals_number is missing in the update, refetch to ensure we have the correct one
              this.getWalletBalance().then(freshData => {
                if (freshData) callback(freshData);
              });
              return;
            }
            
            console.log('[wallet] Real-time wallet update:', walletData.getdeals_number);
            callback({
              balance: walletData.balance,
              user_id: walletData.user_id,
              updated_at: walletData.updated_at,
              getdeals_number: walletData.getdeals_number
            });
          }
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

  /**
   * Delete all pending transactions for the current user
   */
  async deletePendingTransactions(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('wallet_transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error deleting pending transactions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete pending transactions:', error);
      return false;
    }
  }

  /**
   * Delete all failed transactions for the current user
   */
  async deleteFailedTransactions(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('wallet_transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'failed');

      if (error) {
        console.error('Error deleting failed transactions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete failed transactions:', error);
      return false;
    }
  }

  /**
   * Clear all non-completed transactions (pending, failed, cancelled)
   */
  async clearIncompleteTransactions(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('wallet_transactions')
        .delete()
        .eq('user_id', user.id)
        .in('status', ['pending', 'failed', 'cancelled']);

      if (error) {
        console.error('Error clearing incomplete transactions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to clear incomplete transactions:', error);
      return false;
    }
  }
}

export const walletService = new WalletService();