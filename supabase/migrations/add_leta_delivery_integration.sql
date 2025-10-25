-- Supabase Migration: Add Leta Delivery Columns
-- Run this migration to add necessary columns for Leta integration

-- 1. Add Leta order tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS (
  -- Leta Order Identification
  leta_order_id TEXT UNIQUE,
  leta_reference TEXT UNIQUE,
  
  -- Leta Status Tracking
  leta_status TEXT DEFAULT 'pending',
  leta_tracking_url TEXT,
  
  -- Delivery OTP (provided by Leta for final delivery verification)
  delivery_otp TEXT,
  
  -- Rider Information
  rider_id TEXT,
  rider_name TEXT,
  rider_phone TEXT,
  rider_latitude FLOAT8,
  rider_longitude FLOAT8,
  
  -- Delivery Timestamps
  pickup_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  last_location_update TIMESTAMP WITH TIME ZONE
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_leta_order_id ON orders(leta_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_leta_status ON orders(leta_status);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);

-- 3. Create table for webhook logging
CREATE TABLE IF NOT EXISTS leta_webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  leta_order_id TEXT,
  status TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create index for webhook logs
CREATE INDEX IF NOT EXISTS idx_leta_webhook_logs_order_id ON leta_webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_leta_webhook_logs_leta_order_id ON leta_webhook_logs(leta_order_id);
CREATE INDEX IF NOT EXISTS idx_leta_webhook_logs_processed ON leta_webhook_logs(processed);

-- 5. Create table for depot information (if not exists)
CREATE TABLE IF NOT EXISTS depots (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_wait_time INTEGER DEFAULT 15, -- in minutes
  max_orders INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create index for depots
CREATE INDEX IF NOT EXISTS idx_depots_code ON depots(code);
CREATE INDEX IF NOT EXISTS idx_depots_is_active ON depots(is_active);

-- 7. Insert default depot (GetDeals Nairobi Hub)
INSERT INTO depots (name, code, latitude, longitude, phone, is_active)
VALUES (
  'GetDeals Nairobi Hub',
  'getdeals-nairobi',
  -1.2860273,
  36.8079678,
  '+254 20 2386000',
  TRUE
) ON CONFLICT (code) DO NOTHING;

-- 8. Create table for rate cache (optional, for performance)
CREATE TABLE IF NOT EXISTS rate_cache (
  id BIGSERIAL PRIMARY KEY,
  origin_lat FLOAT8 NOT NULL,
  origin_lng FLOAT8 NOT NULL,
  destination_lat FLOAT8 NOT NULL,
  destination_lng FLOAT8 NOT NULL,
  distance FLOAT8,
  price FLOAT8,
  duration INTEGER, -- in seconds
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create index for rate cache
CREATE INDEX IF NOT EXISTS idx_rate_cache_location ON rate_cache(origin_lat, origin_lng, destination_lat, destination_lng);
CREATE INDEX IF NOT EXISTS idx_rate_cache_expires ON rate_cache(expires_at);

-- 10. Add RLS policies for webhooks table
ALTER TABLE leta_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage webhooks
CREATE POLICY "Service role can manage webhooks" ON leta_webhook_logs
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

-- 11. Add RLS policies for depots
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active depots
CREATE POLICY "Public can view active depots" ON depots
FOR SELECT
USING (is_active = TRUE);

-- Allow service role to manage depots
CREATE POLICY "Service role can manage depots" ON depots
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

-- 12. Create view for active orders with delivery info
CREATE OR REPLACE VIEW orders_with_delivery AS
SELECT
  o.id,
  o.order_reference,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.delivery_method,
  o.delivery_address,
  o.status,
  o.created_at,
  o.updated_at,
  -- Leta fields
  o.leta_order_id,
  o.leta_status,
  o.leta_tracking_url,
  o.delivery_otp,
  -- Rider fields
  o.rider_name,
  o.rider_phone,
  o.rider_latitude,
  o.rider_longitude,
  -- Timestamps
  o.pickup_at,
  o.delivered_at,
  o.last_location_update
FROM
  orders o
WHERE
  o.delivery_method = 'speedy'
  AND o.status IN ('confirmed', 'in_transit', 'delivered');

-- Refresh schema to apply changes
NOTIFY pgrst, 'reload schema';
