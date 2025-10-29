-- Migration to ensure orders table has all required columns for order creation
-- This migration adds missing columns if they don't exist
-- Run this if you get "column not found" errors

-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_reference TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0;

-- Ensure these columns exist with proper defaults
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mpesa';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'standard';

-- Timestamps (should already exist but ensure they do)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Ensure order_items has required columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
