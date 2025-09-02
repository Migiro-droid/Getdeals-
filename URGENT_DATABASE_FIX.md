# 🚨 CRITICAL SETUP ISSUE IDENTIFIED

## The Problem
The Prisma schema and Supabase table structure are mismatched. Prisma created tables with different column names and constraints than what your application expects.

## 🔧 IMMEDIATE FIX REQUIRED

You need to execute this SQL script in your **Supabase SQL Editor** to completely reset and fix the schema:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your **red-umbrella** project (fxyifnckgllxqbggegtw)
3. Go to **SQL Editor** in the sidebar

### Step 2: Execute This Complete Reset Script

```sql
-- ===== COMPLETE DATABASE RESET FOR GETDEALS KENYA =====
-- This will drop all existing tables and recreate them correctly

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop ALL existing tables (including Prisma-created ones)
DROP TABLE IF EXISTS public."Product" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Order" CASCADE;
DROP TABLE IF EXISTS public."OrderItem" CASCADE;
DROP TABLE IF EXISTS public."Payment" CASCADE;
DROP TABLE IF EXISTS public."Address" CASCADE;
DROP TABLE IF EXISTS public."PaymentMethod" CASCADE;
DROP TABLE IF EXISTS public."Category" CASCADE;
DROP TABLE IF EXISTS public."Setting" CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Create products table with correct structure
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT,
  discount NUMERIC,
  items TEXT[] DEFAULT '{}',
  items_detail JSONB,
  category TEXT DEFAULT 'basket',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  total NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  delivery_method TEXT DEFAULT 'standard',
  delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create liberal policies for testing
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- Insert sample data
INSERT INTO public.categories (name, slug, description, is_active, sort_order) VALUES
  ('Baskets', 'baskets', 'Complete food baskets for families', true, 1),
  ('Essential', 'essential', 'Essential daily items', true, 2),
  ('Family', 'family', 'Family-sized products', true, 3),
  ('Holiday', 'holiday', 'Holiday special items', true, 4),
  ('School', 'school', 'School and student items', true, 5),
  ('Black Friday', 'blackfriday', 'Black Friday special deals', true, 6);

-- Insert sample products
INSERT INTO public.products (name, price, original_price, image, category, description, items) VALUES
  ('Essential Family Basket', 2500, 3000, '/essential-basket.jpg', 'baskets', 'Complete family basket with essential items for a week', ARRAY['Rice 2kg', 'Maize flour 2kg', 'Cooking oil 1L', 'Sugar 1kg', 'Tea leaves 250g']),
  ('Premium Family Basket', 4500, 5500, '/family-basket.jpg', 'baskets', 'Premium family basket with high-quality items', ARRAY['Rice 5kg', 'Wheat flour 2kg', 'Cooking oil 2L', 'Sugar 2kg', 'Tea leaves 500g', 'Milk 1L']),
  ('Student Essentials Pack', 1200, 1500, '/placeholder.svg', 'school', 'Essential items for students', ARRAY['Rice 1kg', 'Maize flour 1kg', 'Cooking oil 500ml', 'Sugar 500g']);

-- Verify the setup
SELECT 'Schema reset and seeded successfully!' as status, COUNT(*) as product_count FROM public.products;
```

### Step 3: After Running the Script
Run this command to test the connection:

```bash
npx tsx scripts/verify-supabase-connection.ts
```

You should see:
- ✅ All environment variables set
- ✅ Database connection successful  
- ✅ All required tables exist
- ✅ Products found in database

### Step 4: Test API Endpoints
After the schema is fixed, test your API:

```bash
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/products
```

## ⚠️ Why This Happened
Prisma created tables with PascalCase names (`"Product"`) while your Supabase client expects snake_case (`products`). The reset script above fixes this mismatch.

## 🎯 Expected Result
After executing the script:
- ✅ 3 sample products in the database
- ✅ 6 categories available
- ✅ All tables with correct column names and types
- ✅ Working API endpoints

**Execute the SQL script above in Supabase SQL Editor now!** 🚀
