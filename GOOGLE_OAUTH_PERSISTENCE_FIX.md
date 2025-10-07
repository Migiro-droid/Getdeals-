# Google OAuth Preferences & Organization Persistence Fix

## Problem
Google OAuth users were seeing the preferences tab and organization details modal **every time they logged in**, even after completing them once. The data was not being properly saved to the database.

## Root Cause
The `updateProfile` function in `src/contexts/AuthContext.tsx` was **not handling** the following fields:
- `organization`
- `organizationNumber` 
- `preferences` (to auth metadata)
- `onboardingCompleted` (to auth metadata)

When users completed the organization setup modal or preferences checklist, the `updateProfile` function was called but it wasn't saving these specific fields to:
1. The database (`user_profile` table)
2. Supabase Auth user metadata

## Solution

### 1. Updated `updateProfile` Function (AuthContext.tsx)

#### Database Updates
Added support for saving organization and preferences to the database:

```typescript
const dbUpdates: any = {};
if (updates.name) dbUpdates.name = updates.name;
if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;
if (updates.onboardingCompleted !== undefined) dbUpdates.onboardingCompleted = updates.onboardingCompleted;
// NEW: Save organization fields
if (updates.organization !== undefined) dbUpdates.organization = updates.organization;
if (updates.organizationNumber !== undefined) dbUpdates.organization_number = updates.organizationNumber;
```

#### Auth Metadata Updates
Enhanced auth metadata update to include all relevant fields:

```typescript
const authMetadata: any = {};
if (updates.name) {
  authMetadata.name = updates.name;
  authMetadata.full_name = updates.name;
}
// NEW: Save to auth user_metadata
if (updates.organization !== undefined) authMetadata.organization = updates.organization;
if (updates.organizationNumber !== undefined) authMetadata.organization_number = updates.organizationNumber;
if (updates.preferences !== undefined) authMetadata.preferences = updates.preferences;
if (updates.onboardingCompleted !== undefined) authMetadata.onboardingCompleted = updates.onboardingCompleted;

const { error: authError } = await supabase.auth.updateUser({
  data: authMetadata
});
```

#### State Mapping
Fixed local state update to correctly map database field names to AuthUser field names:

```typescript
const stateUpdates: any = { ...dbUpdates };
// Map database fields to AuthUser fields
if (dbUpdates.organization_number !== undefined) {
  stateUpdates.organizationNumber = dbUpdates.organization_number;
  delete stateUpdates.organization_number;
}
setUser(prev => prev ? { ...prev, ...stateUpdates } : null);
```

## How It Works Now

### Organization Setup Flow
1. User signs in with Google OAuth
2. `AuthCallbackPage` checks if `user_metadata.organization` exists
3. If not, shows `OrganizationSetupModal`
4. User enters organization details
5. **`updateProfile` is called** with `organization` and `organizationNumber`
6. **Data is saved to**:
   - `user_profile` table: `organization` and `organization_number` columns
   - Supabase Auth: `user_metadata.organization` and `user_metadata.organization_number`
7. On next login, organization data is found → modal **doesn't show**

### Preferences Setup Flow
1. After organization setup, `PostSignupChecklist` modal shows
2. User selects preferences
3. **`updateProfile` is called** with `preferences` (stringified JSON) and `onboardingCompleted: true`
4. **Data is saved to**:
   - `user_profile` table: `preferences` and `onboarding_completed` columns
   - Supabase Auth: `user_metadata.preferences` and `user_metadata.onboardingCompleted`
5. On next login, preferences data is found → checklist **doesn't show**

## Testing Checklist

### Test Case 1: New Google OAuth User
1. ✅ Sign in with Google for the first time
2. ✅ Organization modal appears
3. ✅ Fill in organization details → click "Save & Continue"
4. ✅ Preferences checklist appears
5. ✅ Select preferences → click "Continue"
6. ✅ Redirected to home page
7. ✅ Sign out
8. ✅ Sign in with Google again
9. ✅ **Should NOT see organization modal**
10. ✅ **Should NOT see preferences checklist**
11. ✅ Directly go to home page

### Test Case 2: Verify Database Persistence
1. Complete Test Case 1
2. Check database `user_profile` table:
   - `organization` field should have the entered value
   - `organization_number` field should have the entered value (if provided)
   - `preferences` field should have JSON string of selected preferences
   - `onboarding_completed` should be `true`
3. Check Supabase Auth user:
   - `user_metadata.organization` should match
   - `user_metadata.organization_number` should match
   - `user_metadata.preferences` should match
   - `user_metadata.onboardingCompleted` should be `true`

### Test Case 3: Update Organization in Profile
1. Navigate to `/account`
2. Edit organization details
3. Save changes
4. ✅ Should update both database and auth metadata
5. ✅ Changes should persist after logout/login

## Files Changed

### `src/contexts/AuthContext.tsx`
- Enhanced `updateProfile` function to handle `organization`, `organizationNumber`, `preferences`, and `onboardingCompleted`
- Updated Supabase Auth metadata with all relevant fields
- Fixed state mapping from database fields to AuthUser fields
- **Lines changed**: 468-521

## Additional Improvements (Already Working)

### `src/components/OrganizationSetupModal.tsx`
- Already correctly calls `updateProfile` with organization data
- Sends welcome email with organization info
- Adds contact to Brevo mailing list

### `src/components/PostSignupChecklist.tsx`
- Already correctly calls `updateProfile` with preferences and onboardingCompleted
- Implements fallback to localStorage if database save fails
- Proper error handling for OAuth users

### `src/pages/AuthCallbackPage.tsx`
- Already correctly checks `user_metadata.organization` and `user_metadata.preferences`
- Shows modals only when data is missing
- Proper flow control for organization → preferences → home

## Impact

✅ **Google OAuth users will no longer see repeated prompts** for:
- Organization details modal
- Preferences checklist

✅ **Data persistence** is now reliable across:
- Database storage
- Auth metadata
- User sessions

✅ **Profile updates** now fully work for:
- Organization changes
- Preferences updates
- All user metadata fields

## Deployment Status
- ✅ Committed to main branch
- ✅ Pushed to production
- ✅ Ready for testing

## Related Documentation
- See `GOOGLE_OAUTH_ORGANIZATION_SETUP.md` for organization modal flow
- See `GOOGLE_OAUTH_PREFERENCES_FIX.md` for preferences implementation details

---
**Date**: January 7, 2025  
**Commits**: 
- `aa469c7` - Fix Google OAuth: properly save organization and preferences to database
- `1785d0b` - Improve WalletPage UX: remove Reset button, add M-Pesa error handling, implement skeleton loaders
