import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables - pickup locations will use fallback data');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  contact_person?: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  features: string[];
  instructions?: string;
  operating_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PickupLocationStats {
  id: string;
  name: string;
  status: string;
  capacity: number;
  total_pickups: number;
  completed_pickups: number;
  pending_pickups: number;
  ready_pickups: number;
  completion_rate: number;
}

export interface NearbyPickupLocation extends Omit<PickupLocation, 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {
  distance_km: number;
}

export interface OrderPickupLocation {
  id: string;
  order_id: string;
  pickup_location_id: string;
  pickup_scheduled_at?: string;
  pickup_completed_at?: string;
  pickup_code: string;
  pickup_status: 'pending' | 'ready' | 'completed' | 'cancelled' | 'expired';
  customer_notes?: string;
  staff_notes?: string;
  created_at: string;
  updated_at: string;
  pickup_location?: PickupLocation;
}

export interface CreatePickupLocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  contact_person?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  capacity?: number;  
  features?: string[];
  instructions?: string;
  operating_hours?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

export interface UpdatePickupLocationData extends Partial<CreatePickupLocationData> {
  id: string;
}

export class PickupLocationService {
  /**
   * Get all pickup locations with optional filtering
   */
  static async getAllLocations(filters?: {
    status?: 'active' | 'inactive' | 'maintenance' | 'all';
    search?: string;
  }): Promise<{ data: PickupLocation[] | null; error: string | null }> {
    try {
      if (!supabase) {
        // Return fallback data if Supabase is not available
        return { data: this.getFallbackLocations(filters), error: null };
      }

      let query = supabase
        .from('pickup_locations')
        .select('*')
        .order('name');

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pickup locations:', error);
        // Return fallback data on error
        return { data: this.getFallbackLocations(filters), error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getAllLocations:', error);
      // Return fallback data on error
      return { data: this.getFallbackLocations(filters), error: null };
    }
  }

  /**
   * Get active pickup locations only
   */
  static async getActiveLocations(): Promise<{ data: PickupLocation[] | null; error: string | null }> {
    return this.getAllLocations({ status: 'active' });
  }

  /**
   * Get pickup location by ID
   */
  static async getLocationById(id: string): Promise<{ data: PickupLocation | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pickup_locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching pickup location:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getLocationById:', error);
      return { data: null, error: 'Failed to fetch pickup location' };
    }
  }

  /**
   * Create a new pickup location
   */
  static async createLocation(locationData: CreatePickupLocationData): Promise<{ data: PickupLocation | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('pickup_locations')
        .insert([{
          ...locationData,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating pickup location:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createLocation:', error);
      return { data: null, error: 'Failed to create pickup location' };
    }
  }

  /**
   * Update an existing pickup location
   */
  static async updateLocation(locationData: UpdatePickupLocationData): Promise<{ data: PickupLocation | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { id, ...updateData } = locationData;

      const { data, error } = await supabase
        .from('pickup_locations')
        .update({
          ...updateData,
          updated_by: user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pickup location:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateLocation:', error);
      return { data: null, error: 'Failed to update pickup location' };
    }
  }

  /**
   * Delete a pickup location
   */
  static async deleteLocation(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('pickup_locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting pickup location:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in deleteLocation:', error);
      return { error: 'Failed to delete pickup location' };
    }
  }

  /**
   * Get nearby pickup locations based on coordinates
   */
  static async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 5
  ): Promise<{ data: NearbyPickupLocation[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('get_nearby_pickup_locations', {
          user_lat: latitude,
          user_lng: longitude,
          radius_km: radiusKm,
          limit_count: limit
        });

      if (error) {
        console.error('Error fetching nearby pickup locations:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getNearbyLocations:', error);
      return { data: null, error: 'Failed to fetch nearby pickup locations' };
    }
  }

  /**
   * Get pickup location statistics
   */
  static async getLocationStats(): Promise<{ data: PickupLocationStats[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pickup_locations_stats')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching pickup location stats:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getLocationStats:', error);
      return { data: null, error: 'Failed to fetch pickup location statistics' };
    }
  }

  /**
   * Create an order pickup assignment
   */
  static async createOrderPickup(data: {
    order_id: string;
    pickup_location_id: string;
    pickup_scheduled_at?: string;
    customer_notes?: string;
  }): Promise<{ data: OrderPickupLocation | null; error: string | null }> {
    try {
      const { data: result, error } = await supabase
        .from('orders_pickup_locations')
        .insert([data])
        .select(`
          *,
          pickup_location:pickup_locations(*)
        `)
        .single();

      if (error) {
        console.error('Error creating order pickup:', error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error in createOrderPickup:', error);
      return { data: null, error: 'Failed to create order pickup' };
    }
  }

  /**
   * Update order pickup status
   */
  static async updateOrderPickupStatus(
    id: string,
    status: OrderPickupLocation['pickup_status'],
    staffNotes?: string
  ): Promise<{ data: OrderPickupLocation | null; error: string | null }> {
    try {
      const updateData: any = { pickup_status: status };
      
      if (staffNotes) {
        updateData.staff_notes = staffNotes;
      }

      if (status === 'completed') {
        updateData.pickup_completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders_pickup_locations')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          pickup_location:pickup_locations(*)
        `)
        .single();

      if (error) {
        console.error('Error updating order pickup status:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateOrderPickupStatus:', error);
      return { data: null, error: 'Failed to update order pickup status' };
    }
  }

  /**
   * Get order pickup by pickup code
   */
  static async getOrderPickupByCode(pickupCode: string): Promise<{ data: OrderPickupLocation | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('orders_pickup_locations')
        .select(`
          *,
          pickup_location:pickup_locations(*)
        `)
        .eq('pickup_code', pickupCode.toUpperCase())
        .single();

      if (error) {
        console.error('Error fetching order pickup by code:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getOrderPickupByCode:', error);
      return { data: null, error: 'Failed to fetch order pickup' };
    }
  }

  /**
   * Get order pickups for a specific location
   */
  static async getLocationPickups(
    locationId: string,
    filters?: {
      status?: OrderPickupLocation['pickup_status'];
      date?: string; // YYYY-MM-DD format
    }
  ): Promise<{ data: OrderPickupLocation[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('orders_pickup_locations')
        .select(`
          *,
          pickup_location:pickup_locations(*)
        `)
        .eq('pickup_location_id', locationId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('pickup_status', filters.status);
      }

      if (filters?.date) {
        const startDate = `${filters.date}T00:00:00Z`;
        const endDate = `${filters.date}T23:59:59Z`;
        query = query
          .gte('pickup_scheduled_at', startDate)
          .lte('pickup_scheduled_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching location pickups:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getLocationPickups:', error);
      return { data: null, error: 'Failed to fetch location pickups' };
    }
  }

  /**
   * Get user's order pickups
   */
  static async getUserOrderPickups(userId: string): Promise<{ data: OrderPickupLocation[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('orders_pickup_locations')
        .select(`
          *,
          pickup_location:pickup_locations(*)
        `)
        .eq('order_id', userId) // This assumes orders table has user_id
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user order pickups:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUserOrderPickups:', error);
      return { data: null, error: 'Failed to fetch user order pickups' };
    }
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
   * Format operating hours for display
   */
  static formatOperatingHours(hours: PickupLocation['operating_hours']): string {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const formatted = days.map((day, index) => `${dayNames[index]}: ${hours[day as keyof typeof hours]}`);
    return formatted.join('\n');
  }

  /**
   * Check if location is currently open
   */
  static isLocationOpen(operatingHours: PickupLocation['operating_hours']): boolean {
    try {
      if (!operatingHours) {
        return true; // Default to open if no operating hours defined
      }

      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[now.getDay()] as keyof typeof operatingHours;
      const todayHours = operatingHours[today];

      if (!todayHours || todayHours.toLowerCase() === 'closed') {
        return false;
      }

      // Parse hours (assuming format "9:00 AM - 6:00 PM")
      const timeRange = todayHours.split(' - ');
      if (timeRange.length !== 2) {
        return true; // Default to open if format is invalid
      }

      const [openTime, closeTime] = timeRange;
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit' 
      });

      // Convert to 24-hour format for comparison
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.trim().split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hour24 += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hour24 = 0;
        }
        
        return hour24 * 60 + minutes; // Convert to minutes since midnight
      };

      const currentMinutes = parseTime(currentTime);
      const openMinutes = parseTime(openTime);
      const closeMinutes = parseTime(closeTime);

      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } catch (error) {
      console.error('Error parsing operating hours:', error);
      return true; // Default to open on error
    }
  }

  /**
   * Validate pickup location data
   */
  static validateLocationData(data: CreatePickupLocationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Name is required');
    }

    if (!data.address?.trim()) {
      errors.push('Address is required');
    }

    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }

    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }

    if (data.capacity && (data.capacity < 1 || data.capacity > 1000)) {
      errors.push('Capacity must be between 1 and 1000');
    }

    if (data.phone && data.phone.length > 20) {
      errors.push('Phone number is too long');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get fallback pickup locations when Supabase is not available
   */
  private static getFallbackLocations(filters?: {
    status?: 'active' | 'inactive' | 'maintenance' | 'all';
    search?: string;
  }): PickupLocation[] {
    const fallbackLocations: PickupLocation[] = [
      {
        id: 'lavington',
        name: 'Quickmart Lavington',
        address: 'Lavington Green Shopping Centre, Hatheru Road, Nairobi',
        latitude: -1.2774,
        longitude: 36.7664,
        phone: '+254 20 2386000',
        status: 'active',
        capacity: 100,
        features: ['Parking Available', 'Air Conditioned', 'Security'],
        operating_hours: {
          monday: '8:00 AM - 9:00 PM',
          tuesday: '8:00 AM - 9:00 PM',
          wednesday: '8:00 AM - 9:00 PM',
          thursday: '8:00 AM - 9:00 PM',
          friday: '8:00 AM - 9:00 PM',
          saturday: '8:00 AM - 9:00 PM',
          sunday: '9:00 AM - 8:00 PM'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'roysambu',
        name: 'Quickmart Roysambu',
        address: 'Roysambu Roundabout, Thika Road, Nairobi',
        latitude: -1.2097,
        longitude: 36.8833,
        phone: '+254 20 2386001',
        status: 'active',
        capacity: 80,
        features: ['Parking Available', 'Public Transport Access'],
        operating_hours: {
          monday: '8:00 AM - 9:00 PM',
          tuesday: '8:00 AM - 9:00 PM',
          wednesday: '8:00 AM - 9:00 PM',
          thursday: '8:00 AM - 9:00 PM',
          friday: '8:00 AM - 9:00 PM',
          saturday: '8:00 AM - 9:00 PM',
          sunday: '9:00 AM - 8:00 PM'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'westlands',
        name: 'Quickmart Westlands',
        address: 'Westlands Square, Waiyaki Way, Nairobi',
        latitude: -1.2634,
        longitude: 36.8078,
        phone: '+254 20 2386002',
        status: 'active',
        capacity: 120,
        features: ['Parking Available', 'Food Court', '24/7 Security'],
        operating_hours: {
          monday: '8:00 AM - 10:00 PM',
          tuesday: '8:00 AM - 10:00 PM',
          wednesday: '8:00 AM - 10:00 PM',
          thursday: '8:00 AM - 10:00 PM',
          friday: '8:00 AM - 10:00 PM',
          saturday: '8:00 AM - 10:00 PM',
          sunday: '9:00 AM - 9:00 PM'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'thindiuga',
        name: 'Quickmart Thindiuga',
        address: 'Thindiuga Shopping Centre, Kiambu Road, Nairobi',
        latitude: -1.2303,
        longitude: 36.8647,
        phone: '+254 20 2386003',
        status: 'active',
        capacity: 60,
        features: ['Parking Available', 'Pharmacy Nearby'],
        operating_hours: {
          monday: '8:00 AM - 9:00 PM',
          tuesday: '8:00 AM - 9:00 PM',
          wednesday: '8:00 AM - 9:00 PM',
          thursday: '8:00 AM - 9:00 PM',
          friday: '8:00 AM - 9:00 PM',
          saturday: '8:00 AM - 9:00 PM',
          sunday: '9:00 AM - 8:00 PM'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mombasa-road',
        name: 'Quickmart Mombasa Road',
        address: 'Mombasa Road, Industrial Area, Nairobi',
        latitude: -1.3201,
        longitude: 36.8585,
        phone: '+254 20 2386004',
        status: 'active',
        capacity: 90,
        features: ['Ample Parking', 'Industrial Area Access'],
        operating_hours: {
          monday: '8:00 AM - 9:00 PM',
          tuesday: '8:00 AM - 9:00 PM',
          wednesday: '8:00 AM - 9:00 PM',
          thursday: '8:00 AM - 9:00 PM',
          friday: '8:00 AM - 9:00 PM',
          saturday: '8:00 AM - 9:00 PM',
          sunday: '9:00 AM - 8:00 PM'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    let filtered = fallbackLocations;

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(loc => loc.status === filters.status);
    }

    // Apply search filter
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(search) ||
        loc.address.toLowerCase().includes(search) ||
        (loc.contact_person && loc.contact_person.toLowerCase().includes(search))
      );
    }

    return filtered;
  }
}