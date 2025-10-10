# Admin Email Login URL Fix

## Problem
When creating staff/manager/admin users at `/admin/users`, the credentials email is sent successfully, but clicking the "Login to Dashboard" button results in a **404 Page Not Found** error.

## Root Cause
The email template was using the wrong login URL:
- ❌ **Wrong**: `https://getdeals.co.ke/login` (doesn't exist)
- ✅ **Correct**: `https://getdeals.co.ke/auth` (your actual auth page)

## Solution Applied

### Files Modified
**`api/admin/send-credentials.ts`**

Changed login URL in both HTML and plain text email templates:

```typescript
// BEFORE (Line 123 and 255)
const loginUrl = 'https://getdeals.co.ke/login';

// AFTER
const loginUrl = 'https://getdeals.co.ke/auth';
```

### Changes Summary
1. **HTML Email Template** (Line 123): Updated `loginUrl` to `/auth`
2. **Plain Text Email Template** (Line 255): Updated `loginUrl` to `/auth`

## Email Template Preview

### What Users Will See Now

**HTML Version:**
```html
<a href="https://getdeals.co.ke/auth" style="...">
  Login to Dashboard
</a>
```

**Plain Text Version:**
```
Login URL: https://getdeals.co.ke/auth
```

## Testing

### Test the Fix
1. **Wait for Vercel deployment** (1-2 minutes)
2. **Create a new test user**:
   - Go to https://getdeals.co.ke/admin/users
   - Create a staff/manager/admin account
   - Use a test email you can access
3. **Check the email**:
   - Open the credentials email
   - Click "Login to Dashboard" button
   - **Expected**: Opens https://getdeals.co.ke/auth (auth page) ✅
   - **Before**: Got 404 error ❌
4. **Login with the credentials**:
   - Email: (from email)
   - Password: (from email)
   - Should successfully log in

## Deployment Status

✅ **Committed**: `14574e3`  
✅ **Pushed**: to main branch  
⏳ **Vercel Deployment**: In progress (auto-deploy on push)  

Check deployment: https://vercel.com/ericndivo/getdeals-kenya-showcase

## Related URLs in Your App

For future reference, here are your authentication-related routes:

- ✅ `/auth` - Main authentication page (login/signup)
- ✅ `/admin` - Admin dashboard (requires auth)
- ✅ `/admin/users` - User management page
- ❌ `/login` - **Does not exist** (was causing 404)

## Future Emails

All future admin credentials emails will now have the correct login URL pointing to `/auth`.

## Already Sent Emails

**Note**: Emails already sent to staff/managers/admins will still have the old `/login` URL. You can:

1. **Manually share the correct link** with them: `https://getdeals.co.ke/auth`
2. **Resend credentials** by:
   - Deleting the user in `/admin/users`
   - Creating them again (will send new email with correct link)

## Verification Checklist

- [x] Changed `loginUrl` in HTML email template
- [x] Changed `loginUrl` in plain text email template
- [x] Committed changes to git
- [x] Pushed to main branch
- [ ] Wait for Vercel deployment (~2 minutes)
- [ ] Test by creating a new user
- [ ] Verify email link works

---

**Status**: ✅ FIXED  
**Deployed**: Pending (Vercel auto-deploy in progress)  
**Issue**: Email login button pointed to non-existent `/login` route  
**Solution**: Changed to `/auth` route  
**Impact**: All future credential emails will have working login links
