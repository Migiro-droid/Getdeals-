# Setup: Quickmart Admin Access for admin@getdeals.co.ke

## Objective
Grant the account `admin@getdeals.co.ke` with password `admin123456` access to the Quickmart Admin Dashboard at `/quickmart`.

## Solution Overview

The Quickmart Admin Dashboard requires users to have `role: 'quickmart'` in their account. Currently, the email `admin@getdeals.co.ke` likely has `role: 'admin'` (global admin), which is explicitly blocked from accessing the Quickmart dashboard.

## Implementation Options

### Option 1: Create a Separate Quickmart Admin Account (Recommended)
Keep the global admin account separate from Quickmart admin account.

**Steps:**
1. Create a new account with:
   - Email: `quickmart.admin@getdeals.co.ke`
   - Password: `admin123456`
   - Role: `quickmart`

2. OR modify existing to have multiple roles

### Option 2: Change Existing Account to Quickmart-Only (NOT Recommended)
This would remove global admin access - generally not recommended.

### Option 3: Allow Global Admins to Access Quickmart Dashboard (Recommended Alternative)
Update the QuickMartGuard to allow both admin and quickmart roles.

## Recommended Implementation: Option 3

### Step 1: Update QuickMartGuard in App.tsx

Find this section in `src/App.tsx`:

```typescript
function QuickMartGuard({ children }: { children: JSX.Element }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to access the Quickmart Admin area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Only allow quickmart role - not global admins or other vendors
  if (user?.role !== 'quickmart') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Restricted
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access the Quickmart Admin Dashboard. 
              Only Quickmart admins can access this area.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Your Role: <span className="font-semibold capitalize">{user?.role || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
```

Replace with:

```typescript
function QuickMartGuard({ children }: { children: JSX.Element }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to access the Quickmart Admin area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Allow quickmart admins and global admins
  const allowedRoles = ['quickmart', 'admin'];
  if (!allowedRoles.includes(user?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Restricted
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access the Quickmart Admin Dashboard. 
              Only Quickmart and Global admins can access this area.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Your Role: <span className="font-semibold capitalize">{user?.role || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
```

### Step 2: Update QuickMartAdminDashboard.tsx

Find this check in `src/pages/quickmart/QuickMartAdminDashboard.tsx`:

```typescript
// Check if user is Quickmart admin
const isQuickMartAdmin = user?.role === 'quickmart';
```

Replace with:

```typescript
// Check if user is Quickmart or Global admin
const isQuickMartAdmin = user?.role === 'quickmart' || user?.role === 'admin';
```

Also update the permission error message if needed:

```typescript
if (!isQuickMartAdmin) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access the Quickmart Admin Dashboard. 
            Only Quickmart and Global admins can access this area.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Your Role: <span className="font-semibold">{user?.role || 'Unknown'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
```

## Testing the Setup

### Test 1: Access with admin@getdeals.co.ke
1. Go to `/auth`
2. Sign in with:
   - Email: `admin@getdeals.co.ke`
   - Password: `admin123456`
3. Navigate to `/quickmart`
4. Should see the Quickmart Admin Dashboard (not access denied)

### Test 2: Verify Other Roles Still Blocked
Try with other roles (staff, manager, etc.) - they should still get "Access Restricted"

## Files to Modify

1. **`src/App.tsx`** - Update QuickMartGuard function
2. **`src/pages/quickmart/QuickMartAdminDashboard.tsx`** - Update role check

## Before/After Access Matrix

### BEFORE (Current)
| Role | Access |
|------|--------|
| quickmart | ✅ Yes |
| admin | ❌ No |
| manager | ❌ No |
| staff | ❌ No |
| unauthenticated | ❌ No |

### AFTER (With Changes)
| Role | Access |
|------|--------|
| quickmart | ✅ Yes |
| admin | ✅ Yes |
| manager | ❌ No |
| staff | ❌ No |
| unauthenticated | ❌ No |

## Backward Compatibility

The changes are backward compatible:
- Existing Quickmart admin accounts continue to work
- Global admins gain access to Quickmart dashboard
- Other roles remain blocked
- No database changes needed

## Implementation Steps

1. Open `src/App.tsx`
2. Find and update QuickMartGuard function (around line 120)
3. Open `src/pages/quickmart/QuickMartAdminDashboard.tsx`
4. Update isQuickMartAdmin check (around line 18)
5. Test with admin@getdeals.co.ke credentials
6. Commit and deploy

## Security Considerations

✅ Still requires authentication
✅ Still restricts to admin roles
✅ Global admins already have system access
✅ Provides unified dashboard for both admin types
✅ Can be reverted if needed

## Alternative: Keep Separation (If Preferred)

If you want to keep Quickmart separate from global admins, create a new account:

```sql
-- Create quickmart admin account in Supabase Auth
INSERT INTO auth.users (email, password, user_metadata) 
VALUES ('admin@getdeals.co.ke', 'admin123456', '{"role": "quickmart"}');

-- Or update existing user
UPDATE auth.users 
SET user_metadata = '{"role": "quickmart"}'::jsonb
WHERE email = 'admin@getdeals.co.ke';
```

Then admin@getdeals.co.ke would need to be added as a quickmart admin in your user management system.

## Questions?

Refer to:
- `QUICKMART_ADMIN_DASHBOARD.md` - Full documentation
- `QUICKMART_ADMIN_QUICK_START.md` - Quick start guide
- Security section in documentation
