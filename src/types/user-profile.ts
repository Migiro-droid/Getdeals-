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

// Enhanced Address interface with geolocation support
export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  city: string;
  county?: string;
  postal_code?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
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
      addresses: {
        Row: UserAddress;
        Insert: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>;
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