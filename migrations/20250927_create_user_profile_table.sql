-- Migration: Create user_profile table for basic user data
-- Date: 2025-09-27
-- Purpose: Separate user profile data from KYC profiles table

-- Create user_profile table for basic user information
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    organization TEXT,
    organization_number TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for documentation
COMMENT ON TABLE public.user_profile IS 'Basic user profile data separate from KYC profiles';
COMMENT ON COLUMN public.user_profile.user_id IS 'Reference to auth.users - unique per user';
COMMENT ON COLUMN public.user_profile.organization IS 'User organization name';
COMMENT ON COLUMN public.user_profile.organization_number IS 'Unique organization number for business users';
COMMENT ON COLUMN public.user_profile.email_verified IS 'Whether user email has been verified';
COMMENT ON COLUMN public.user_profile.phone_verified IS 'Whether user phone has been verified';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON public.user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON public.user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_phone ON public.user_profile(phone);
CREATE INDEX IF NOT EXISTS idx_user_profile_organization ON public.user_profile(organization);

-- Create unique index for organization number validation (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profile_organization_number_unique 
ON public.user_profile(organization_number) 
WHERE organization_number IS NOT NULL AND organization_number != '';

-- Enable Row Level Security
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profile table
-- Users can view their own profile
CREATE POLICY "Users can view own user_profile" ON public.user_profile
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile (for initial creation)
CREATE POLICY "Users can insert own user_profile" ON public.user_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own user_profile" ON public.user_profile
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all profiles (for admin operations)
CREATE POLICY "Service role can manage user_profiles" ON public.user_profile
    FOR ALL USING (current_setting('role') = 'service_role');

-- Create trigger function for handling new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists BOOLEAN := FALSE;
    wallet_exists BOOLEAN := FALSE;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Check if user_profile already exists
    SELECT EXISTS(SELECT 1 FROM public.user_profile WHERE user_id = NEW.id) INTO profile_exists;
    
    -- Insert user_profile with organization fields
    IF NOT profile_exists THEN
        BEGIN
            INSERT INTO public.user_profile (
                user_id,
                first_name,
                last_name,
                full_name,
                phone,
                email,
                organization,
                organization_number,
                email_verified,
                phone_verified,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'name', '')),
                COALESCE(NEW.raw_user_meta_data->>'phone', ''),
                COALESCE(NEW.email, ''),
                COALESCE(NEW.raw_user_meta_data->>'organization', ''),
                COALESCE(NEW.raw_user_meta_data->>'organization_number', ''),
                COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                COALESCE(NEW.phone_confirmed_at IS NOT NULL, false),
                current_time,
                current_time
            );
            
            RAISE NOTICE 'Created user_profile for user %', NEW.id;
        EXCEPTION 
            WHEN OTHERS THEN
                -- Log error but don't fail user creation
                RAISE WARNING 'Failed to create user_profile for user %: %', NEW.id, SQLERRM;
                RETURN NEW;
        END;
    ELSE
        -- Update existing user_profile
        BEGIN
            UPDATE public.user_profile SET
                first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
                last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
                full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'name', full_name)),
                phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
                email = COALESCE(NEW.email, email),
                organization = COALESCE(NEW.raw_user_meta_data->>'organization', organization),
                organization_number = COALESCE(NEW.raw_user_meta_data->>'organization_number', organization_number),
                email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, email_verified),
                phone_verified = COALESCE(NEW.phone_confirmed_at IS NOT NULL, phone_verified),
                updated_at = current_time
            WHERE user_id = NEW.id;
            
            RAISE NOTICE 'Updated user_profile for user %', NEW.id;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update user_profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    -- Create wallet if it doesn't exist (keeping existing wallet logic)
    SELECT EXISTS(SELECT 1 FROM public.wallets WHERE user_id = NEW.id) INTO wallet_exists;
    
    IF NOT wallet_exists THEN
        BEGIN
            INSERT INTO public.wallets (
                user_id,
                balance,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                0,
                false,
                current_time,
                current_time
            );
            
            RAISE NOTICE 'Created wallet for user %', NEW.id;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to user_profile table
CREATE TRIGGER handle_user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create the main auth trigger (replace existing if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Migration verification
DO $$
DECLARE
    table_exists BOOLEAN;
    unique_index_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if user_profile table was created
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profile'
    ) INTO table_exists;
    
    -- Check if unique index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profile'
        AND indexname = 'idx_user_profile_organization_number_unique'
    ) INTO unique_index_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
        AND event_object_table = 'users'
    ) INTO trigger_exists;
    
    RAISE NOTICE '=== USER_PROFILE MIGRATION VERIFICATION ===';
    RAISE NOTICE 'User profile table: %', CASE WHEN table_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Unique org number index: %', CASE WHEN unique_index_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Auth trigger: %', CASE WHEN trigger_exists THEN '✅ ACTIVE' ELSE '❌ MISSING' END;
    
    IF table_exists AND unique_index_exists AND trigger_exists THEN
        RAISE NOTICE '🎉 User profile migration completed successfully!';
        RAISE NOTICE '📋 Next: Update frontend to use user_profile table instead of profiles';
    ELSE
        RAISE WARNING '⚠️ Migration may be incomplete - please check manually';
    END IF;
END $$;