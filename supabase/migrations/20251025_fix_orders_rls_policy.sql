-- Fix RLS policy for orders table to properly handle UUID comparison with anon key
-- The original policy didn't work with anon key because auth.uid() needs to be cast

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create a new policy that properly compares UUIDs
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id::text = auth.uid()::text
  );

-- Drop the old insert policy
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;

-- Create a new policy for inserting orders
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text
  );

-- Drop the old update policy
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create a new policy for updating orders
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (
    user_id::text = auth.uid()::text
  );

-- Also ensure service role can manage orders for API calls
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;

CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL USING (true);
