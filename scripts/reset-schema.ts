import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAndCreateSchema() {
  console.log('🔄 Resetting database schema...');
  
  try {
    // First, let's check what tables exist
    const { data: existingTables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('⚠️ Could not check existing tables, proceeding with schema creation...');
    } else {
      console.log('📋 Existing tables:', existingTables);
    }

    // Execute the schema creation script
    console.log('📝 Creating new schema...');
    
    const schemaSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT,
  discount NUMERIC,
  items TEXT[],
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

-- Create addresses table
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  postal_code TEXT,
  landmark TEXT,
  phone_number TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  phone_number TEXT,
  reference TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read, authenticated write)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Service role can manage products" ON public.products FOR ALL USING (auth.role() = 'service_role');

-- Create policies for categories (public read, authenticated write)  
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Service role can manage categories" ON public.categories FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Insert default categories
INSERT INTO public.categories (name, slug, description, is_active, sort_order) VALUES
  ('Baskets', 'baskets', 'Complete food baskets for families', true, 1),
  ('Essential', 'essential', 'Essential daily items', true, 2),
  ('Family', 'family', 'Family-sized products', true, 3),
  ('Holiday', 'holiday', 'Holiday special items', true, 4),
  ('School', 'school', 'School and student items', true, 5),
  ('Black Friday', 'blackfriday', 'Black Friday special deals', true, 6);
`;

    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      console.error('❌ Schema creation failed:', error);
      return false;
    }

    console.log('✅ Schema created successfully!');
    
    // Now seed with sample products
    console.log('🌱 Seeding sample products...');
    
    const sampleProducts = [
      {
        name: "Essential Family Basket",
        price: 2500,
        original_price: 3000,
        image: "/essential-basket.jpg",
        category: "baskets",
        description: "Complete family basket with essential items for a week",
        items: ["Rice 2kg", "Maize flour 2kg", "Cooking oil 1L", "Sugar 1kg", "Tea leaves 250g"]
      },
      {
        name: "Premium Family Basket",
        price: 4500,
        original_price: 5500,
        image: "/family-basket.jpg",
        category: "baskets",
        description: "Premium family basket with high-quality items",
        items: ["Rice 5kg", "Wheat flour 2kg", "Cooking oil 2L", "Sugar 2kg", "Tea leaves 500g", "Milk 1L"]
      }
    ];

    for (const product of sampleProducts) {
      const { error: insertError } = await supabase
        .from('products')
        .insert([product]);
      
      if (insertError) {
        console.error(`❌ Failed to insert ${product.name}:`, insertError);
      } else {
        console.log(`✅ Added: ${product.name}`);
      }
    }

    // Verify
    const { data: products, error: countError } = await supabase
      .from('products')
      .select('*');
    
    if (countError) {
      console.error('❌ Failed to verify:', countError);
    } else {
      console.log(`🎉 Setup complete! ${products.length} products in database`);
    }
    
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// Check if we have the exec_sql function, if not use direct SQL
async function executeSQL(sql: string) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return data;
  } catch (error) {
    // If exec_sql doesn't exist, we'll need to execute via raw SQL
    console.log('ℹ️ Using alternative method to execute SQL...');
    throw error;
  }
}

if (require.main === module) {
  resetAndCreateSchema().catch(console.error);
}

export { resetAndCreateSchema };
