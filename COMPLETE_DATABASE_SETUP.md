# Complete Database Setup - Run in Order

⚠️ **IMPORTANT**: Run these SQL commands in your Supabase SQL Editor **in this exact order**:

## Step 1: Create Basic Schema (profiles table)

```sql
-- Your users table already exists with TEXT id, so we'll work with that structure

-- Create profiles table that references auth.users (using UUID for auth compatibility)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
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
    INSERT INTO public.profiles (user_id, first_name, last_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
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

## Step 2: Add Rukisha Integration Columns

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON public.wallets(is_active);

-- Enable Row Level Security on wallets table
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets table
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Step 3: Create wallet_kyc table

```sql
-- Create wallet_kyc table for storing KYC verification data
CREATE TABLE IF NOT EXISTS public.wallet_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraint to auth.users
    CONSTRAINT wallet_kyc_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS wallet_kyc_user_id_idx ON public.wallet_kyc(user_id);
CREATE INDEX IF NOT EXISTS wallet_kyc_status_idx ON public.wallet_kyc(status);
CREATE INDEX IF NOT EXISTS wallet_kyc_created_at_idx ON public.wallet_kyc(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.wallet_kyc ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own KYC data
DROP POLICY IF EXISTS "Users can view own KYC data" ON public.wallet_kyc;
CREATE POLICY "Users can view own KYC data" ON public.wallet_kyc
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own KYC data
DROP POLICY IF EXISTS "Users can insert own KYC data" ON public.wallet_kyc;
CREATE POLICY "Users can insert own KYC data" ON public.wallet_kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own KYC data (but only if pending)
DROP POLICY IF EXISTS "Users can update own pending KYC data" ON public.wallet_kyc;
CREATE POLICY "Users can update own pending KYC data" ON public.wallet_kyc
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_verification')
    WITH CHECK (auth.uid() = user_id);
```

## Step 4: Create Helper Functions and Triggers

```sql
-- Function to automatically create wallet when user profile is created
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a wallet for the new user
    INSERT INTO public.wallets (user_id, balance, is_active)
    VALUES (NEW.user_id, 0, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create wallet when profile is created
DROP TRIGGER IF EXISTS trigger_create_wallet_for_user ON public.profiles;
CREATE TRIGGER trigger_create_wallet_for_user
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Add trigger for updated_at timestamp on wallet_kyc
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

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.wallets IS 'User wallets for the GetDeals platform integrated with Rukisha';
COMMENT ON TABLE public.wallet_kyc IS 'Store KYC (Know Your Customer) data for wallet activation';
COMMENT ON COLUMN public.wallets.is_active IS 'Whether the wallet has been activated through KYC verification';
COMMENT ON COLUMN public.wallet_kyc.status IS 'Verification status: pending_verification, verified, or rejected';
```

## Instructions:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw
2. **Navigate to SQL Editor**
3. **Run each step in order** (copy-paste each step and run it)
4. **Wait for each step to complete** before moving to the next
5. **Verify tables were created** by checking **Database** → **Tables**

You should see these tables after completion:
- ✅ `profiles`
- ✅ `wallets` 
- ✅ `wallet_kyc`
- ✅ `users` (optional, for app logic)

After running all steps, your Rukisha integration will work properly!