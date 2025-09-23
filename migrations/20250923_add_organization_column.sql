-- Migration: Add organization column to profiles table
-- Date: 2025-09-23
-- Purpose: Fix PGRST204 error by adding missing organization column

-- Add organization column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.organization IS 'Organization name for business users - added to fix PGRST204 schema cache error';

-- Create index for better performance on organization queries
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization);

-- Update the handle_new_user trigger function to handle organization column safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists BOOLEAN := FALSE;
    wallet_exists BOOLEAN := FALSE;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = NEW.id) INTO profile_exists;
    
    -- Insert or update profile with organization column
    IF NOT profile_exists THEN
        BEGIN
            INSERT INTO public.profiles (
                id,
                user_id,
                first_name,
                last_name,
                phone,
                organization,
                email_verified,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'phone', ''),
                COALESCE(NEW.raw_user_meta_data->>'organization', ''),
                COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                NOW(),
                NOW()
            );
        EXCEPTION 
            WHEN OTHERS THEN
                -- Log error but don't fail user creation
                RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
                RETURN NEW;
        END;
    ELSE
        -- Update existing profile
        BEGIN
            UPDATE public.profiles SET
                first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
                last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
                phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
                organization = COALESCE(NEW.raw_user_meta_data->>'organization', organization),
                email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, email_verified),
                updated_at = NOW()
            WHERE user_id = NEW.id;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    -- Create wallet if it doesn't exist
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
                0.00,
                false,
                NOW(),
                NOW()
            );
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Ultimate fallback - never fail user creation
        RAISE WARNING 'handle_new_user function failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Migration verification
DO $$
DECLARE
    column_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if organization column was added
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'organization'
    ) INTO column_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
        AND event_object_table = 'users'
    ) INTO trigger_exists;
    
    IF column_exists AND trigger_exists THEN
        RAISE NOTICE '✅ Migration completed successfully: organization column added and trigger updated';
    ELSE
        RAISE WARNING '⚠️ Migration may have issues: column_exists=%, trigger_exists=%', column_exists, trigger_exists;
    END IF;
END $$;