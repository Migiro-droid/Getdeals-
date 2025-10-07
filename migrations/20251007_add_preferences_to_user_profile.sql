-- Migration: Add preferences and onboarding_completed columns to user_profile
-- Date: 2025-10-07
-- Purpose: Store user preferences and onboarding status in database

-- Add preferences column (stores JSON string of user preferences)
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS preferences TEXT;

-- Add onboarding_completed column (tracks if user completed initial setup)
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profile.preferences IS 'JSON string of user preferences (shopping habits, dietary requirements, etc.)';
COMMENT ON COLUMN public.user_profile.onboarding_completed IS 'Whether user has completed initial onboarding/preferences setup';

-- Create index for querying users by onboarding status
CREATE INDEX IF NOT EXISTS idx_user_profile_onboarding_completed 
ON public.user_profile(onboarding_completed);

-- Update the handle_new_user_profile function to include preferences
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
    
    -- Insert user_profile with organization fields AND preferences
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
                preferences,
                onboarding_completed,
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
                COALESCE(NEW.raw_user_meta_data->>'preferences', ''),
                COALESCE((NEW.raw_user_meta_data->>'onboardingCompleted')::boolean, false),
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
                preferences = COALESCE(NEW.raw_user_meta_data->>'preferences', preferences),
                onboarding_completed = COALESCE((NEW.raw_user_meta_data->>'onboardingCompleted')::boolean, onboarding_completed),
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

-- Migration verification
DO $$
DECLARE
    preferences_column_exists BOOLEAN;
    onboarding_column_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Check if preferences column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profile'
        AND column_name = 'preferences'
    ) INTO preferences_column_exists;
    
    -- Check if onboarding_completed column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profile'
        AND column_name = 'onboarding_completed'
    ) INTO onboarding_column_exists;
    
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profile'
        AND indexname = 'idx_user_profile_onboarding_completed'
    ) INTO index_exists;
    
    RAISE NOTICE '=== PREFERENCES MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Preferences column: %', CASE WHEN preferences_column_exists THEN '✅ ADDED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Onboarding column: %', CASE WHEN onboarding_column_exists THEN '✅ ADDED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Onboarding index: %', CASE WHEN index_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    
    IF preferences_column_exists AND onboarding_column_exists AND index_exists THEN
        RAISE NOTICE '🎉 Preferences migration completed successfully!';
        RAISE NOTICE '📋 User preferences will now be saved to database';
    ELSE
        RAISE WARNING '⚠️ Migration may be incomplete - please check manually';
    END IF;
END $$;
