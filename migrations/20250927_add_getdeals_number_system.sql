-- Migration: Add GetDeals number system for user identification
-- Date: 2025-09-27
-- Purpose: Implement unique GetDeals numbers for user identification and wallet mapping

-- Add getdeals_number column to user_profile table
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS getdeals_number TEXT UNIQUE;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profile.getdeals_number IS 'Unique GetDeals identification number (format: GD-XXXXXX)';

-- Create unique index for getdeals_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profile_getdeals_number_unique 
ON public.user_profile(getdeals_number) 
WHERE getdeals_number IS NOT NULL;

-- Create index for better performance on getdeals_number queries
CREATE INDEX IF NOT EXISTS idx_user_profile_getdeals_number 
ON public.user_profile(getdeals_number);

-- Add getdeals_number column to wallets table for direct mapping
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS getdeals_number TEXT;

-- Add foreign key constraint linking wallets to user_profile via getdeals_number
-- Note: We'll create this after backfilling data

-- Create sequence for GetDeals number generation
CREATE SEQUENCE IF NOT EXISTS getdeals_number_seq START 100001;

-- Create function to generate GetDeals number
CREATE OR REPLACE FUNCTION public.generate_getdeals_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    getdeals_id TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        -- Get next number from sequence
        SELECT nextval('getdeals_number_seq') INTO next_number;
        
        -- Format as GD-XXXXXX (6 digits, zero-padded)
        getdeals_id := 'GD-' || LPAD(next_number::TEXT, 6, '0');
        
        -- Check if this number already exists (shouldn't happen with sequence, but safety check)
        IF NOT EXISTS (SELECT 1 FROM public.user_profile WHERE getdeals_number = getdeals_id) THEN
            RETURN getdeals_id;
        END IF;
        
        -- Safety: prevent infinite loop
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique GetDeals number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- Update the user profile creation trigger to include GetDeals number generation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists BOOLEAN := FALSE;
    wallet_exists BOOLEAN := FALSE;
    current_time TIMESTAMPTZ := NOW();
    new_getdeals_number TEXT;
BEGIN
    -- Check if user_profile already exists
    SELECT EXISTS(SELECT 1 FROM public.user_profile WHERE user_id = NEW.id) INTO profile_exists;
    
    -- Generate GetDeals number
    new_getdeals_number := generate_getdeals_number();
    
    -- Insert user_profile with organization fields and GetDeals number
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
                getdeals_number,
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
                new_getdeals_number,
                COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                COALESCE(NEW.phone_confirmed_at IS NOT NULL, false),
                current_time,
                current_time
            );
            
            RAISE NOTICE 'Created user_profile for user % with GetDeals number %', NEW.id, new_getdeals_number;
        EXCEPTION 
            WHEN OTHERS THEN
                -- Log error but don't fail user creation
                RAISE WARNING 'Failed to create user_profile for user %: %', NEW.id, SQLERRM;
                RETURN NEW;
        END;
    ELSE
        -- Update existing user_profile (but don't change GetDeals number if it exists)
        BEGIN
            UPDATE public.user_profile SET
                first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
                last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
                full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'name', full_name)),
                phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
                email = COALESCE(NEW.email, email),
                organization = COALESCE(NEW.raw_user_meta_data->>'organization', organization),
                organization_number = COALESCE(NEW.raw_user_meta_data->>'organization_number', organization_number),
                getdeals_number = COALESCE(getdeals_number, new_getdeals_number), -- Only set if null
                email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, email_verified),
                phone_verified = COALESCE(NEW.phone_confirmed_at IS NOT NULL, phone_verified),
                updated_at = current_time
            WHERE user_id = NEW.id;
            
            -- Get the GetDeals number for wallet creation
            SELECT getdeals_number INTO new_getdeals_number 
            FROM public.user_profile 
            WHERE user_id = NEW.id;
            
            RAISE NOTICE 'Updated user_profile for user % with GetDeals number %', NEW.id, new_getdeals_number;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update user_profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    -- Create wallet if it doesn't exist, with GetDeals number mapping
    SELECT EXISTS(SELECT 1 FROM public.wallets WHERE user_id = NEW.id) INTO wallet_exists;
    
    IF NOT wallet_exists THEN
        BEGIN
            INSERT INTO public.wallets (
                user_id,
                getdeals_number,
                balance,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                new_getdeals_number,
                0,
                false,
                current_time,
                current_time
            );
            
            RAISE NOTICE 'Created wallet for user % with GetDeals number %', NEW.id, new_getdeals_number;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
        END;
    ELSE
        -- Update existing wallet with GetDeals number if missing
        BEGIN
            UPDATE public.wallets SET
                getdeals_number = COALESCE(getdeals_number, new_getdeals_number),
                updated_at = current_time
            WHERE user_id = NEW.id AND getdeals_number IS NULL;
            
            RAISE NOTICE 'Updated wallet for user % with GetDeals number %', NEW.id, new_getdeals_number;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update wallet for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to backfill GetDeals numbers for existing users
CREATE OR REPLACE FUNCTION public.backfill_getdeals_numbers()
RETURNS TABLE (
    user_id UUID,
    getdeals_number TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    new_getdeals_number TEXT;
    affected_profiles INTEGER := 0;
    affected_wallets INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting GetDeals number backfill process...';
    
    -- Process all user profiles without GetDeals numbers
    FOR user_record IN 
        SELECT up.user_id, up.id as profile_id
        FROM public.user_profile up
        WHERE up.getdeals_number IS NULL
        ORDER BY up.created_at ASC
    LOOP
        -- Generate new GetDeals number
        new_getdeals_number := generate_getdeals_number();
        
        -- Update user profile
        UPDATE public.user_profile 
        SET 
            getdeals_number = new_getdeals_number,
            updated_at = NOW()
        WHERE user_id = user_record.user_id;
        
        affected_profiles := affected_profiles + 1;
        
        -- Update corresponding wallet
        UPDATE public.wallets 
        SET 
            getdeals_number = new_getdeals_number,
            updated_at = NOW()
        WHERE user_id = user_record.user_id;
        
        IF FOUND THEN
            affected_wallets := affected_wallets + 1;
        END IF;
        
        -- Return progress
        user_id := user_record.user_id;
        getdeals_number := new_getdeals_number;
        status := 'SUCCESS';
        RETURN NEXT;
        
        -- Log progress every 100 records
        IF affected_profiles % 100 = 0 THEN
            RAISE NOTICE 'Processed % profiles, % wallets...', affected_profiles, affected_wallets;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Backfill complete: % profiles updated, % wallets updated', affected_profiles, affected_wallets;
    RETURN;
END;
$$;

-- Function to lookup user by GetDeals number
CREATE OR REPLACE FUNCTION public.get_user_by_getdeals_number(lookup_number TEXT)
RETURNS TABLE (
    user_id UUID,
    getdeals_number TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    organization TEXT,
    wallet_balance DECIMAL,
    wallet_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.getdeals_number,
        up.full_name,
        up.email,
        up.phone,
        up.organization,
        w.balance,
        w.is_active
    FROM public.user_profile up
    LEFT JOIN public.wallets w ON up.user_id = w.user_id
    WHERE up.getdeals_number = lookup_number;
END;
$$;

-- Function to validate GetDeals number format
CREATE OR REPLACE FUNCTION public.validate_getdeals_number(number_to_validate TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Check format: GD-XXXXXX (6 digits)
    RETURN number_to_validate ~ '^GD-[0-9]{6}$';
END;
$$;

-- Add check constraint for GetDeals number format
ALTER TABLE public.user_profile 
ADD CONSTRAINT check_getdeals_number_format 
CHECK (getdeals_number IS NULL OR validate_getdeals_number(getdeals_number));

-- Migration verification
DO $$
DECLARE
    profile_column_exists BOOLEAN;
    wallet_column_exists BOOLEAN;
    sequence_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check if getdeals_number column was added to user_profile
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profile' 
        AND column_name = 'getdeals_number'
    ) INTO profile_column_exists;
    
    -- Check if getdeals_number column was added to wallets
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'wallets' 
        AND column_name = 'getdeals_number'
    ) INTO wallet_column_exists;
    
    -- Check if sequence exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND sequence_name = 'getdeals_number_seq'
    ) INTO sequence_exists;
    
    -- Check if generation function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'generate_getdeals_number'
    ) INTO function_exists;
    
    RAISE NOTICE '=== GETDEALS NUMBER SYSTEM MIGRATION VERIFICATION ===';
    RAISE NOTICE 'GetDeals number column (user_profile): %', CASE WHEN profile_column_exists THEN '✅ ADDED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'GetDeals number column (wallets): %', CASE WHEN wallet_column_exists THEN '✅ ADDED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'GetDeals number sequence: %', CASE WHEN sequence_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'Number generation function: %', CASE WHEN function_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    
    IF profile_column_exists AND wallet_column_exists AND sequence_exists AND function_exists THEN
        RAISE NOTICE '🎉 GetDeals number system migration completed successfully!';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Next steps:';
        RAISE NOTICE '1. Run backfill: SELECT * FROM backfill_getdeals_numbers();';
        RAISE NOTICE '2. Test lookup: SELECT * FROM get_user_by_getdeals_number(''GD-100001'');';
        RAISE NOTICE '3. Verify linkage between GetDeals number ↔ wallet';
    ELSE
        RAISE WARNING '⚠️ Migration may be incomplete - please check manually';
    END IF;
END $$;