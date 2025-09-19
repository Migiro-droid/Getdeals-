import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          organization TEXT,
          role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
          "emailVerified" BOOLEAN NOT NULL DEFAULT false,
          "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
          "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Create products table
        CREATE TABLE IF NOT EXISTS public.products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          "originalPrice" DECIMAL(10,2),
          category TEXT NOT NULL,
          "imageUrl" TEXT,
          "inStock" BOOLEAN NOT NULL DEFAULT true,
          tags TEXT[],
          featured BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Create orders table
        CREATE TABLE IF NOT EXISTS public.orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          total DECIMAL(10,2) NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
          items JSONB NOT NULL,
          "shippingAddress" JSONB,
          "paymentMethod" TEXT,
          "paymentStatus" TEXT NOT NULL DEFAULT 'pending' CHECK ("paymentStatus" IN ('pending', 'paid', 'failed', 'refunded')),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
        DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
        DROP POLICY IF EXISTS "Public can view products" ON public.products;
        DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
        DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
        DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

        -- Users policies
        CREATE POLICY "Users can view own profile" ON public.users
          FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Admins can view all users" ON public.users
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        CREATE POLICY "Admins can update all users" ON public.users
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        -- Products policies
        CREATE POLICY "Public can view products" ON public.products
          FOR SELECT USING (true);
        
        CREATE POLICY "Admins can manage products" ON public.products
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        -- Orders policies
        CREATE POLICY "Users can view own orders" ON public.orders
          FOR SELECT USING (auth.uid() = "userId");
        
        CREATE POLICY "Admins can view all orders" ON public.orders
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        CREATE POLICY "Users can create orders" ON public.orders
          FOR INSERT WITH CHECK (auth.uid() = "userId");
        
        CREATE POLICY "Admins can update orders" ON public.orders
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
        CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
        CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders("userId");
        CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

        -- Create triggers for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON public.users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
        CREATE TRIGGER update_products_updated_at
          BEFORE UPDATE ON public.products
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
        CREATE TRIGGER update_orders_updated_at
          BEFORE UPDATE ON public.orders
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (usersError) {
      console.error('Database setup error:', usersError);
      return;
    }

    console.log('Database schema created successfully!');
    
    // Test the setup
    console.log('Testing database setup...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('Test failed:', tablesError);
    } else {
      console.log('Users table accessible!');
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (productsError) {
      console.error('Products test failed:', productsError);
    } else {
      console.log('Products table accessible!');
    }

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();
