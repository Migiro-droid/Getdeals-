-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create admin settings table for managing site-wide settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  black_friday_enabled BOOLEAN DEFAULT true,
  black_friday_date TIMESTAMP WITH TIME ZONE DEFAULT '2025-11-28T00:00:00Z',
  maintenance_mode BOOLEAN DEFAULT false,
  support_phone TEXT DEFAULT '+254 700 123 456',
  support_email TEXT DEFAULT 'support@getdeals.co.ke',
  location TEXT DEFAULT 'Karen Green, Nairobi, Kenya',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO public.admin_settings (id) VALUES ('default') 
ON CONFLICT (id) DO NOTHING;

-- Create admin access policies
CREATE POLICY "Public can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure products table has all needed columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS items TEXT[],
ADD COLUMN IF NOT EXISTS items_detail JSONB,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'basket',
ADD COLUMN IF NOT EXISTS discount NUMERIC,
ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Create proper admin policies for products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.first_name || ' ' || profiles.last_name) ILIKE '%admin%'
  )
);

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.first_name || ' ' || profiles.last_name) ILIKE '%admin%'
  )
);

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.first_name || ' ' || profiles.last_name) ILIKE '%admin%'
  )
);

-- Allow admins to update admin_settings
CREATE POLICY "Admins can update settings" 
ON public.admin_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.first_name || ' ' || profiles.last_name) ILIKE '%admin%'
  )
);

-- Create user roles table for better role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create wallet table for persistent wallet functionality
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment')),
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view own wallet" 
ON public.wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" 
ON public.wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" 
ON public.wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Wallet transaction policies
CREATE POLICY "Users can view own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE wallets.id = wallet_transactions.wallet_id 
    AND wallets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE wallets.id = wallet_transactions.wallet_id 
    AND wallets.user_id = auth.uid()
  )
);

-- Add trigger for wallet updated_at
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();