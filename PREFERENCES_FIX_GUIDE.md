# Preferences Not Saving - Database Fix

## Problem Identified ✅
The `user_profile` table is **missing** the `preferences` column that your code expects.

### Current State:
```
user_profile table columns:
✅ id, user_id, first_name, last_name, email, phone
✅ organization, organization_number
❌ preferences (MISSING!)
❌ onboarding_completed (MISSING!)
```

### Where Preferences Are Currently Stored:
1. ✅ **Supabase Auth Metadata** - `user.user_metadata.preferences` (Working)
2. ❌ **Database Table** - `user_profile.preferences` (Column doesn't exist!)
3. 🆘 **localStorage** - Fallback only when both above fail

## The Fix

### Step 1: Run the Migration
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of:
   ```
   migrations/20251007_add_preferences_to_user_profile.sql
   ```
5. Click **Run**

### Step 2: Verify the Fix
After running the migration, check:

```sql
-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profile' 
AND column_name IN ('preferences', 'onboarding_completed');
```

Expected result:
```
column_name          | data_type
---------------------|----------
preferences          | text
onboarding_completed | boolean
```

### Step 3: Test User Preferences
1. Log in as a Google OAuth user
2. Complete the preferences checklist
3. Log out and log back in
4. ✅ Preferences should NOT ask again

## What This Migration Does

### Adds Two Columns:
1. **`preferences`** (TEXT)
   - Stores JSON string of user preferences
   - Example: `{"dietary":["vegetarian"],"family_size":"medium"}`

2. **`onboarding_completed`** (BOOLEAN)
   - Tracks if user finished initial setup
   - Prevents showing preferences modal repeatedly

### Updates the Trigger:
- The `handle_new_user_profile()` function now syncs preferences from auth metadata to database
- When auth user is created/updated, preferences automatically sync

## Why This Happened

The original `user_profile` table migration (`20250927_create_user_profile_table.sql`) was created **before** the preferences feature was added. The code was updated to save preferences, but the database schema wasn't updated to match.

## Next Steps

1. ✅ Apply the migration in Supabase
2. ✅ Test with a new Google OAuth login
3. ✅ Verify preferences persist across sessions
4. ✅ Check that `user_profile` table now has data in the `preferences` column

## Debugging

### Check if migration was successful:
```sql
-- Should return 2 rows
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profile' 
AND column_name IN ('preferences', 'onboarding_completed');
```

### Check existing user data:
```sql
-- See what's currently in the table
SELECT 
    email, 
    preferences, 
    onboarding_completed,
    created_at
FROM user_profile
LIMIT 10;
```

### Check auth metadata:
```sql
-- Compare with auth metadata
SELECT 
    email,
    raw_user_meta_data->>'preferences' as auth_preferences,
    raw_user_meta_data->>'onboardingCompleted' as auth_onboarding
FROM auth.users
LIMIT 10;
```

## Files Changed

- ✅ **Created**: `migrations/20251007_add_preferences_to_user_profile.sql`
- 📝 **Existing**: `src/contexts/AuthContext.tsx` (already tries to save preferences)
- 📝 **Existing**: `src/components/PostSignupChecklist.tsx` (already tries to save preferences)

The code was correct - just the database schema was incomplete! 🎯
