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

-- Comment on tables for documentation
COMMENT ON TABLE public.wallets IS 'User wallets for the GetDeals platform integrated with Rukisha';
COMMENT ON COLUMN public.wallets.user_id IS 'Reference to the user who owns this wallet';
COMMENT ON COLUMN public.wallets.balance IS 'Current wallet balance in KES (Kenya Shillings)';
COMMENT ON COLUMN public.wallets.is_active IS 'Whether the wallet has been activated through KYC verification';