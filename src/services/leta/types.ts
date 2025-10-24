// types.ts - Leta API type definitions

export interface LetaLocation {
  latitude: number | string;
  longitude: number | string;
  name: string;
}

export interface LetaCustomer {
  phone_number: string;
  email?: string;
  name?: string;
}

export interface LetaProduct {
  code: string;
  quantity: number;
  price: number;
}

export interface LetaOrder {
  id?: string;
  reference: string;
  customer: LetaCustomer;
  pickup?: LetaLocation;
  dropoff: LetaLocation;
  depot_code?: string;
  special_instruction?: string;
  cargo_description?: string;
  payment_method?: 'prepaid' | 'postpaid';
  products?: LetaProduct[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LetaDepot {
  id?: string;
  name: string;
  code: string;
  location: LetaLocation;
  pickup_geofence_type?: 'soft' | 'hard';
  pickup_geofence_radius?: number;
  dropoff_geofence_type?: 'soft' | 'hard';
  dropoff_geofence_radius?: number;
  order_pickup_ready?: boolean;
  restricted_radius?: number;
  order_wait_time?: number;
  max_orders?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LetaRates {
  distance: number;
  price: number;
  duration: number;
  currency?: string;
}

export interface LetaDriver {
  id: number;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  vehicle?: string;
  rating?: number;
}

export interface LetaDriverAvailability {
  available: boolean;
  driver_count: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
  drivers?: LetaDriver[];
}

export interface LetaWebhook {
  order_id: string;
  order_status: string;
  tracking_url?: string;
  timestamp: string;
  rider?: LetaDriver;
  delivery_otp?: string;
  reason?: string;
  error_message?: string;
}

export interface LetaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
