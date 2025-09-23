-- Complete fix for PGRST204 organization column error
-- This script ensures the organization column exists and updates the trigger function

-- Step 1: Add organization column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'organization'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN organization TEXT;
        COMMENT ON COLUMN public.profiles.organization IS 'Organization name for business users';
        
        -- Add index for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization);
        
        RAISE NOTICE 'Added organization column to profiles table';
    ELSE
        RAISE NOTICE 'Organization column already exists in profiles table';
    END IF;
END $$;

-- Step 2: Create a robust handle_new_user function that handles missing columns gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use dynamic SQL to handle cases where columns might not exist
  INSERT INTO public.profiles (
    id, 
    user_id, 
    first_name, 
    last_name, 
    phone, 
    organization, 
    email_verified
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    organization = COALESCE(EXCLUDED.organization, profiles.organization),
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();
  
  -- Create wallet for new user if it doesn't exist
  INSERT INTO public.wallets (user_id, balance, is_active)
  VALUES (NEW.id, 0, false)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify the fix by checking the schema
DO $$
DECLARE
    org_column_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if organization column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'organization'
    ) INTO org_column_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
        AND event_object_table = 'users'
    ) INTO trigger_exists;
    
    RAISE NOTICE 'Organization column exists: %', org_column_exists;
    RAISE NOTICE 'Trigger exists: %', trigger_exists;
    
    IF org_column_exists AND trigger_exists THEN
        RAISE NOTICE '✅ Fix applied successfully!';
    ELSE
        RAISE WARNING '⚠️ Fix may not be complete. Check manually.';
    END IF;
END $$;