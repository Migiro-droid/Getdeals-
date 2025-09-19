-- Add organization column to existing users table
-- Run this SQL script in Supabase SQL Editor if you have an existing database

-- For users table (if you're using the users table structure)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'organization' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.users ADD COLUMN organization TEXT;
        COMMENT ON COLUMN public.users.organization IS 'User organization/company';
    END IF;
END $$;

-- For profiles table (if you're using the profiles table structure)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'organization' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN organization TEXT;
        COMMENT ON COLUMN public.profiles.organization IS 'User organization/company';
    END IF;
END $$;

-- Update the handle_new_user function to include organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If using profiles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    INSERT INTO public.profiles (id, user_id, first_name, last_name, phone, organization, email_verified)
    VALUES (
      NEW.id,
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'organization',
      NEW.email_confirmed_at IS NOT NULL
    );
  -- If using users table
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    INSERT INTO public.users (id, email, name, phone, organization, role, "emailVerified")
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'organization',
      'customer',
      NEW.email_confirmed_at IS NOT NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;