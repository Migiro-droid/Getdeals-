import { createClient } from '@supabase/supabase-js';
import type { UserProfile, Database } from '../types/user-profile';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export class UserProfileService {
  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get current user's profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  static async upsertUserProfile(
    userId: string, 
    profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            ...profileData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  static async updateCurrentUserProfile(
    profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      return await this.upsertUserProfile(user.id, profileData);
    } catch (error) {
      console.error('Error updating current user profile:', error);
      throw error;
    }
  }

  /**
   * Check if organization number is available
   */
  static async isOrganizationNumberAvailable(organizationNumber: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_number', organizationNumber);

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.length === 0;
    } catch (error) {
      console.error('Error checking organization number availability:', error);
      return false;
    }
  }

  /**
   * Search user profiles by organization
   */
  static async searchByOrganization(organizationName: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('organization', `%${organizationName}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching profiles by organization:', error);
      return [];
    }
  }

  /**
   * Get user profile statistics
   */
  static async getProfileStats(): Promise<{
    total: number;
    withOrganization: number;
    verified: number;
  }> {
    try {
      const [totalResult, orgResult, verifiedResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).not('organization', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('email_verified', true),
      ]);

      return {
        total: totalResult.count || 0,
        withOrganization: orgResult.count || 0,
        verified: verifiedResult.count || 0,
      };
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      return { total: 0, withOrganization: 0, verified: 0 };
    }
  }

  /**
   * Delete user profile (soft delete by setting is_active to false)
   */
  static async deactivateUserProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deactivating user profile:', error);
      return false;
    }
  }

  /**
   * Subscribe to user profile changes
   */
  static subscribeToUserProfile(
    userId: string, 
    callback: (profile: UserProfile | null) => void
  ) {
    return supabase
      .channel(`user_profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null);
          } else {
            callback(payload.new as UserProfile);
          }
        }
      )
      .subscribe();
  }
}

export default UserProfileService;