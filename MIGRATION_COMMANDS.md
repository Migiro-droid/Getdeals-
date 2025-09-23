# Database Migration Commands

Run these SQL commands in your Supabase SQL Editor in this order:

## Step 1: Create wallet_kyc table

```sql
-- Create wallet_kyc table for storing KYC verification data
CREATE TABLE IF NOT EXISTS wallet_kyc (
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
CREATE INDEX IF NOT EXISTS wallet_kyc_user_id_idx ON wallet_kyc(user_id);
CREATE INDEX IF NOT EXISTS wallet_kyc_status_idx ON wallet_kyc(status);
CREATE INDEX IF NOT EXISTS wallet_kyc_created_at_idx ON wallet_kyc(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE wallet_kyc ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own KYC data
CREATE POLICY "Users can view own KYC data" ON wallet_kyc
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own KYC data
CREATE POLICY "Users can insert own KYC data" ON wallet_kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own KYC data (but only if pending)
CREATE POLICY "Users can update own pending KYC data" ON wallet_kyc
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_verification')
    WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_kyc_updated_at 
    BEFORE UPDATE ON wallet_kyc 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Add Rukisha integration columns

```sql
-- Add customer_id to profiles table and is_active to wallets table for Rukisha integration

-- Add customer_id column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN customer_id TEXT;
        COMMENT ON COLUMN public.profiles.customer_id IS 'Rukisha customer ID for wallet integration';
    END IF;
END $$;

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance NUMERIC DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_active column to wallets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'wallets' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.wallets ADD COLUMN is_active BOOLEAN DEFAULT false NOT NULL;
        COMMENT ON COLUMN public.wallets.is_active IS 'Whether the wallet is activated and ready for use';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);
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
```

## Instructions:

1. Go to https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw
2. Navigate to **SQL Editor**
3. Copy and paste **Step 1** SQL code and run it
4. Wait for it to complete successfully
5. Copy and paste **Step 2** SQL code and run it
6. Verify the tables were created by checking **Database** → **Tables**

After running these migrations, your Rukisha integration should work properly!