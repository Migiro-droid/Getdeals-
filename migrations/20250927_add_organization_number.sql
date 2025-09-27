-- Migration: Add organization_number field to profiles table
-- Date: 2025-09-27
-- Purpose: Add organization number field for ecosystem users with validation

-- Add organization_number column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.organization_number IS 'Unique organization number for business users - required for ecosystem registration';

-- Create unique index for organization number validation
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_organization_number_unique 
ON public.profiles(organization_number) 
WHERE organization_number IS NOT NULL AND organization_number != '';

-- Create index for better performance on organization number queries
CREATE INDEX IF NOT EXISTS idx_profiles_organization_number 
ON public.profiles(organization_number);

-- Update the handle_new_user trigger function to handle organization_number column safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists BOOLEAN := FALSE;
    wallet_exists BOOLEAN := FALSE;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = NEW.id) INTO profile_exists;
    
    -- Insert or update profile with organization fields
    IF NOT profile_exists THEN
        BEGIN
            INSERT INTO public.profiles (
                id,
                user_id,
                first_name,
                last_name,
                phone,
                organization,
                organization_number,
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
                COALESCE(NEW.raw_user_meta_data->>'organization_number', ''),
                COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                current_time,
                current_time
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
                organization_number = COALESCE(NEW.raw_user_meta_data->>'organization_number', organization_number),
                email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, email_verified),
                updated_at = current_time
            WHERE user_id = NEW.id;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update profile for user %: %', NEW.id, SQLERRM;
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
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migration verification
DO $$
DECLARE
    column_exists BOOLEAN;
    unique_index_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if organization_number column was added
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'organization_number'
    ) INTO column_exists;
    
    -- Check if unique index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        AND indexname = 'idx_profiles_organization_number_unique'
    ) INTO unique_index_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
        AND event_object_table = 'users'
    ) INTO trigger_exists;
    
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Organization number column: %', CASE WHEN column_exists THEN '✅ ADDED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Unique index: %', CASE WHEN unique_index_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Auth trigger: %', CASE WHEN trigger_exists THEN '✅ ACTIVE' ELSE '❌ MISSING' END;
    
    IF column_exists AND unique_index_exists AND trigger_exists THEN
        RAISE NOTICE '🎉 Migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️ Migration may be incomplete - please check manually';
    END IF;
END $$;