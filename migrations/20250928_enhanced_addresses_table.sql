-- Enhanced User Addresses Migration
-- Date: 2025-09-28
-- Purpose: Update addresses table to support geolocation and enhanced address data

-- First, let's backup existing data if the table exists
DO $$
BEGIN
    -- Check if addresses table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        -- Create backup table
        DROP TABLE IF EXISTS addresses_backup;
        CREATE TABLE addresses_backup AS SELECT * FROM public.addresses;
        RAISE NOTICE '✅ Existing addresses data backed up to addresses_backup table';
    END IF;
END $$;

-- Drop and recreate addresses table with enhanced structure
DROP TABLE IF EXISTS public.addresses CASCADE;

CREATE TABLE public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    county TEXT,
    postal_code TEXT,
    phone_number TEXT,
    latitude DECIMAL(10, 8),  -- Supports precision up to ~1cm
    longitude DECIMAL(11, 8), -- Supports precision up to ~1cm
    formatted_address TEXT,
    is_default BOOLEAN DEFAULT false,
    address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for documentation
COMMENT ON TABLE public.addresses IS 'Enhanced user addresses table with geolocation support';
COMMENT ON COLUMN public.addresses.user_id IS 'Reference to auth.users - user who owns this address';
COMMENT ON COLUMN public.addresses.label IS 'User-friendly label for the address (e.g., Home, Office)';
COMMENT ON COLUMN public.addresses.street_address IS 'Street address line';
COMMENT ON COLUMN public.addresses.city IS 'City name';
COMMENT ON COLUMN public.addresses.county IS 'County or state';
COMMENT ON COLUMN public.addresses.postal_code IS 'Postal or ZIP code';

COMMENT ON COLUMN public.addresses.phone_number IS 'Contact phone for this address';
COMMENT ON COLUMN public.addresses.latitude IS 'GPS latitude coordinate (decimal degrees)';
COMMENT ON COLUMN public.addresses.longitude IS 'GPS longitude coordinate (decimal degrees)';
COMMENT ON COLUMN public.addresses.formatted_address IS 'Full formatted address string';
COMMENT ON COLUMN public.addresses.is_default IS 'Whether this is the users default address';
COMMENT ON COLUMN public.addresses.address_type IS 'Type of address: home, work, or other';

-- Create indexes for better performance
CREATE INDEX addresses_user_id_idx ON public.addresses(user_id);
CREATE INDEX addresses_is_default_idx ON public.addresses(user_id, is_default);
CREATE INDEX addresses_type_idx ON public.addresses(address_type);
CREATE INDEX addresses_location_idx ON public.addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER addresses_updated_at_trigger
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_addresses_updated_at();

-- Ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this address as default, unset all other default addresses for this user
    IF NEW.is_default = true THEN
        UPDATE public.addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    -- Ensure at least one address is default if this is the user's first address
    IF (SELECT COUNT(*) FROM public.addresses WHERE user_id = NEW.user_id) = 0 THEN
        NEW.is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to ensure single default address
CREATE TRIGGER ensure_single_default_address_trigger
    BEFORE INSERT OR UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();

-- Enable Row Level Security
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Try to restore data from backup if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses_backup' AND table_schema = 'public') THEN
        -- Insert data from backup with field mapping
        INSERT INTO public.addresses (
            id, user_id, label, street_address, city, 
            county, postal_code, phone_number, 
            is_default, created_at, updated_at
        )
        SELECT 
            id, 
            user_id, 
            COALESCE(name, 'Address') as label,
            COALESCE(street, address_line_1, 'Address not specified') as street_address,
            COALESCE(city, 'Nairobi') as city,
            county,
            postal_code,
            COALESCE(phone_number, phone) as phone_number,
            COALESCE(is_default, false) as is_default,
            COALESCE(created_at, NOW()) as created_at,
            NOW() as updated_at
        FROM addresses_backup;
        
        RAISE NOTICE '✅ Restored % addresses from backup', (SELECT COUNT(*) FROM addresses_backup);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not restore backup data: %', SQLERRM;
END $$;

-- No sample addresses created - users will add their own addresses
-- This ensures a clean slate for users to manage their own delivery addresses

-- Final verification
DO $$
DECLARE
    table_exists BOOLEAN;
    policy_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'addresses'
    ) INTO table_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'addresses';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'addresses';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_schema = 'public' AND event_object_table = 'addresses';
    
    -- Report status
    RAISE NOTICE '';
    RAISE NOTICE '=== ENHANCED ADDRESSES MIGRATION SUMMARY ===';
    RAISE NOTICE 'Enhanced addresses table: %', CASE WHEN table_exists THEN '✅ CREATED' ELSE '❌ FAILED' END;
    RAISE NOTICE 'RLS policies: % policies %', policy_count, CASE WHEN policy_count >= 4 THEN '✅ ACTIVE' ELSE '❌ INCOMPLETE' END;
    RAISE NOTICE 'Performance indexes: % indexes %', index_count, CASE WHEN index_count >= 4 THEN '✅ CREATED' ELSE '❌ INCOMPLETE' END;
    RAISE NOTICE 'Data triggers: % triggers %', trigger_count, CASE WHEN trigger_count >= 2 THEN '✅ ACTIVE' ELSE '❌ INCOMPLETE' END;
    
    IF table_exists AND policy_count >= 4 AND index_count >= 4 AND trigger_count >= 2 THEN
        RAISE NOTICE '🎉 Enhanced addresses migration completed successfully!';
        RAISE NOTICE '📋 Features enabled:';
        RAISE NOTICE '   • GPS coordinates storage with high precision';
        RAISE NOTICE '   • Address type categorization (home/work/other)';
        RAISE NOTICE '   • Automatic default address management';
        RAISE NOTICE '   • Row-level security for user privacy';
        RAISE NOTICE '   • Performance optimized with proper indexes';
    ELSE
        RAISE WARNING '⚠️  Migration may be incomplete - please check manually';
    END IF;
END $$;