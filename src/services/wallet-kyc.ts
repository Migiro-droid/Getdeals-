import { supabase } from '../../lib/supabase';
import { WalletKycSubmission, WalletKycData } from '../types/wallet-kyc';

export class WalletKycService {
  /**
   * Submit KYC data for wallet activation
   */
  static async submitKyc(data: WalletKycSubmission): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User authentication required' };
      }

      // Check if user already has KYC data
      const { data: existingKyc, error: checkError } = await supabase
        .from('wallet_kyc')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing KYC:', checkError);
        return { success: false, error: 'Database error while checking existing KYC' };
      }

      if (existingKyc) {
        if (existingKyc.status === 'verified') {
          return { success: false, error: 'KYC already verified for this user' };
        } else if (existingKyc.status === 'pending_verification') {
          return { success: false, error: 'KYC submission already pending verification' };
        }
      }

      // First, save KYC data to database with verified status for immediate wallet access
      const kycData = {
        user_id: user.id,
        full_name: data.fullName,
        id_number: data.idNumber,
        phone_number: data.phoneNumber,
        email: data.email,
        kra_pin: data.kraPin.toUpperCase(),
        id_type: data.idType,
        status: 'verified', // Auto-verify for immediate wallet access
        verified_at: new Date().toISOString()
      };

      // Insert or update KYC data
      const { data: result, error } = existingKyc
        ? await supabase
            .from('wallet_kyc')
            .update(kycData)
            .eq('user_id', user.id)
            .select()
            .single()
        : await supabase
            .from('wallet_kyc')
            .insert(kycData)
            .select()
            .single();

      if (error) {
        console.error('Error saving KYC data:', error);
        return { success: false, error: 'Failed to save KYC data' };
      }

      // DEVELOPMENT MODE: Simulate Rukisha integration for testing
      // TODO: Remove this when Supabase edge function is deployed
      if (import.meta.env.DEV || import.meta.env.VITE_TEST_MODE === 'true') {
        console.log('🧪 Development Mode: Simulating Rukisha integration...');
        
        try {
          // Simulate customer registration with Rukisha
          const simulatedCustomerId = `test_customer_${Date.now()}`;
          
          // Update profile with simulated customer_id
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              id: user.id,
              customer_id: simulatedCustomerId,
              first_name: data.fullName.split(' ')[0] || data.fullName,
              last_name: data.fullName.split(' ').slice(1).join(' ') || '',
              phone: data.phoneNumber,
              email_verified: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }

          // Activate wallet
          const { error: walletError } = await supabase
            .from('wallets')
            .upsert({
              user_id: user.id,
              is_active: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (walletError) {
            console.error('Error activating wallet:', walletError);
          }

          // Update KYC status to verified
          const { error: kycUpdateError } = await supabase
            .from('wallet_kyc')
            .update({
              status: 'verified',
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (kycUpdateError) {
            console.error('Error updating KYC status:', kycUpdateError);
          }

          console.log('✅ Development Mode: Wallet activated successfully!');
          
          return {
            success: true,
            data: {
              id: result?.id,
              status: 'verified',
              customer_id: simulatedCustomerId,
              submittedAt: result?.created_at,
              message: '🧪 Your wallet has been activated successfully! (Development Mode)'
            }
          };
          
        } catch (devError) {
          console.error('Development mode simulation error:', devError);
          // Fall through to production edge function call
        }
      }

      // Now call the Supabase Edge Function to register with Rukisha
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'No active session found' };
      }

      try {
        const response = await supabase.functions.invoke('register-customer', {
          body: {
            first_name: data.fullName.split(' ')[0] || data.fullName,
            last_name: data.fullName.split(' ').slice(1).join(' ') || '',
            phone: data.phoneNumber,
            id_number: data.idNumber,
            email: data.email,
            kra_pin: data.kraPin
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          console.error('Error calling register-customer function:', response.error);
          return { 
            success: false, 
            error: response.error.message || 'Failed to register with Rukisha API'
          };
        }

        const rukishaResult = response.data;
        
        if (!rukishaResult.success) {
          console.error('Rukisha registration failed:', rukishaResult);
          return { 
            success: false, 
            error: rukishaResult.error || 'Wallet activation failed'
          };
        }

        // If successful, return success message
        return {
          success: true,
          data: {
            id: result.id,
            status: 'verified', // Automatically verified through Rukisha
            customer_id: rukishaResult.customer_id,
            submittedAt: result.created_at,
            message: 'Your wallet has been activated successfully!'
          }
        };

      } catch (rukishaError) {
        console.error('Error during Rukisha registration:', rukishaError);
        return { 
          success: false, 
          error: 'Failed to activate wallet through Rukisha API. Please try again or contact support.'
        };
      }

    } catch (error) {
      console.error('Error in KYC submission:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }

  /**
   * Get KYC status for current user
   */
  static async getKycStatus(): Promise<{ success: boolean; data?: WalletKycData; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User authentication required' };
      }

      const { data, error } = await supabase
        .from('wallet_kyc')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { success: true, data: undefined };
        }
        console.error('Error fetching KYC status:', error);
        return { success: false, error: 'Failed to fetch KYC status' };
      }

      return { success: true, data: data as WalletKycData };

    } catch (error) {
      console.error('Error in getKycStatus:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }

  /**
   * Check if user's KYC is verified
   */
  static async isKycVerified(): Promise<boolean> {
    const result = await this.getKycStatus();
    return result.success && result.data?.status === 'verified';
  }

  /**
   * Admin function to verify/reject KYC
   */
  static async verifyKyc(kycId: string, status: 'verified' | 'rejected', notes?: string, rejectionReason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        verification_notes: notes || null,
        updated_at: new Date().toISOString()
      };

      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
        updateData.rejected_at = null;
        updateData.rejection_reason = null;
      } else if (status === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = rejectionReason;
        updateData.verified_at = null;
      }

      const { error } = await supabase
        .from('wallet_kyc')
        .update(updateData)
        .eq('id', kycId);

      if (error) {
        console.error('Error updating KYC status:', error);
        return { success: false, error: 'Failed to update KYC status' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in verifyKyc:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }

  /**
   * Get all pending KYC submissions (admin only)
   */
  static async getPendingKyc(): Promise<{ success: boolean; data?: WalletKycData[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('wallet_kyc')
        .select('*')
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending KYC:', error);
        return { success: false, error: 'Failed to fetch pending KYC submissions' };
      }

      return { success: true, data: data as WalletKycData[] };

    } catch (error) {
      console.error('Error in getPendingKyc:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }
}