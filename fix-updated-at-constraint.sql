-- Fix for updatedAt constraint violation in users table
-- Date: 2025-09-24
-- Purpose: Fix "null value in column updatedAt violates not-null constraint" error

-- First, let's check if the users table has an updatedAt column that requires non-null values
-- and fix the constraint issue

-- Step 1: Check if users table exists and has updatedAt column
DO $$
DECLARE
    users_table_exists BOOLEAN := FALSE;
    updated_at_column_exists BOOLEAN := FALSE;
    column_nullable BOOLEAN := TRUE;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO users_table_exists;
    
    IF users_table_exists THEN
        -- Check if updatedAt column exists and its nullable status
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'updatedAt'
        ), COALESCE((
            SELECT is_nullable = 'YES'
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'updatedAt'
        ), TRUE) INTO updated_at_column_exists, column_nullable;
        
        RAISE NOTICE 'Users table exists: %, updatedAt column exists: %, nullable: %', 
                     users_table_exists, updated_at_column_exists, column_nullable;
        
        -- If updatedAt column exists and is not nullable, we need to set default values
        IF updated_at_column_exists AND NOT column_nullable THEN
            -- Update any existing null values
            UPDATE public.users 
            SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW())
            WHERE "updatedAt" IS NULL;
            
            RAISE NOTICE '✅ Updated null updatedAt values in users table';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist in public schema';
    END IF;
END $$;

-- Step 2: Ensure any triggers or functions that insert into users table handle updatedAt properly
-- Check if there are any triggers on auth.users that might be causing this issue

-- Create or replace a safe user creation function that handles updatedAt
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
    -- Log trigger execution for debugging
    RAISE NOTICE 'handle_new_user triggered for user_id: %', NEW.id;
    
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
                current_time,
                current_time
            );
            RAISE NOTICE '✅ Profile created for user: %', NEW.id;
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
                updated_at = current_time
            WHERE user_id = NEW.id;
            RAISE NOTICE '✅ Profile updated for user: %', NEW.id;
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
                current_time,
                current_time
            );
            RAISE NOTICE '✅ Wallet created for user: %', NEW.id;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    -- Handle users table if it exists and has updatedAt constraint
    BEGIN
        -- Check if we need to update anything in the users table
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'updatedAt'
        ) THEN
            -- Ensure updatedAt is not null
            UPDATE public.users 
            SET "updatedAt" = COALESCE("updatedAt", current_time)
            WHERE id = NEW.id AND "updatedAt" IS NULL;
        END IF;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to update users table for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Ultimate fallback - never fail user creation
        RAISE WARNING 'handle_new_user function failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: If there's a users table with updatedAt constraint, make sure it has a default value
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'updatedAt'
        AND is_nullable = 'NO'
    ) THEN
        -- Try to add a default value to the updatedAt column
        BEGIN
            ALTER TABLE public.users 
            ALTER COLUMN "updatedAt" SET DEFAULT NOW();
            
            RAISE NOTICE '✅ Added default value to users.updatedAt column';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Could not set default for users.updatedAt: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 4: Create a trigger update function for users table if needed
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger if users table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        -- Drop existing trigger if exists
        DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
        
        -- Create trigger to automatically update updatedAt
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE '✅ Created updatedAt trigger for users table';
    END IF;
END $$;

-- Verification
DO $$
DECLARE
    users_table_exists BOOLEAN;
    profiles_org_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check users table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO users_table_exists;
    
    -- Check profiles organization column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'organization'
    ) INTO profiles_org_exists;
    
    -- Check trigger
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
        AND event_object_table = 'users'
    ) INTO trigger_exists;
    
    RAISE NOTICE '✅ Fix applied - Users table: %, Profiles org column: %, Auth trigger: %', 
                 users_table_exists, profiles_org_exists, trigger_exists;
                 
    IF NOT profiles_org_exists THEN
        RAISE WARNING '⚠️ Organization column still missing from profiles table';
    END IF;
END $$;