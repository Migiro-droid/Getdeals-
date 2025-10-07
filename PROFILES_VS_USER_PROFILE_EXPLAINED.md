# Profiles vs User_Profile Table - Complete Explanation

## TL;DR - Your Question Answered

**YES, you could add preferences to the `profiles` table instead!** However, there's a strategic reason why `user_profile` exists.

## The Two Tables Explained

### 1. `profiles` Table (Old/Legacy)
**Created**: August 21, 2025 (first migration)
**Purpose**: Original Supabase table when migrating from Prisma
**Current Status**: ⚠️ **DEPRECATED but still exists**

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  user_id UUID,                           -- References auth.users(id)
  first_name TEXT,
  last_name TEXT,
  phone TEXT UNIQUE,
  organization TEXT,
  organization_number TEXT,               -- Added later
  customer_id TEXT,                       -- For Rukisha integration
  role TEXT DEFAULT 'customer',
  two_factor_enabled BOOLEAN,
  two_factor_secret TEXT,
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. `user_profile` Table (New/Current)
**Created**: September 27, 2025
**Purpose**: Replace `profiles` with better structure
**Current Status**: ✅ **ACTIVELY USED**

```sql
CREATE TABLE public.user_profile (
  id UUID PRIMARY KEY,                    -- New UUID (not user_id)
  user_id UUID UNIQUE NOT NULL,           -- References auth.users(id)
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,                         -- NEW: Combined name
  phone TEXT,
  email TEXT,
  organization TEXT,
  organization_number TEXT,
  getdeals_number TEXT UNIQUE,            -- NEW: Custom ID system
  avatar_url TEXT,
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  is_active BOOLEAN,                      -- NEW: Account status
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  -- MISSING: preferences (needs to be added!)
  -- MISSING: onboarding_completed (needs to be added!)
);
```

## Key Differences

| Feature | `profiles` | `user_profile` |
|---------|-----------|----------------|
| **Primary Key** | `id = user_id` | Separate `id` + `user_id` |
| **User Reference** | Direct PK | Foreign key with UNIQUE constraint |
| **GetDeals Number** | ❌ No | ✅ Yes |
| **Full Name** | ❌ No | ✅ Yes |
| **Active Status** | ❌ No | ✅ Yes |
| **Avatar URL** | ❌ No | ✅ Yes |
| **2FA Fields** | ✅ Yes | ❌ No (moved elsewhere) |
| **Role Field** | ✅ Yes | ❌ No |
| **Auto-Trigger** | ❌ No | ✅ Yes (`handle_new_user_profile()`) |
| **Currently Used** | 🟡 Partially | ✅ Actively |

## Why Two Tables Exist

### Migration History:
1. **August 2025**: Started with `profiles` (Prisma → Supabase migration)
2. **September 2025**: Created `user_profile` to:
   - Add GetDeals number system
   - Better data structure
   - Separate concerns (basic profile vs KYC vs auth)
   - Auto-sync with auth.users via trigger

### The Comment Says It All:
```sql
-- Purpose: Separate user profile data from KYC profiles table
COMMENT ON TABLE public.user_profile IS 'Basic user profile data separate from KYC profiles';
```

The `profiles` table was mixing too many concerns:
- User profile data
- KYC/verification data  
- Authentication data (2FA)
- Payment integration (customer_id)

## Where Is Each Table Used?

### `profiles` Usage (Legacy):
```typescript
// ❌ OLD CODE (if any still exists)
supabase.from('profiles').select('*')

// 🔍 Currently only used in:
// - supabase/functions/deposit-funds/index.ts (customer_id lookup)
```

### `user_profile` Usage (Current):
```typescript
// ✅ ACTIVELY USED
// - src/contexts/AuthContext.tsx (updateProfile function)
// - src/services/wallet-service.ts (getdeals_number lookup)
// - All auth triggers and functions
```

## Your Options for Preferences

### Option A: Add to `user_profile` ✅ RECOMMENDED
**Pros:**
- ✅ Consistent with current codebase direction
- ✅ Your code already expects it here
- ✅ Has auto-sync trigger with auth metadata
- ✅ Future-proof

**Cons:**
- Requires migration (but you already have it ready!)

### Option B: Add to `profiles` ⚠️ NOT RECOMMENDED
**Pros:**
- Quick fix if `profiles` still has data

**Cons:**
- ❌ Table is deprecated
- ❌ No auto-sync trigger
- ❌ Code is migrating away from this table
- ❌ Will need migration again later
- ❌ Confusing for future maintenance

### Option C: Use Only Auth Metadata 🤔 PARTIAL SOLUTION
**Pros:**
- No database changes needed
- Already working

**Cons:**
- ❌ Can't query/filter users by preferences
- ❌ No database-level validation
- ❌ Harder to run analytics
- ❌ Code expects database storage

## My Recommendation

### ✅ **Stick with `user_profile` and run the migration**

**Why?**
1. Your codebase is **already using** `user_profile` (see `AuthContext.tsx` line 500)
2. The migration file is **already created and ready**
3. The table has the **trigger system** to auto-sync with auth
4. You're **already committed** to this table structure
5. Adding to `profiles` would create **technical debt**

### 🎯 Action Plan:
1. ✅ Run the migration: `migrations/20251007_add_preferences_to_user_profile.sql`
2. ✅ Test preferences saving
3. 🔄 (Optional) Eventually migrate any remaining `profiles` data to `user_profile`
4. 🗑️ (Future) Deprecate/drop `profiles` table completely

## The Future State

**Eventually, your database should look like:**
```
auth.users (Supabase Auth)
    ↓ (auto-synced via trigger)
user_profile (Basic profile + preferences)
    ↓ (linked by user_id)
Other tables: wallets, orders, addresses, etc.

profiles (DELETED - no longer needed)
```

## Quick Migration Comparison

### If you add to `profiles`:
```sql
ALTER TABLE public.profiles 
ADD COLUMN preferences TEXT;
-- But then... still need to update code to use profiles
-- And... still need to migrate away from profiles later
```

### If you add to `user_profile` (already done!):
```sql
ALTER TABLE public.user_profile 
ADD COLUMN preferences TEXT;
-- ✅ Code already expects this
-- ✅ Trigger already handles sync
-- ✅ Future-proof
```

## Conclusion

**You're on the right track** with the `user_profile` migration I created. Don't second-guess it!

The `profiles` table exists for **historical reasons** and is being **phased out**. Adding preferences there would be like adding a new feature to Windows XP when Windows 11 is already installed. 😊

**Just run the migration and move forward!** 🚀
