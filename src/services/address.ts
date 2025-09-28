import { supabase } from '../../lib/supabase';
import type { UserAddress } from '@/types/user-profile';

// Create a type-safe wrapper for address operations
const addressTable = 'addresses' as any;

export interface CreateAddressData {
  label: string;
  street_address: string;
  city: string;
  county?: string;
  postal_code?: string;
  landmark?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  is_default?: boolean;
  address_type: 'home' | 'work' | 'other';
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id?: never; // Prevent updating ID
  user_id?: never; // Prevent updating user_id
  created_at?: never; // Prevent updating created_at
}

export class AddressService {
  /**
   * Get all addresses for the current user
   */
  static async getUserAddresses(): Promise<{ data: UserAddress[] | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from(addressTable)
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false }) // Default addresses first
        .order('created_at', { ascending: false }); // Then by newest

      if (error) {
        console.error('Error fetching user addresses:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUserAddresses:', error);
      return { data: null, error: 'Failed to fetch addresses' };
    }
  }

  /**
   * Get a specific address by ID
   */
  static async getAddressById(id: string): Promise<{ data: UserAddress | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from(addressTable)
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only access their own addresses
        .single();

      if (error) {
        console.error('Error fetching address:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getAddressById:', error);
      return { data: null, error: 'Failed to fetch address' };
    }
  }

  /**
   * Create a new address
   */
  static async createAddress(addressData: CreateAddressData): Promise<{ data: UserAddress | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // If this is set as default, first unset other default addresses
      if (addressData.is_default) {
        await (supabase as any)
          .from(addressTable)
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await (supabase as any)
        .from(addressTable)
        .insert([{
          ...addressData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating address:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createAddress:', error);
      return { data: null, error: 'Failed to create address' };
    }
  }

  /**
   * Update an existing address
   */
  static async updateAddress(id: string, updateData: UpdateAddressData): Promise<{ data: UserAddress | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // If setting as default, first unset other default addresses
      if (updateData.is_default) {
        await (supabase as any)
          .from(addressTable)
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await (supabase as any)
        .from(addressTable)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own addresses
        .select()
        .single();

      if (error) {
        console.error('Error updating address:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateAddress:', error);
      return { data: null, error: 'Failed to update address' };
    }
  }

  /**
   * Delete an address
   */
  static async deleteAddress(id: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Check if this is the default address
      const { data: addressToDelete } = await supabase
        .from(addressTable)
        .select('is_default')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from(addressTable)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own addresses

      if (error) {
        console.error('Error deleting address:', error);
        return { error: error.message };
      }

      // If we deleted the default address, make another address default
      if (addressToDelete && (addressToDelete as any).is_default) {
        const { data: remainingAddresses } = await supabase
          .from(addressTable)
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (remainingAddresses && remainingAddresses.length > 0) {
          await (supabase as any)
            .from(addressTable)
            .update({ is_default: true })
            .eq('id', (remainingAddresses[0] as any).id);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteAddress:', error);
      return { error: 'Failed to delete address' };
    }
  }

  /**
   * Set an address as the default address
   */
  static async setDefaultAddress(id: string): Promise<{ data: UserAddress | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // First, unset all default addresses for this user
      await (supabase as any)
        .from(addressTable)
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the specified address as default
      const { data, error } = await (supabase as any)
        .from(addressTable)
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error setting default address:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in setDefaultAddress:', error);
      return { data: null, error: 'Failed to set default address' };
    }
  }

  /**
   * Get addresses within a certain radius of coordinates
   */
  static async getNearbyAddresses(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<{ data: UserAddress[] | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Using the Haversine formula in PostgreSQL to find nearby addresses
      const { data, error } = await (supabase as any).rpc('get_nearby_addresses', {
        user_id: user.id,
        target_lat: latitude,
        target_lng: longitude,
        radius_km: radiusKm
      });

      if (error) {
        console.error('Error fetching nearby addresses:', error);
        // Fallback to regular query if the function doesn't exist
        return this.getUserAddresses();
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getNearbyAddresses:', error);
      return { data: null, error: 'Failed to fetch nearby addresses' };
    }
  }

  /**
   * Validate address data before saving
   */
  static validateAddressData(data: CreateAddressData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.label?.trim()) {
      errors.push('Address label is required');
    }

    if (!data.street_address?.trim()) {
      errors.push('Street address is required');
    }

    if (!data.city?.trim()) {
      errors.push('City is required');
    }

    if (!['home', 'work', 'other'].includes(data.address_type)) {
      errors.push('Invalid address type');
    }

    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      errors.push('Invalid latitude (must be between -90 and 90)');
    }

    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      errors.push('Invalid longitude (must be between -180 and 180)');
    }

    if (data.phone_number && data.phone_number.length > 20) {
      errors.push('Phone number is too long');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format address for display
   */
  static formatAddress(address: UserAddress): string {
    if (address.formatted_address) {
      return address.formatted_address;
    }

    const parts = [
      address.street_address,
      address.city,
      address.county,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Get address summary for quick display
   */
  static getAddressSummary(address: UserAddress): string {
    const parts = [address.street_address, address.city].filter(Boolean);
    return parts.join(', ') || 'Address';
  }
}