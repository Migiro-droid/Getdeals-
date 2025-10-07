-- Create Orders Table with all required columns
-- Run this in Supabase SQL Editor

-- Only drop and recreate orders-related tables (keep existing payments table!)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP VIEW IF EXISTS public.orders_with_details CASCADE;

-- Create the orders table (payments table will be left untouched)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_reference TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    
    -- Order Items (JSON for flexibility)
    order_items JSONB,
    
    -- Amounts (stored as integers in cents/smallest currency unit)
    subtotal INTEGER DEFAULT 0,
    delivery_fee INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    
    -- Payment Information
    payment_method TEXT DEFAULT 'mpesa',
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Delivery Information
    delivery_method TEXT DEFAULT 'standard',
    delivery_address JSONB,
    delivery_date TIMESTAMP WITH TIME ZONE,
    
    -- Order Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    
    -- Additional Information
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_items table for normalized order items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL, -- in cents/smallest currency unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to existing payments table (if they don't exist)
-- This preserves existing payment data while adding required columns

-- Add order_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'order_id') THEN
        ALTER TABLE public.payments ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'phone') THEN
        ALTER TABLE public.payments ADD COLUMN phone TEXT;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'updated_at') THEN
        ALTER TABLE public.payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON public.orders(order_reference);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Create a view for orders with details (for admin listing)
CREATE OR REPLACE VIEW public.orders_with_details AS
SELECT 
    o.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'price', oi.price
            )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::json
    ) as items,
    COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Create RLS (Row Level Security) policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payments table if not already enabled
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'payments' AND c.relrowsecurity) THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Allow service role to access everything (for API operations)
CREATE POLICY "Service role can access all orders" ON public.orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all order items" ON public.order_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all payments" ON public.payments
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous access for order creation (you can tighten this later)
CREATE POLICY "Anonymous can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous can create payments" ON public.payments
    FOR INSERT WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to payments table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert some test data (optional)
-- Uncomment the following if you want test data

/*
INSERT INTO public.orders (
    user_id, 
    order_reference, 
    customer_email, 
    customer_name, 
    customer_phone,
    subtotal,
    delivery_fee,
    total,
    status,
    payment_status,
    created_at
) VALUES 
(
    'test-user-1', 
    'GD12345678', 
    'test@example.com', 
    'Test Customer',
    '254712345678',
    1000, -- KES 10.00
    200,  -- KES 2.00 delivery
    1200, -- KES 12.00 total
    'confirmed',
    'completed',
    now()
);

-- Get the order ID for order items
INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price)
SELECT 
    id,
    'prod-1',
    'Test Product 1',
    2,
    500 -- KES 5.00 each
FROM public.orders WHERE order_reference = 'GD12345678';
*/

-- Grant necessary permissions
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;
GRANT ALL ON public.payments TO anon, authenticated, service_role;
GRANT SELECT ON public.orders_with_details TO anon, authenticated, service_role;

-- Success message
SELECT 'Orders table and related tables created successfully!' as message;