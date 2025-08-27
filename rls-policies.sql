-- RLS Policies for GetDeals Kenya Showcase
-- Run this in your Supabase SQL Editor

-- Option 1: Disable RLS for Development (Quick)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- OR Option 2: Create Proper RLS Policies (Recommended for Production)
-- Uncomment the lines below if you prefer proper RLS policies:

/*
-- Allow service role to access everything
CREATE POLICY "Service role can access all products" ON products FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all users" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all orders" ON orders FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all order_items" ON order_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all payments" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all addresses" ON addresses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all payment_methods" ON payment_methods FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all categories" ON categories FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all settings" ON settings FOR ALL TO service_role USING (true);

-- Allow public read access to products and categories
CREATE POLICY "Public can read products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read categories" ON categories FOR SELECT TO anon, authenticated USING (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "Users can read own orders" ON orders FOR SELECT TO authenticated USING (auth.uid()::text = userId);
CREATE POLICY "Users can read own addresses" ON addresses FOR SELECT TO authenticated USING (auth.uid()::text = userId);
CREATE POLICY "Users can read own payment methods" ON payment_methods FOR SELECT TO authenticated USING (auth.uid()::text = userId);
*/
