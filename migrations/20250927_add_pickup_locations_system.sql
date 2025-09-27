-- Migration: Add pickup locations system
-- Created: 2025-01-27

-- Create pickup_locations table
CREATE TABLE IF NOT EXISTS pickup_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'maintenance')),
    capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity > 0),
    features TEXT[], -- Array of features like ['Parking Available', 'Air Conditioned']
    instructions TEXT,
    operating_hours JSONB NOT NULL DEFAULT '{
        "monday": "9:00 AM - 6:00 PM",
        "tuesday": "9:00 AM - 6:00 PM", 
        "wednesday": "9:00 AM - 6:00 PM",
        "thursday": "9:00 AM - 6:00 PM",
        "friday": "9:00 AM - 6:00 PM",
        "saturday": "9:00 AM - 4:00 PM",
        "sunday": "Closed"
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pickup_locations_status ON pickup_locations(status);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_coordinates ON pickup_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_name ON pickup_locations(name);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_created_at ON pickup_locations(created_at);

-- Add spatial index for location-based queries (if PostGIS is available)
-- Note: Uncomment the following lines if you have PostGIS extension enabled
-- ALTER TABLE pickup_locations ADD COLUMN geom GEOGRAPHY(POINT, 4326);
-- CREATE INDEX IF NOT EXISTS idx_pickup_locations_geom ON pickup_locations USING GIST(geom);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pickup_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pickup_locations_updated_at
    BEFORE UPDATE ON pickup_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_locations_updated_at();

-- Create orders_pickup_locations table to link orders with pickup locations
CREATE TABLE IF NOT EXISTS orders_pickup_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL, -- This would reference your orders table
    pickup_location_id UUID NOT NULL REFERENCES pickup_locations(id) ON DELETE RESTRICT,
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    pickup_completed_at TIMESTAMP WITH TIME ZONE,
    pickup_code VARCHAR(10) UNIQUE, -- Unique code for customer to identify their pickup
    pickup_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (pickup_status IN ('pending', 'ready', 'completed', 'cancelled', 'expired')),
    customer_notes TEXT,
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for orders_pickup_locations
CREATE INDEX IF NOT EXISTS idx_orders_pickup_locations_order_id ON orders_pickup_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_locations_pickup_location_id ON orders_pickup_locations(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_locations_pickup_code ON orders_pickup_locations(pickup_code);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_locations_status ON orders_pickup_locations(pickup_status);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_locations_scheduled_at ON orders_pickup_locations(pickup_scheduled_at);

-- Generate unique pickup codes
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if code already exists
        SELECT COUNT(*) > 0 INTO exists 
        FROM orders_pickup_locations 
        WHERE pickup_code = code;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate pickup codes
CREATE OR REPLACE FUNCTION auto_generate_pickup_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_code IS NULL THEN
        NEW.pickup_code = generate_pickup_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_pickup_code
    BEFORE INSERT ON orders_pickup_locations
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_pickup_code();

-- Create trigger for orders_pickup_locations updated_at
CREATE TRIGGER trigger_orders_pickup_locations_updated_at
    BEFORE UPDATE ON orders_pickup_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_locations_updated_at();

-- Insert sample pickup locations
INSERT INTO pickup_locations (
    name, address, latitude, longitude, phone, email, contact_person, 
    status, capacity, features, instructions
) VALUES 
(
    'Westlands Branch',
    'Westlands Square, Waiyaki Way, Nairobi',
    -1.2634, 36.8078,
    '+254 712 345 678',
    'westlands@getdeals.co.ke',
    'Mary Wanjiku',
    'active',
    100,
    ARRAY['Parking Available', 'Air Conditioned', 'Wheelchair Accessible'],
    'Enter through the main entrance and ask for GetDeals pickup counter.'
),
(
    'CBD Branch', 
    'Kimathi Street, Central Business District, Nairobi',
    -1.2864, 36.8172,
    '+254 712 345 679',
    'cbd@getdeals.co.ke', 
    'John Kamau',
    'active',
    150,
    ARRAY['24/7 Security', 'Multiple Pickup Points', 'Express Service'],
    'Go to floor 2, GetDeals pickup counter next to the elevator.'
),
(
    'Karen Branch',
    'Karen Shopping Centre, Karen Road, Nairobi', 
    -1.3197, 36.7019,
    '+254 712 345 680',
    'karen@getdeals.co.ke',
    'Grace Njeri', 
    'active',
    75,
    ARRAY['Ample Parking', 'Cafe Nearby', 'Shopping Mall'],
    'Located next to the main supermarket entrance, look for GetDeals signage.'
),
(
    'Eastlands Hub',
    'Eastlands Mall, Juja Road, Nairobi',
    -1.2500, 36.8833,
    '+254 712 345 681',
    'eastlands@getdeals.co.ke',
    'Peter Mwangi',
    'active',
    80,
    ARRAY['Public Transport Access', 'Extended Hours', 'Mobile Money Point'],
    'Ground floor near the main entrance, next to the mobile money kiosk.'
);

-- Enable Row Level Security
ALTER TABLE pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_pickup_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pickup_locations
-- Admins can do everything
CREATE POLICY "Admins can manage pickup locations" ON pickup_locations
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM user_profile 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profile 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- All authenticated users can view active pickup locations
CREATE POLICY "Users can view active pickup locations" ON pickup_locations
    FOR SELECT
    TO authenticated
    USING (status = 'active');

-- Create RLS policies for orders_pickup_locations
-- Users can manage their own pickup orders
CREATE POLICY "Users can manage their pickup orders" ON orders_pickup_locations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = orders_pickup_locations.order_id 
            AND orders.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = orders_pickup_locations.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Admins can manage all pickup orders
CREATE POLICY "Admins can manage all pickup orders" ON orders_pickup_locations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profile 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profile 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create helpful views for reporting
CREATE OR REPLACE VIEW pickup_locations_stats AS
SELECT 
    pl.id,
    pl.name,
    pl.status,
    pl.capacity,
    COUNT(opl.id) as total_pickups,
    COUNT(CASE WHEN opl.pickup_status = 'completed' THEN 1 END) as completed_pickups,
    COUNT(CASE WHEN opl.pickup_status = 'pending' THEN 1 END) as pending_pickups,
    COUNT(CASE WHEN opl.pickup_status = 'ready' THEN 1 END) as ready_pickups,
    ROUND(
        (COUNT(CASE WHEN opl.pickup_status = 'completed' THEN 1 END)::decimal / 
         NULLIF(COUNT(opl.id), 0)) * 100, 2
    ) as completion_rate
FROM pickup_locations pl
LEFT JOIN orders_pickup_locations opl ON pl.id = opl.pickup_location_id
GROUP BY pl.id, pl.name, pl.status, pl.capacity
ORDER BY pl.name;

-- Grant permissions to the view
GRANT SELECT ON pickup_locations_stats TO authenticated;

-- Create function to get nearby pickup locations
CREATE OR REPLACE FUNCTION get_nearby_pickup_locations(
    user_lat DECIMAL(10, 8),
    user_lng DECIMAL(11, 8),
    radius_km DECIMAL DEFAULT 10.0,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    distance_km DECIMAL(5, 2),
    capacity INTEGER,
    features TEXT[],
    instructions TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.id,
        pl.name,
        pl.address,
        pl.latitude,
        pl.longitude,
        pl.phone,
        ROUND(
            (6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(pl.latitude)) * 
                cos(radians(pl.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(pl.latitude))
            ))::decimal, 2
        ) as distance_km,
        pl.capacity,
        pl.features,
        pl.instructions
    FROM pickup_locations pl
    WHERE pl.status = 'active'
    AND (
        6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians(pl.latitude)) * 
            cos(radians(pl.longitude) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians(pl.latitude))
        )
    ) <= radius_km
    ORDER BY distance_km
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_nearby_pickup_locations TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE pickup_locations IS 'Store pickup locations for customer order collection';
COMMENT ON TABLE orders_pickup_locations IS 'Link orders to pickup locations with pickup tracking';
COMMENT ON FUNCTION get_nearby_pickup_locations IS 'Find pickup locations within specified radius of user coordinates';
COMMENT ON VIEW pickup_locations_stats IS 'Statistics view for pickup location performance metrics';

-- Migration completed
SELECT 'Pickup locations system migration completed successfully' as result;