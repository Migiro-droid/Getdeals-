-- Fix Duplicate Users Email Key Constraint Error
-- This error occurs when the auth trigger tries to create duplicate user records
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check for duplicate entries in auth.users that might be causing issues
SELECT email, COUNT(*) as count 
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Fix the handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO public.profiles (
    id, 
    user_id, 
    email, 
    first_name, 
    last_name,
    email_verified,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = NEW.id
  );
  
  -- Create wallet entry if it doesn't exist
  INSERT INTO public.wallets (
    user_id,
    balance,
    is_active,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    0,
    false, -- Will be activated after KYC
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.wallets WHERE user_id = NEW.id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Clean up any orphaned profiles (profiles without corresponding auth users)
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. Ensure current user has proper profile setup
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current authenticated user (this might not work in SQL editor)
    -- If this fails, manually replace with your user ID
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Ensure profile exists for current user
        INSERT INTO public.profiles (
            id, 
            user_id, 
            email,
            first_name,
            email_verified,
            created_at,
            updated_at,
            customer_id
        )
        SELECT 
            u.id,
            u.id,
            u.email,
            COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(u.email, '@', 1)),
            u.email_confirmed_at IS NOT NULL,
            NOW(),
            NOW(),
            'customer_' || u.id::text
        FROM auth.users u
        WHERE u.id = current_user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE user_id = current_user_id
        );
        
        -- Ensure customer_id is set
        UPDATE public.profiles 
        SET 
            customer_id = COALESCE(customer_id, 'customer_' || user_id::text),
            updated_at = NOW()
        WHERE user_id = current_user_id 
        AND (customer_id IS NULL OR customer_id = '');
        
        RAISE NOTICE 'Profile setup completed for user: %', current_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found. Profile setup skipped.';
    END IF;
END $$;

-- 6. Verify the setup
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
    'Profiles' as table_name,
    COUNT(*) as count
FROM public.profiles

UNION ALL

SELECT 
    'Profiles with customer_id' as table_name,
    COUNT(*) as count
FROM public.profiles 
WHERE customer_id IS NOT NULL

UNION ALL

SELECT 
    'Verified KYC Records' as table_name,
    COUNT(*) as count
FROM public.wallet_kyc 
WHERE status = 'verified';