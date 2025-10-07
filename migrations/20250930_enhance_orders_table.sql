-- Migration to enhance orders table with all required fields for proper order management
-- This ensures we capture all necessary information for each order

-- First, let's add missing columns to the orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_reference TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB; -- Store order items as JSON
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount BIGINT; -- Store in cents for precision
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_location TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference TEXT; -- Transaction ID from payment provider
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_request_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS merchant_request_id TEXT;

-- Enhance order_items table with additional fields
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price BIGINT; -- Store in cents
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS total_price BIGINT; -- Store in cents
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing columns to use BIGINT for precision (store amounts in cents)
-- Note: This will convert existing NUMERIC values to BIGINT (multiply by 100)
ALTER TABLE public.orders ALTER COLUMN total TYPE BIGINT USING (total * 100)::BIGINT;
ALTER TABLE public.orders ALTER COLUMN subtotal TYPE BIGINT USING (subtotal * 100)::BIGINT;
ALTER TABLE public.orders ALTER COLUMN delivery_fee TYPE BIGINT USING (delivery_fee * 100)::BIGINT;

-- Update order_items price to BIGINT
ALTER TABLE public.order_items ALTER COLUMN price TYPE BIGINT USING (price * 100)::BIGINT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_request_id ON orders(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_orders_updated_at_column();

-- Create a view for easy order monitoring with payment details
CREATE OR REPLACE VIEW public.orders_with_payments_view AS
SELECT 
  o.id,
  o.order_reference,
  o.user_id,
  o.customer_email,
  o.customer_name,
  o.customer_phone,
  o.total_amount / 100.0 as total_amount_kes, -- Convert from cents to KES
  o.subtotal / 100.0 as subtotal_kes,
  o.delivery_fee / 100.0 as delivery_fee_kes,
  o.status,
  o.payment_status,
  o.payment_method,
  o.delivery_method,
  o.delivery_address,
  o.pickup_location,
  o.payment_reference,
  o.mpesa_receipt_number,
  o.checkout_request_id,
  o.items,
  o.created_at,
  o.updated_at,
  p.transaction_id as payment_transaction_id,
  p.status as payment_record_status,
  p.processed_at as payment_processed_at
FROM orders o
LEFT JOIN payments p ON o.checkout_request_id = p.transaction_id
ORDER BY o.created_at DESC;

-- Create another view for order items with product details
CREATE OR REPLACE VIEW public.order_items_detailed_view AS
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.product_name,
  oi.quantity,
  oi.unit_price / 100.0 as unit_price_kes,
  oi.total_price / 100.0 as total_price_kes,
  oi.product_image,
  oi.created_at,
  o.order_reference,
  o.customer_name,
  o.status as order_status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
ORDER BY oi.created_at DESC;

-- Grant permissions
ALTER VIEW public.orders_with_payments_view OWNER TO postgres;
ALTER VIEW public.order_items_detailed_view OWNER TO postgres;
GRANT SELECT ON public.orders_with_payments_view TO authenticated;
GRANT SELECT ON public.orders_with_payments_view TO service_role;
GRANT SELECT ON public.order_items_detailed_view TO authenticated;
GRANT SELECT ON public.order_items_detailed_view TO service_role;

-- Update RLS policies for orders to allow service role to manage orders
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL USING (true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage order items
CREATE POLICY "Service role can manage order items" ON public.order_items
  FOR ALL USING (true);

-- Users can view order items for their own orders
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );