-- Fix Orders System - Recreate View Properly
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing view (views can be dropped, not altered like tables)
DROP VIEW IF EXISTS public.orders_with_details CASCADE;

-- Step 2: Make sure the orders table has the correct structure
-- First check if we need to add any missing columns to the orders table

-- Add columns if they don't exist (this won't fail if columns already exist)
DO $$ 
BEGIN
    -- Add order_reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='order_reference') THEN
        ALTER TABLE public.orders ADD COLUMN order_reference TEXT;
    END IF;

    -- Add customer_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='customer_email') THEN
        ALTER TABLE public.orders ADD COLUMN customer_email TEXT;
    END IF;

    -- Add customer_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    END IF;

    -- Add customer_phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='customer_phone') THEN
        ALTER TABLE public.orders ADD COLUMN customer_phone TEXT;
    END IF;

    -- Add order_items if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='order_items') THEN
        ALTER TABLE public.orders ADD COLUMN order_items JSONB;
    END IF;

    -- Add subtotal if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE public.orders ADD COLUMN subtotal INTEGER DEFAULT 0;
    END IF;

    -- Add delivery_fee if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_fee') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_fee INTEGER DEFAULT 0;
    END IF;

    -- Add total_amount if it doesn't exist (compatible with both total and total_amount)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='total_amount') THEN
        -- Check if 'total' column exists first
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='total') THEN
            -- Rename 'total' to 'total_amount' if it exists
            ALTER TABLE public.orders RENAME COLUMN total TO total_amount;
        ELSE
            -- Add total_amount if neither exists
            ALTER TABLE public.orders ADD COLUMN total_amount INTEGER NOT NULL DEFAULT 0;
        END IF;
    END IF;

    -- Add payment_method if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'mpesa';
    END IF;

    -- Add payment_reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='payment_reference') THEN
        ALTER TABLE public.orders ADD COLUMN payment_reference TEXT;
    END IF;

    -- Add delivery_method if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_method') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_method TEXT DEFAULT 'standard';
    END IF;

    -- Add delivery_address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_address') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_address JSONB;
    END IF;

    -- Add pickup_location if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='pickup_location') THEN
        ALTER TABLE public.orders ADD COLUMN pickup_location TEXT;
    END IF;

    -- Add delivery_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_date') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='notes') THEN
        ALTER TABLE public.orders ADD COLUMN notes TEXT;
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='orders' AND column_name='updated_at') THEN
        ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;

END $$;

-- Step 3: Update unique constraint on order_reference if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_order_reference_key' 
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_order_reference_key UNIQUE (order_reference);
    END IF;
END $$;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Step 5: NOW recreate the view with the correct columns
CREATE OR REPLACE VIEW public.orders_with_details AS
SELECT 
    o.id,
    o.user_id,
    o.order_reference,
    o.customer_email,
    o.customer_name,
    o.customer_phone,
    o.order_items,
    o.subtotal,
    o.delivery_fee,
    o.total_amount,
    o.payment_method,
    o.payment_reference,
    o.payment_status,
    o.delivery_method,
    o.delivery_address,
    o.pickup_location,
    o.delivery_date,
    o.status,
    o.notes,
    o.created_at,
    o.updated_at,
    -- Join with users table if it exists
    COALESCE(u.name, o.customer_name) as user_name,
    COALESCE(u.email, o.customer_email) as user_email,
    COALESCE(u.phone, o.customer_phone) as user_phone
FROM public.orders o
LEFT JOIN public.users u ON o.user_id = u.id::text;

-- Step 6: Grant permissions on the view
GRANT SELECT ON public.orders_with_details TO anon, authenticated, service_role;

-- Step 7: Verify the view was created
SELECT 
    'View created successfully!' as status,
    COUNT(*) as total_orders
FROM public.orders_with_details;

-- Show sample data
SELECT 
    order_reference,
    customer_name,
    customer_email,
    total_amount,
    status,
    payment_status,
    created_at
FROM public.orders_with_details
ORDER BY created_at DESC
LIMIT 5;
