# Simplified Database Setup for Existing Schema

Since you already have a `users` table, here's a simplified setup that works with your existing structure:

## Step 1: Create profiles table (links to Supabase auth)

```sql
-- Create profiles table that references auth.users (Supabase authentication)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (NEW.id, 
            NEW.raw_user_meta_data->>'first_name', 
            NEW.raw_user_meta_data->>'last_name',
            NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## Step 2: Add Rukisha integration (customer_id to profiles)

```sql
-- Add customer_id column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_id TEXT;
COMMENT ON COLUMN public.profiles.customer_id IS 'Rukisha customer ID for wallet integration';

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON public.wallets(is_active);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Wallet policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Step 3: Create wallet_kyc table

```sql
-- Create wallet_kyc table
CREATE TABLE IF NOT EXISTS public.wallet_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    id_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    kra_pin TEXT,
    id_type TEXT NOT NULL DEFAULT 'national_id',
    status TEXT NOT NULL DEFAULT 'pending_verification',
    verified_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for wallet_kyc
CREATE INDEX IF NOT EXISTS wallet_kyc_user_id_idx ON public.wallet_kyc(user_id);
CREATE INDEX IF NOT EXISTS wallet_kyc_status_idx ON public.wallet_kyc(status);

-- Enable RLS
ALTER TABLE public.wallet_kyc ENABLE ROW LEVEL SECURITY;

-- KYC policies
DROP POLICY IF EXISTS "Users can view own KYC data" ON public.wallet_kyc;
CREATE POLICY "Users can view own KYC data" ON public.wallet_kyc
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own KYC data" ON public.wallet_kyc;
CREATE POLICY "Users can insert own KYC data" ON public.wallet_kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending KYC data" ON public.wallet_kyc;
CREATE POLICY "Users can update own pending KYC data" ON public.wallet_kyc
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_verification')
    WITH CHECK (auth.uid() = user_id);
```

## Step 4: Create triggers and functions

```sql
-- Function to create wallet when profile is created
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, is_active)
    VALUES (NEW.user_id, 0, false)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet
DROP TRIGGER IF EXISTS trigger_create_wallet_for_user ON public.profiles;
CREATE TRIGGER trigger_create_wallet_for_user
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_wallet_kyc_updated_at ON public.wallet_kyc;
CREATE TRIGGER update_wallet_kyc_updated_at 
    BEFORE UPDATE ON public.wallet_kyc 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Important Notes:

1. **Your existing `users` table** - This remains untouched and can be used for your app's business logic
2. **New `profiles` table** - This links to Supabase `auth.users` (required for authentication)
3. **Wallets and KYC** - These reference `auth.users` for proper authentication integration

## Instructions:

1. Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw
2. Navigate to **SQL Editor**
3. Run each step in order
4. Your Rukisha integration will work with both your existing `users` table and the new auth system

The key difference: 
- Your `users` table (with text ID) = Your app's business logic
- `profiles` table (with UUID) = Links to Supabase authentication
- `wallets` & `wallet_kyc` = Rukisha integration (uses auth UUIDs)