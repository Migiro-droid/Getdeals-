-- =====================================================
-- FIX ORDERS SYSTEM - Database View & Columns
-- =====================================================
-- Run this in Supabase SQL Editor to ensure orders display correctly in admin panel

-- First, let's ensure the orders table has the correct structure
-- Check if we need to add any missing columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_reference TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS order_items JSONB;

-- Create index on order_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- =====================================================
-- CREATE OR REPLACE THE orders_with_details VIEW
-- =====================================================
-- This view combines order data with items for the admin panel

CREATE OR REPLACE VIEW public.orders_with_details AS
SELECT 
  o.id,
  o.order_reference,
  o.user_id,
  o.customer_email,
  o.customer_name,
  o.customer_phone,
  
  -- Convert cents to KES (divide by 100)
  -- Handle both old (in KES) and new (in cents) data
  CASE 
    WHEN o.total > 100000 THEN o.total / 100.0  -- If > 1000 KES, it's likely in cents
    ELSE o.total 
  END as total_amount_kes,
  
  CASE 
    WHEN o.subtotal > 100000 THEN o.subtotal / 100.0
    ELSE o.subtotal 
  END as subtotal_kes,
  
  CASE 
    WHEN o.delivery_fee > 10000 THEN o.delivery_fee / 100.0
    ELSE o.delivery_fee 
  END as delivery_fee_kes,
  
  o.status,
  o.payment_status,
  o.payment_method,
  o.delivery_method,
  
  -- Handle delivery address (could be JSON or text)
  CASE 
    WHEN jsonb_typeof(o.delivery_address) = 'object' THEN o.delivery_address->>'address'
    ELSE o.delivery_address::text
  END as delivery_address,
  
  CASE 
    WHEN jsonb_typeof(o.delivery_address) = 'object' THEN o.delivery_address->>'pickup_location'
    ELSE NULL
  END as pickup_location,
  
  o.payment_reference,
  o.notes,
  o.created_at,
  o.updated_at,
  
  -- Extract M-Pesa receipt from notes if it exists
  CASE 
    WHEN o.notes LIKE '%M-Pesa Receipt:%' THEN 
      regexp_replace(
        substring(o.notes from 'M-Pesa Receipt: ([^,]+)'),
        '[^A-Z0-9]',
        '',
        'g'
      )
    ELSE NULL
  END as mpesa_receipt_number,
  
  -- Get order items from order_items table or from order_items JSONB column
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.product_id,
          'name', oi.product_name,
          'quantity', oi.quantity,
          'price', CASE 
            WHEN oi.price > 100000 THEN oi.price / 100.0
            ELSE oi.price 
          END
        )
      )
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ),
    o.order_items,
    '[]'::jsonb
  ) as items

FROM public.orders o
WHERE o.order_reference IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.orders_with_details TO authenticated;
GRANT SELECT ON public.orders_with_details TO anon;
GRANT SELECT ON public.orders_with_details TO service_role;

-- =====================================================
-- VERIFY THE SETUP
-- =====================================================
-- Run these queries to verify everything is working:

-- 1. Check if view was created successfully
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'orders_with_details'
) as view_exists;

-- 2. Check sample data from the view
SELECT 
  order_reference,
  customer_name,
  total_amount_kes,
  status,
  payment_status,
  created_at
FROM public.orders_with_details
ORDER BY created_at DESC
LIMIT 5;

-- 3. Count orders by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount_kes) as total_revenue
FROM public.orders_with_details
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- OPTIONAL: Fix existing data if amounts are in wrong format
-- =====================================================
-- Only run this if you have existing orders with amounts in wrong format

-- Check if any orders have suspiciously high amounts (likely in cents when should be in KES)
-- SELECT COUNT(*) FROM public.orders WHERE total > 1000000; -- More than 10,000 KES

-- If you find such orders, you can fix them (UNCOMMENT to run):
-- UPDATE public.orders 
-- SET 
--   total = total / 100.0,
--   subtotal = subtotal / 100.0,
--   delivery_fee = delivery_fee / 100.0
-- WHERE total > 1000000;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Your orders system should now be working correctly.
-- Test by:
-- 1. Placing a new order through checkout
-- 2. Checking the admin orders page
-- 3. Verifying the order appears with correct amounts
