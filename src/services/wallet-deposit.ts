import { supabase } from '../../lib/supabase';

export interface DepositRequest {
  amount: number;
  phone: string;
}

export interface DepositResponse {
  success: boolean;
  transaction_id?: string;
  amount?: number;
  phone?: string;
  message?: string;
  transaction_record_id?: string;
  error?: string;
}

export class WalletDepositService {
  /**
   * Initiate a deposit using Rukisha STK Push
   */
  static async initiateDeposit(data: DepositRequest): Promise<DepositResponse> {
    try {
      // Validate amount
      if (data.amount < 100) {
        return { success: false, error: 'Minimum deposit amount is KES 100' };
      }

      if (data.amount > 100000) {
        return { success: false, error: 'Maximum deposit amount is KES 100,000' };
      }

      // Validate phone number format
      const phoneRegex = /^(\+254|0)[7-9]\d{8}$/;
      if (!phoneRegex.test(data.phone)) {
        return { success: false, error: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' };
      }

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: 'Please log in to make a deposit' };
      }

      console.log('🚀 Initiating deposit with full details:', { 
        amount: data.amount, 
        phone: data.phone.slice(0, -4) + '****',
        sessionExists: !!session,
        accessToken: session.access_token ? 'Present' : 'Missing'
      });

      console.log('📤 About to call deposit-funds edge function...');
      
      // Call the deposit-funds edge function
      const { data: result, error } = await supabase.functions.invoke('deposit-funds', {
        body: {
          amount: data.amount,
          phone: data.phone
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📡 Edge function complete response:', { 
        result, 
        error,
        resultType: typeof result,
        errorType: typeof error,
        hasResult: !!result,
        hasError: !!error
      });

      if (error) {
        console.error('❌ Error calling deposit-funds function - DETAILED:', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorContext: error.context,
          errorName: error.name,
          fullErrorObject: JSON.stringify(error, null, 2)
        });
        
        // Handle specific error types with detailed messages
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          return { 
            success: false, 
            error: `Deposit service not found. The payment service may not be deployed. Technical: ${error.message}` 
          };
        }
        
        if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
          return { 
            success: false, 
            error: `Authentication failed. Please log out and log back in. Technical: ${error.message}` 
          };
        }
        
        if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
          return { 
            success: false, 
            error: `Network connection failed. Please check your internet connection. Technical: ${error.message}` 
          };
        }
        
        if (error.message?.includes('timeout')) {
          return { 
            success: false, 
            error: `Request timed out. Please try again. Technical: ${error.message}` 
          };
        }

        return { 
          success: false, 
          error: `Deposit service error: ${error.message || JSON.stringify(error)}. Please contact support if this persists.`
        };
      }

      if (!result) {
        console.error('No result from deposit-funds function');
        return { success: false, error: 'No response from deposit service' };
      }

      if (!result.success) {
        console.error('Deposit function returned error:', result.error || result);
        
        // Handle specific error messages from the edge function
        if (result.error?.includes('KYC')) {
          return { success: false, error: 'Please complete KYC verification first.' };
        }
        
        if (result.error?.includes('customer_id')) {
          return { success: false, error: 'Wallet not properly activated. Please contact support.' };
        }

        if (result.error?.includes('minimum')) {
          return { success: false, error: result.error };
        }

        if (result.error?.includes('not configured')) {
          return { success: false, error: 'Payment service temporarily unavailable. Please try again later.' };
        }

        return { 
          success: false, 
          error: result.error || result.message || 'Unable to process deposit request'
        };
      }

      console.log('✅ Deposit initiated successfully:', result.transaction_id);

      return {
        success: true,
        transaction_id: result.transaction_id,
        amount: result.amount,
        phone: result.phone,
        message: result.message || 'STK Push sent successfully',
        transaction_record_id: result.transaction_record_id
      };

    } catch (error) {
      console.error('Error in deposit service:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: 'Network connection failed. Please check your internet connection.' };
      }

      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Get user's transaction history
   */
  static async getTransactionHistory(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return { success: false, error: 'Failed to fetch transaction history' };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Error in getTransactionHistory:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get user's current wallet balance
   */
  static async getWalletBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet balance:', error);
        return { success: false, error: 'Failed to fetch wallet balance' };
      }

      if (!data) {
        return { success: false, error: 'Wallet not found' };
      }

      return { success: true, balance: Number((data as any).balance || 0) };

    } catch (error) {
      console.error('Error in getWalletBalance:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
}

// DEBUG: marker to help identify the WalletDepositService in built bundles
(WalletDepositService as any).__debugMarker = 'WalletDepositService::v1';