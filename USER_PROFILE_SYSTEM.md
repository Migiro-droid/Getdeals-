# 🚀 User Profile System Architecture

## Overview

The application now uses a dual-table architecture to separate user profile data from KYC data:

- **`user_profile`** - Basic user information and organization data
- **`profiles`** - Rukisha KYC data and verification status

This separation provides better data organization, clearer responsibilities, and improved performance.

## 📊 Database Schema

### `user_profile` Table

```sql
CREATE TABLE public.user_profile (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    organization TEXT,
    organization_number TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Key Features:
- **Unique Constraint**: `organization_number` must be unique across all users
- **RLS Policies**: Users can only access their own profile data
- **Auto-Timestamps**: `created_at` and `updated_at` managed automatically
- **Soft Delete**: `is_active` flag for deactivation instead of deletion

## 🔄 Data Flow

### User Registration Process:

```
1. User fills signup form
   ↓
2. AuthContext.signUp() called
   ↓
3. Supabase auth.signUp() with metadata:
   {
     full_name: "John Doe",
     first_name: "John",
     last_name: "Doe",
     phone: "+254700000000",
     organization: "My Company Ltd",
     organization_number: "ORG12345"
   }
   ↓
4. Database trigger: handle_new_user_profile()
   ↓
5. user_profile record created automatically
   ↓
6. Wallet record created (existing logic)
```

### Profile Updates:

```
Frontend → UserProfileService → Supabase → user_profile table
```

## 🛠️ Implementation Components

### 1. Database Migration
**File**: `migrations/20250927_create_user_profile_table.sql`
- Creates `user_profile` table
- Sets up RLS policies
- Creates trigger function
- Adds unique constraints

### 2. TypeScript Types
**File**: `src/types/user-profile.ts`
- `UserProfile` interface
- Database type definitions
- Type-safe operations

### 3. Service Layer
**File**: `src/services/user-profile.ts`
- `UserProfileService` class
- CRUD operations
- Organization number validation
- Search and statistics

### 4. Context Provider
**File**: `src/contexts/UserProfileContext.tsx`
- `useUserProfile` hook
- State management
- Real-time subscriptions
- Error handling

### 5. UI Components
**File**: `src/components/UserProfileCard.tsx`
- Profile display and editing
- Organization information
- Verification status
- Edit mode with validation

## 📝 Usage Examples

### Basic Profile Access
```tsx
import { useUserProfile } from '../contexts/UserProfileContext';

function MyComponent() {
  const { profile, loading, error } = useUserProfile();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;
  
  return (
    <div>
      <h1>{profile.full_name}</h1>
      <p>Organization: {profile.organization}</p>
      <p>Org Number: {profile.organization_number}</p>
    </div>
  );
}
```

### Profile Updates
```tsx
const { updateProfile } = useUserProfile();

const handleUpdate = async () => {
  try {
    await updateProfile({
      organization: 'New Company Name',
      organization_number: 'NEW123',
    });
    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### Organization Number Validation
```tsx
const { isOrganizationNumberAvailable } = useUserProfile();

const validateOrgNumber = async (orgNumber: string) => {
  const available = await isOrganizationNumberAvailable(orgNumber);
  return available ? null : 'Organization number already exists';
};
```

## 🔧 Service Methods

### UserProfileService Methods:

- `getUserProfile(userId)` - Get profile by user ID
- `getCurrentUserProfile()` - Get current user's profile
- `upsertUserProfile(userId, data)` - Create or update profile
- `updateCurrentUserProfile(data)` - Update current user's profile
- `isOrganizationNumberAvailable(orgNumber)` - Check availability
- `searchByOrganization(name)` - Search profiles by organization
- `getProfileStats()` - Get profile statistics
- `deactivateUserProfile(userId)` - Soft delete profile
- `subscribeToUserProfile(userId, callback)` - Real-time updates

## 🚀 Migration Steps

### 1. Apply Database Migration
```sql
-- Copy and paste the entire migration script into Supabase SQL Editor
-- File: migrations/20250927_create_user_profile_table.sql
```

### 2. Test Migration
```bash
node test-user-profile-table.mjs
```

### 3. Update App.tsx
```tsx
import { UserProfileProvider } from './contexts/UserProfileContext';

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        {/* Your app components */}
      </UserProfileProvider>
    </AuthProvider>
  );
}
```

### 4. Use in Components
```tsx
import { UserProfileCard } from './components/UserProfileCard';
import { useUserProfile } from './contexts/UserProfileContext';
```

## 🔍 Testing

### Test Script: `test-user-profile-table.mjs`
- Verifies table creation
- Tests user registration flow
- Validates data mapping
- Checks organization number uniqueness
- Confirms trigger functionality

### Expected Results:
- ✅ user_profile table accessible
- ✅ User registration creates profile automatically
- ✅ Organization data captured correctly
- ✅ Unique constraints enforced
- ✅ All fields mapped properly

## 📊 Data Comparison

### Before (profiles table only):
```
User Signup → auth.users → ❌ No profile created → ❌ Data lost
```

### After (user_profile + profiles):
```
User Signup → auth.users → ✅ user_profile created → ✅ Data preserved
                        → profiles (for KYC only)
```

## 🛡️ Security Features

### Row Level Security (RLS):
- Users can only access their own profile
- Service role can manage all profiles
- Insert/Update/Select policies enforced

### Data Validation:
- Organization number uniqueness
- Email format validation
- Phone number format validation
- Required field enforcement

## 🔮 Future Enhancements

1. **Profile Completion Tracking**: Track which fields are filled
2. **Organization Verification**: Add verification status for organizations
3. **Profile Photos**: Integrate with file storage for avatars
4. **Advanced Search**: Full-text search across profile fields
5. **Bulk Operations**: Admin tools for managing multiple profiles
6. **Analytics**: Profile completion rates and statistics

## 🚨 Important Notes

1. **Existing profiles table**: Keep for Rukisha KYC data - do not modify
2. **Migration Required**: Must apply database migration before use
3. **Frontend Updates**: Update components to use UserProfileContext
4. **Testing**: Thoroughly test user registration flow
5. **Rollback Plan**: Keep migration rollback script ready

## 📞 Support

If you encounter issues:
1. Check database migration was applied correctly
2. Verify RLS policies are set up
3. Test trigger function with sample data
4. Review console logs for detailed errors
5. Use test script to validate setup

---

The user_profile system provides a robust, scalable foundation for managing user data while keeping KYC operations separate and secure! 🎉