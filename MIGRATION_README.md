# Database Migrations

## Migration: 20250923_add_organization_column.sql

### Purpose
Fix PGRST204 error "Could not find the 'organization' column of 'users' in the schema cache" by adding the missing organization column to the profiles table.

### Changes Made
1. **Added organization column** to `public.profiles` table
   - Type: `TEXT`
   - Default: `''` (empty string)
   - Nullable: Yes

2. **Updated handle_new_user trigger function**
   - Now safely handles organization column
   - Includes comprehensive error handling
   - Never fails user creation process

3. **Added performance index**
   - Created `idx_profiles_organization` for efficient organization queries

4. **Enhanced trigger stability**
   - Comprehensive exception handling
   - Detailed logging for debugging
   - Graceful fallbacks for all operations

### How to Apply

#### Via Supabase Dashboard (Recommended)
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration file content
4. Execute the migration

#### Via CLI (If available)
```bash
supabase db push
```

### Verification
After running the migration, verify with:

```sql
-- Check organization column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'organization';

-- Test organization column access
SELECT id, user_id, organization 
FROM profiles 
LIMIT 1;
```

### Expected Results
- ✅ No more PGRST204 "organization column not found" errors
- ✅ User signup/login works without database errors
- ✅ Deposit operations complete successfully
- ✅ New users get profiles with organization field
- ✅ Existing users can be queried without errors

### Rollback (If needed)
```sql
-- Remove organization column (use with caution)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization;

-- Remove index
DROP INDEX IF EXISTS idx_profiles_organization;
```

### Dependencies
- Requires `public.profiles` table to exist
- Requires `auth.users` table to exist (for trigger)
- Requires `public.wallets` table to exist

### Files Created
- `migrations/20250923_add_organization_column.sql` - Main migration
- `MIGRATION_README.md` - This documentation
- `BULLETPROOF_ORGANIZATION_FIX.sql` - Comprehensive fix (alternative)

### Related Issues
- Fixes PGRST204 schema cache errors
- Resolves deposit function failures
- Prevents user creation trigger failures

### Testing
Run the test script to verify the migration worked:
```bash
node bulletproof-test.mjs
```