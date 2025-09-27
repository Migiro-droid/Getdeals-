// Updated types for user_profile table
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  organization: string | null;
  organization_number: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database schema update for Supabase types
export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>;
      };
      // Keep existing profiles table for KYC
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          email: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
          customer_id: string | null;
          organization: string | null;
          avatar_url: string | null;
          organization_number: string | null;
        };
        Insert: any;
        Update: any;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}