-- ============================================================================
-- RLS Policy Fix for Order Tracking - Migration
-- Date: 2025-10-27
-- Problem: Service role couldn't access orders due to RLS configuration
-- Solution: Add explicit service role policies and fix UUID comparisons
-- ============================================================================

-- ============================================================================
-- 1. ORDERS TABLE - RLS POLICIES
-- ============================================================================

-- Start fresh: disable and re-enable RLS
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;

-- Policy 1: Service role (backend APIs) can do EVERYTHING
-- This is CRITICAL for the tracking endpoint to work
CREATE POLICY "Service role full access to orders" ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Authenticated users can view their own orders
CREATE POLICY "Authenticated users view own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text
    OR auth.role() = 'service_role'
  );

-- Policy 3: Authenticated users can insert orders (for checkout)
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    OR auth.role() = 'service_role'
  );

-- Policy 4: Authenticated users can update their own orders
CREATE POLICY "Authenticated users can update own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Policy 5: Authenticated users can delete their own orders
CREATE POLICY "Authenticated users can delete own orders" ON public.orders
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- 2. ORDER_ITEMS TABLE - RLS POLICIES
-- ============================================================================

-- Start fresh: disable and re-enable RLS
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items for their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Service role full access to order items" ON public.order_items;

-- Policy 1: Service role (backend APIs) can do EVERYTHING
CREATE POLICY "Service role full access to order items" ON public.order_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can view order items from their own orders
CREATE POLICY "Users view items from own orders" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id::text = auth.uid()::text
    )
    OR auth.role() = 'service_role'
  );

-- Policy 3: Users can insert items for their own orders
CREATE POLICY "Users can insert items for own orders" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id::text = auth.uid()::text
    )
    OR auth.role() = 'service_role'
  );

-- Policy 4: Users can update items in their own orders (if needed)
CREATE POLICY "Users can update items in own orders" ON public.order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id::text = auth.uid()::text
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 3. PAYMENTS TABLE - RLS POLICIES (for consistency)
-- ============================================================================

-- Ensure payments table has proper RLS for service role
DROP POLICY IF EXISTS "Service role full access to payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

CREATE POLICY "Service role full access to payments" ON public.payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. IMPORTANT INDEXES (for performance with RLS policies)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_id ON public.orders(id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- ============================================================================
-- 5. GRANT STATEMENTS (ensure proper access)
-- ============================================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;

-- Grant full permissions to service role (for backend APIs)
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.payments TO service_role;

-- ============================================================================
-- 6. COMMENTS (for documentation)
-- ============================================================================

COMMENT ON POLICY "Service role full access to orders" ON public.orders IS
  'Service role (used by backend APIs) has unrestricted access to all orders';

COMMENT ON POLICY "Authenticated users view own orders" ON public.orders IS
  'Authenticated users can only see their own orders (where user_id matches auth.uid())';

COMMENT ON POLICY "Authenticated users can create orders" ON public.orders IS
  'Authenticated users can create orders where they are the user_id';

COMMENT ON POLICY "Service role full access to order items" ON public.order_items IS
  'Service role (used by backend APIs) has unrestricted access to all order items';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- 
-- VERIFICATION: Run these queries to confirm RLS is working:
--
-- 1. Check RLS status:
--    SELECT schemaname, tablename, rowsecurity FROM pg_tables 
--    WHERE tablename IN ('orders', 'order_items', 'payments');
--
-- 2. List all policies:
--    SELECT * FROM pg_policies WHERE tablename = 'orders';
--
-- 3. Verify service role policy exists:
--    SELECT policyname FROM pg_policies 
--    WHERE tablename = 'orders' AND policyname LIKE '%Service role%';
--
-- ============================================================================
