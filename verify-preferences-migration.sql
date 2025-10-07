-- Verification Script for Preferences Migration
-- Run this in Supabase SQL Editor to confirm everything works

-- 1. Check if columns were added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profile'
    AND column_name IN ('preferences', 'onboarding_completed')
ORDER BY column_name;

-- Expected output:
-- column_name          | data_type | is_nullable | column_default
-- ---------------------|-----------|-------------|----------------
-- onboarding_completed | boolean   | YES         | false
-- preferences          | text      | YES         | NULL


-- 2. Check if index was created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename = 'user_profile'
    AND indexname = 'idx_user_profile_onboarding_completed';

-- Expected: 1 row with the index definition


-- 3. Check current user_profile table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profile'
ORDER BY ordinal_position;

-- Should show all columns including the new ones


-- 4. Test: View existing user data (should see new empty columns)
SELECT 
    email,
    organization,
    preferences,
    onboarding_completed,
    created_at
FROM public.user_profile
LIMIT 5;

-- New columns should appear (likely NULL/false for existing users)


-- 5. Check the updated trigger function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'handle_new_user_profile';

-- Should show the function exists


-- 6. Quick summary check
DO $$
DECLARE
    prefs_col_exists BOOLEAN;
    onboard_col_exists BOOLEAN;
    index_exists BOOLEAN;
    user_count INTEGER;
BEGIN
    -- Check columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profile'
        AND column_name = 'preferences'
    ) INTO prefs_col_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profile'
        AND column_name = 'onboarding_completed'
    ) INTO onboard_col_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profile'
        AND indexname = 'idx_user_profile_onboarding_completed'
    ) INTO index_exists;
    
    SELECT COUNT(*) INTO user_count FROM public.user_profile;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '     MIGRATION VERIFICATION RESULTS    ';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Preferences column added: %', CASE WHEN prefs_col_exists THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE 'Onboarding column added:  %', CASE WHEN onboard_col_exists THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE 'Index created:            %', CASE WHEN index_exists THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Total users in table:     %', user_count;
    RAISE NOTICE '';
    
    IF prefs_col_exists AND onboard_col_exists AND index_exists THEN
        RAISE NOTICE '🎉 SUCCESS! Migration completed perfectly!';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Next steps:';
        RAISE NOTICE '   1. Test user preferences saving in your app';
        RAISE NOTICE '   2. Log in with Google OAuth and set preferences';
        RAISE NOTICE '   3. Log out and back in - preferences should persist';
    ELSE
        RAISE WARNING '⚠️  ISSUE DETECTED - Some components missing!';
        RAISE WARNING 'Please review the migration and try again.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
