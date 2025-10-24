/**
 * Leta Delivery API Type Definitions
 * All interfaces for Leta API integration
 */

// ==================== LOCATION ====================
export interface Location {
  name: string;
  latitude: string | number;
  longitude: string | number;
}

// ==================== CUSTOMER ====================
export interface Customer {
  phone_number: string;
  email: string;
  name: string;
}

// ==================== PRODUCT ====================
export interface Product {
  code: string;
  quantity: number;
  price: number;
}

// ==================== ORDER ====================
export interface CreateOrderPayload {
  customer: Customer;
  reference: string;
  special_instruction?: string;
  cargo_description?: string;
  dropoff: Location;
  pickup?: Location;
  payment_method: "postpaid" | "prepaid";
  depot_code?: string;
  products: Product[];
}

export interface UpdateOrderPayload {
  reference: string;
  dropoff?: Location;
  customer?: Partial<Customer>;
  special_instruction?: string;
}

export interface CancelOrderPayload {
  reference: string;
}

export interface OrderResponse {
  success: boolean;
  data?: {
    id: string;
    reference: string;
    order_status: OrderStatus;
    tracking_url: string;
    estimated_delivery_time?: string;
    created_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type OrderStatus = 
  | "pending"
  | "assigned"
  | "accepted"
  | "arrived_at_store"
  | "pickup"
  | "arrived_at_destination"
  | "delivered"
  | "cancelled"
  | "failed";

// ==================== DEPOT ====================
export interface DepotLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export interface CreateDepotPayload {
  name: string;
  code: string;
  location: DepotLocation;
  pickup_geofence_type?: "soft" | "hard";
  pickup_geofence_radius?: number;
  dropoff_geofence_type?: "soft" | "hard";
  dropoff_geofence_radius?: number;
  order_pickup_ready?: boolean;
  restricted_radius?: number;
  order_wait_time?: number;
  max_orders?: number;
}

export interface UpdateDepotPayload extends Omit<CreateDepotPayload, 'code'> {}

export interface DepotResponse {
  success: boolean;
  data?: {
    id: string;
    code: string;
    name: string;
    location: DepotLocation;
    created_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ==================== SHIPPING RATES ====================
export interface ShippingRatePayload {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
}

export interface ShippingRateResponse {
  success: boolean;
  data?: {
    distance: number; // in km
    price: number;
    duration: number; // in minutes
    currency: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ==================== DRIVER AVAILABILITY ====================
export interface DriverAvailabilityPayload {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  search_radius?: number; // in meters
  order_preparation_time?: number; // in seconds
}

export interface DriverMetrics {
  available_drivers: number;
  average_wait_time: number; // in minutes
  closest_driver_distance: number; // in km
  busy_drivers: number;
}

export interface DriverAvailabilityResponse {
  success: boolean;
  data?: DriverMetrics;
  error?: {
    code: string;
    message: string;
  };
}

// ==================== RIDER ====================
export interface Rider {
  id: string | number;
  name: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  vehicle_type?: string;
  vehicle_plate?: string;
}

// ==================== WEBHOOK ====================
export interface WebhookPayload {
  order_id: string;
  order_status: OrderStatus;
  tracking_url?: string;
  timestamp: string;
  rider?: Rider;
  delivery_otp?: string;
  reason?: string; // For failed/cancelled orders
  latitude?: number;
  longitude?: number;
  distance_remaining?: number;
  eta_minutes?: number;
}

// ==================== TRACKING ====================
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
  status?: OrderStatus;
}

export interface TrackingUpdate extends LocationUpdate {
  order_id: string;
  rider_id?: string;
  distance_remaining?: number;
  eta_minutes?: number;
}

// ==================== API CLIENT ====================
export interface LetaClientConfig {
  token: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ==================== DATABASE MODELS ====================
export interface LetaOrder {
  id: string;
  order_id: string; // GetDeals order ID
  leta_reference: string;
  leta_order_id: string;
  customer_id: string;
  status: OrderStatus;
  tracking_url: string;
  delivery_otp?: string;
  rider_id?: string;
  rider_name?: string;
  rider_phone?: string;
  rider_latitude?: number;
  rider_longitude?: number;
  last_location_update?: Date;
  special_instruction?: string;
  cargo_description?: string;
  created_at: Date;
  updated_at: Date;
  delivered_at?: Date;
}

export interface LetaDepot {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  location_name: string;
  pickup_geofence_type: "soft" | "hard";
  pickup_geofence_radius: number;
  dropoff_geofence_type: "soft" | "hard";
  dropoff_geofence_radius: number;
  order_wait_time: number;
  max_orders: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LetaWebhookLog {
  id: string;
  order_id: string;
  event_type: string;
  status: OrderStatus;
  payload: WebhookPayload;
  processed: boolean;
  processed_at?: Date;
  created_at: Date;
}

// ==================== REQUEST/RESPONSE ====================
export interface ApiRequest<T = any> {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  data?: T;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  status: number;
  data?: T;
  error?: ApiErrorResponse;
  headers?: Record<string, string>;
}

// ==================== EXCEPTIONS ====================
export class LetaApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "LetaApiError";
  }
}

export class LetaValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(`Validation error on ${field}: ${message}`);
    this.name = "LetaValidationError";
  }
}

export class LetaNetworkError extends Error {
  constructor(public originalError: Error) {
    super(`Network error: ${originalError.message}`);
    this.name = "LetaNetworkError";
  }
}
