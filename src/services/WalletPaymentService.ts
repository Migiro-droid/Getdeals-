import { supabase } from '../../lib/supabase';

export interface WalletPaymentRequest {
  amount: number;
  reference: string;
  phone: string;
  description?: string;
}

export interface WalletPaymentResponse {
  success: boolean;
  reference?: string;
  transaction_id?: string;
  rukisha_transaction_id?: string;
  phone?: string;
  amount?: number;
  message?: string;
  error?: string;
  status?: string;
  rukishaResponse?: any;
}

export class WalletPaymentService {
  static async initiatePayment(request: WalletPaymentRequest): Promise<WalletPaymentResponse> {
    try {
      console.log('💳 Initiating wallet-to-merchant payment:', request);

      const { data, error } = await supabase.functions.invoke('wallet-to-merchant-payment', {
        body: request
      });

      if (error) {
        console.error(' Supabase function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to process wallet payment'
        };
      }

      console.log(' Wallet-to-merchant payment response:', data);
      return data;

    } catch (error) {
      console.error(' Wallet payment service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async testDirectCall(request: WalletPaymentRequest): Promise<WalletPaymentResponse> {
    try {
      console.log(' Testing direct wallet payment call:', request);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required for wallet payment');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/wallet-payment`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      });

      const responseText = await response.text();
      console.log(' Direct wallet payment response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      return result;

    } catch (error) {
      console.error(' Direct wallet payment call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct wallet payment call failed'
      };
    }
  }
}