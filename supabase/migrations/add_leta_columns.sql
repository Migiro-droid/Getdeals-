-- Add Leta Integration Columns to Orders Table
-- Migration: Add Leta delivery tracking columns

ALTER TABLE orders ADD COLUMN IF NOT EXISTS (
  -- Leta Order Identification
  leta_order_id TEXT UNIQUE,
  leta_reference TEXT UNIQUE,
  
  -- Leta Status Tracking
  leta_status TEXT DEFAULT 'pending',  -- pending, assigned, accepted, arrived_at_store, pickup, arrived_at_destination, delivered, cancelled, failed
  leta_tracking_url TEXT,
  
  -- Delivery OTP
  delivery_otp TEXT,
  
  -- Rider Information
  rider_id TEXT,
  rider_name TEXT,
  rider_phone TEXT,
  rider_latitude FLOAT8,
  rider_longitude FLOAT8,
  
  -- Order Metadata
  special_instruction TEXT,
  cargo_description TEXT,
  
  -- Timestamps
  last_location_update TIMESTAMP WITH TIME ZONE,
  pickup_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_leta_order_id ON orders(leta_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_leta_reference ON orders(leta_reference);
CREATE INDEX IF NOT EXISTS idx_orders_leta_status ON orders(leta_status);

-- Create index for user tracking
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create table for Leone webhook logs
CREATE TABLE IF NOT EXISTS leta_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (order_id) REFERENCES orders(leta_order_id) ON DELETE CASCADE
);

-- Create index for webhook logs
CREATE INDEX IF NOT EXISTS idx_leta_webhook_logs_order_id ON leta_webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_leta_webhook_logs_status ON leta_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_leta_webhook_logs_processed ON leta_webhook_logs(processed);

-- Create table for depots
CREATE TABLE IF NOT EXISTS depots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  location_name TEXT,
  pickup_geofence_radius INTEGER DEFAULT 500,
  dropoff_geofence_radius INTEGER DEFAULT 500,
  order_wait_time INTEGER DEFAULT 15,
  max_orders INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for depots
CREATE INDEX IF NOT EXISTS idx_depots_code ON depots(code);
CREATE INDEX IF NOT EXISTS idx_depots_is_active ON depots(is_active);

-- Create table for rate cache (to reduce API calls)
CREATE TABLE IF NOT EXISTS rata_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_lat FLOAT8 NOT NULL,
  origin_lng FLOAT8 NOT NULL,
  destination_lat FLOAT8 NOT NULL,
  destination_lng FLOAT8 NOT NULL,
  distance FLOAT8,
  price INTEGER,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  
  UNIQUE(origin_lat, origin_lng, destination_lat, destination_lng)
);

-- Create index for rate cache lookups
CREATE INDEX IF NOT EXISTS idx_rate_cache_expires ON rata_cache(expires_at);
