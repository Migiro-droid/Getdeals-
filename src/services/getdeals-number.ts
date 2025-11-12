import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface GetDealsUser {
  user_id: string;
  getdeals_number: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  wallet_balance: number;
  wallet_active: boolean;
}

export interface BackfillResult {
  user_id: string;
  getdeals_number: string;
  status: string;
}

export class GetDealsNumberService {
  /**
   * GetDeals number format validation
   */
  static validateFormat(getdealsNumber: string): boolean {
    // Format: GD-XXXXXX (6 digits)
    const pattern = /^GD-[0-9]{6}$/;
    return pattern.test(getdealsNumber);
  }

  /**
   * Generate a new GetDeals number (server-side function)
   */
  static async generateNumber(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_getdeals_number');
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error generating GetDeals number:', error);
      throw new Error('Failed to generate GetDeals number');
    }
  }

  /**
   * Get user by GetDeals number
   */
  static async getUserByNumber(getdealsNumber: string): Promise<GetDealsUser | null> {
    try {
      if (!this.validateFormat(getdealsNumber)) {
        throw new Error('Invalid GetDeals number format. Expected: GD-XXXXXX');
      }

      const { data, error } = await supabase.rpc('get_user_by_getdeals_number', {
        lookup_number: getdealsNumber
      });

      if (error) {
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error looking up user by GetDeals number:', error);
      throw error;
    }
  }

  /**
   * Get GetDeals number for current user
   */
  static async getCurrentUserNumber(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('getdeals_number')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data?.getdeals_number || null;
    } catch (error) {
      console.error('Error fetching current user GetDeals number:', error);
      return null;
    }
  }

  /**
   * Check if GetDeals number exists
   */
  static async numberExists(getdealsNumber: string): Promise<boolean> {
    try {
      if (!this.validateFormat(getdealsNumber)) {
        return false;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('getdeals_number')
        .eq('getdeals_number', getdealsNumber)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking GetDeals number existence:', error);
      return false;
    }
  }

  /**
   * Run backfill process for existing users
   */
  static async backfillNumbers(): Promise<BackfillResult[]> {
    try {
      const { data, error } = await supabase.rpc('backfill_getdeals_numbers');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error running GetDeals number backfill:', error);
      throw error;
    }
  }

  /**
   * Get users without GetDeals numbers
   */
  static async getUsersWithoutNumbers(): Promise<{ user_id: string; full_name: string; email: string }[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .is('getdeals_number', null)
        .order('created_at');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching users without GetDeals numbers:', error);
      return [];
    }
  }

  /**
   * Get wallet balance by GetDeals number
   */
  static async getWalletByNumber(getdealsNumber: string): Promise<{
    balance: number;
    is_active: boolean;
    user_id: string;
  } | null> {
    try {
      if (!this.validateFormat(getdealsNumber)) {
        throw new Error('Invalid GetDeals number format');
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('user_id, balance, is_active')
        .eq('getdeals_number', getdealsNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No wallet found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching wallet by GetDeals number:', error);
      throw error;
    }
  }

  /**
   * Verify linkage between GetDeals number and wallet
   */
  static async verifyNumberWalletLinkage(getdealsNumber: string): Promise<{
    linked: boolean;
    profile_exists: boolean;
    wallet_exists: boolean;
    user_id_match: boolean;
    details?: {
      profile_user_id?: string;
      wallet_user_id?: string;
      wallet_balance?: number;
    };
  }> {
    try {
      if (!this.validateFormat(getdealsNumber)) {
        return {
          linked: false,
          profile_exists: false,
          wallet_exists: false,
          user_id_match: false,
        };
      }

      // Check profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('getdeals_number', getdealsNumber)
        .single();

      // Check wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .eq('getdeals_number', getdealsNumber)
        .single();

      const profile_exists = !profileError && profileData;
      const wallet_exists = !walletError && walletData;
      const user_id_match = profile_exists && wallet_exists && 
                           profileData.user_id === walletData.user_id;

      return {
        linked: profile_exists && wallet_exists && user_id_match,
        profile_exists,
        wallet_exists,
        user_id_match,
        details: {
          profile_user_id: profileData?.user_id,
          wallet_user_id: walletData?.user_id,
          wallet_balance: walletData?.balance,
        },
      };
    } catch (error) {
      console.error('Error verifying GetDeals number wallet linkage:', error);
      throw error;
    }
  }

  /**
   * Get GetDeals number statistics
   */
  static async getNumberStatistics(): Promise<{
    total_profiles: number;
    profiles_with_numbers: number;
    profiles_without_numbers: number;
    total_wallets: number;
    wallets_with_numbers: number;
    coverage_percentage: number;
  }> {
    try {
      const [profileStats, walletStats] = await Promise.all([
        // Profile statistics
        supabase.from('profiles').select('getdeals_number', { count: 'exact' }),
        // Wallet statistics  
        supabase.from('wallets').select('getdeals_number', { count: 'exact' }),
      ]);

      const [profilesWithNumbers, profilesWithoutNumbers] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).not('getdeals_number', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).is('getdeals_number', null),
      ]);

      const walletsWithNumbers = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
        .not('getdeals_number', 'is', null);

      const total_profiles = profileStats.count || 0;
      const profiles_with_numbers = profilesWithNumbers.count || 0;
      const profiles_without_numbers = profilesWithoutNumbers.count || 0;
      const total_wallets = walletStats.count || 0;
      const wallets_with_numbers = walletsWithNumbers.count || 0;

      const coverage_percentage = total_profiles > 0 
        ? Math.round((profiles_with_numbers / total_profiles) * 100)
        : 0;

      return {
        total_profiles,
        profiles_with_numbers,
        profiles_without_numbers,
        total_wallets,
        wallets_with_numbers,
        coverage_percentage,
      };
    } catch (error) {
      console.error('Error fetching GetDeals number statistics:', error);
      return {
        total_profiles: 0,
        profiles_with_numbers: 0,
        profiles_without_numbers: 0,
        total_wallets: 0,
        wallets_with_numbers: 0,
        coverage_percentage: 0,
      };
    }
  }

  /**
   * Format GetDeals number for display
   */
  static formatNumber(getdealsNumber: string): string {
    if (!getdealsNumber) return '';
    
    if (this.validateFormat(getdealsNumber)) {
      return getdealsNumber;
    }
    
    // Try to extract numbers and reformat
    const numbers = getdealsNumber.replace(/\D/g, '');
    if (numbers.length === 6) {
      return `GD-${numbers}`;
    }
    
    return getdealsNumber; // Return as-is if can't format
  }

  /**
   * Search users by partial GetDeals number
   */
  static async searchByPartialNumber(partialNumber: string): Promise<GetDealsUser[]> {
    try {
      // Remove non-digits for search
      const digits = partialNumber.replace(/\D/g, '');
      
      if (digits.length < 3) {
        return []; // Require at least 3 digits
      }

      const searchPattern = `GD-${digits}%`;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          getdeals_number,
          full_name,
          email,
          phone,
          organization,
          wallets!inner (
            balance,
            is_active
          )
        `)
        .ilike('getdeals_number', searchPattern)
        .limit(10);

      if (error) {
        throw error;
      }

      return data?.map(user => ({
        user_id: user.user_id,
        getdeals_number: user.getdeals_number,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        wallet_balance: user.wallets[0]?.balance || 0,
        wallet_active: user.wallets[0]?.is_active || false,
      })) || [];
    } catch (error) {
      console.error('Error searching by partial GetDeals number:', error);
      return [];
    }
  }
}

export default GetDealsNumberService;