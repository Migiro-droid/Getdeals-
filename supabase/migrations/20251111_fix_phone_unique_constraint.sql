-- Fix phone UNIQUE constraint to allow multiple NULL values
-- This allows users to sign up without providing a phone number

-- Drop the old UNIQUE constraint on phone
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Create a partial unique index that only applies to non-NULL phone values
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique_not_null
  ON public.profiles(phone)
  WHERE phone IS NOT NULL;
