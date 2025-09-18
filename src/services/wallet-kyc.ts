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

      // Prepare KYC data
      const kycData = {
        user_id: user.id,
        full_name: data.fullName,
        id_number: data.idNumber,
        phone_number: data.phoneNumber,
        email: data.email,
        kra_pin: data.kraPin.toUpperCase(),
        id_type: data.idType,
        status: 'pending_verification'
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

      return {
        success: true,
        data: {
          id: result.id,
          status: result.status,
          submittedAt: result.created_at
        }
      };

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