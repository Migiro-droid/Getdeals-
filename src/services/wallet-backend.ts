import { supabase } from '../../lib/supabase';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  phone_number?: string;
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class WalletService {
  /**
   * Get user's wallet data
   */
  static async getWallet(): Promise<{ success: boolean; data?: WalletData; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: 'Please log in to access wallet' };
      }

      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return { success: false, error: 'Failed to load wallet data' };
      }

      return { success: true, data: wallet };
    } catch (error) {
      console.error('Wallet service error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get user's wallet transactions
   */
  static async getTransactions(limit = 50): Promise<{ success: boolean; data?: WalletTransaction[]; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: 'Please log in to access transactions' };
      }

      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return { success: false, error: 'Failed to load transaction history' };
      }

      return { success: true, data: transactions || [] };
    } catch (error) {
      console.error('Transaction service error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Create a new wallet for user (usually done automatically on signup)
   */
  static async createWallet(): Promise<{ success: boolean; data?: WalletData; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: 'Please log in to create wallet' };
      }

      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert({
          user_id: session.user.id,
          balance: 0,
          currency: 'KES',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating wallet:', error);
        return { success: false, error: 'Failed to create wallet' };
      }

      return { success: true, data: wallet };
    } catch (error) {
      console.error('Create wallet error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Record a withdrawal transaction (for local payments, etc.)
   */
  static async recordWithdrawal(
    amount: number, 
    description: string = 'Withdrawal'
  ): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: 'Please log in to make withdrawal' };
      }

      // Get wallet
      const walletResult = await this.getWallet();
      if (!walletResult.success || !walletResult.data) {
        return { success: false, error: 'Wallet not found' };
      }

      const wallet = walletResult.data;

      // Check sufficient balance
      if (wallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Create transaction record and update balance in a transaction
      const { data: transaction, error: transactionError } = await supabase.rpc('process_withdrawal', {
        p_user_id: session.user.id,
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_description: description
      });

      if (transactionError) {
        console.error('Error processing withdrawal:', transactionError);
        return { success: false, error: 'Failed to process withdrawal' };
      }

      return { success: true, transaction };
    } catch (error) {
      console.error('Withdrawal error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Subscribe to real-time wallet balance updates
   */
  static subscribeToWalletUpdates(userId: string, onUpdate: (wallet: WalletData) => void) {
    return supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate(payload.new as WalletData);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time transaction updates
   */
  static subscribeToTransactionUpdates(userId: string, onUpdate: (transaction: WalletTransaction) => void) {
    return supabase
      .channel('transaction-updates')
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
            onUpdate(payload.new as WalletTransaction);
          }
        }
      )
      .subscribe();
  }
}

// SQL function for atomic withdrawal processing
export const WITHDRAWAL_FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_user_id UUID,
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Withdrawal'
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  wallet_id UUID,
  type TEXT,
  amount NUMERIC,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  transaction_record RECORD;
BEGIN
  -- Check wallet balance and update in one operation
  UPDATE public.wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE wallets.id = p_wallet_id 
    AND wallets.user_id = p_user_id 
    AND balance >= p_amount;
  
  -- Check if update affected any rows (balance was sufficient)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or wallet not found';
  END IF;
  
  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    user_id, wallet_id, type, amount, status, description, completed_at
  )
  VALUES (
    p_user_id, p_wallet_id, 'withdrawal', p_amount, 'completed', p_description, NOW()
  )
  RETURNING * INTO transaction_record;
  
  -- Return the transaction record
  RETURN QUERY
  SELECT 
    transaction_record.id,
    transaction_record.user_id,
    transaction_record.wallet_id,
    transaction_record.type,
    transaction_record.amount,
    transaction_record.status,
    transaction_record.description,
    transaction_record.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;