# 🐛 Checkout Management - Troubleshooting Guide

## Issue: Blank White Page with "process is not defined" Error

**Symptoms:**
```
Uncaught ReferenceError: process is not defined
    at checkoutService.ts:9:3
```

**Root Cause:**
In Vite projects, environment variables must use `import.meta.env` instead of `process.env` in client-side code.

**Solution:**
✅ **FIXED** in `src/services/checkoutService.ts` line 9

Changed from:
```typescript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);
```

To:
```typescript
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);
```

## Other Warnings (Not Errors - Safe to Ignore)

### ⚠️ "Multiple GoTrueClient instances detected"

**What it means:**
Multiple Supabase clients are being created in different services.

**Is this a problem?**
No - it's just a warning about best practices. This occurs because different services (`supabase.ts`, `client.ts`, `user-profile.ts`, etc.) each create their own Supabase client.

**Current Impact:**
✅ The app works fine - this is just a dev warning.

**Future Improvement:**
Could centralize all Supabase clients to a single shared instance, but it's not blocking functionality.

### ℹ️ React DevTools Suggestion

**What it means:**
Browser console suggestion to install React DevTools browser extension for better debugging.

**Is this required?**
No - it's optional and just makes React debugging easier.

**To dismiss:**
Install React DevTools extension or ignore the message.

### ℹ️ Preload Resource Warning

**What it means:**
`logo.png` and `placeholder.svg` are preloaded but not used immediately.

**Is this a problem?**
No - just a performance hint.

**Impact:**
✅ Minimal - won't affect functionality.

## ✅ Resolution Complete

The checkout component should now load correctly! Try:

1. **Refresh the browser** (F5 or Cmd+R)
2. **Navigate to** `/quickmart/admin`
3. **Sign in** with admin credentials
4. **Go to Checkout tab** (should be default)

## 🎯 Expected Behavior

After fix:
- ✅ Checkout tab displays
- ✅ Header shows "Checkout Management"
- ✅ Search panel visible
- ✅ Order lookup works
- ✅ Tabs (Search, Pending, Completed, Refunded) clickable

## 📋 Environment Variables Check

Ensure your `.env.local` or `.env` has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🔧 If Problems Persist

### Clear Cache and Rebuild
```bash
# Stop dev server (Ctrl+C)
# Clear node modules cache
npm run build

# or restart dev server
npm run dev
```

### Check Console for Errors
1. Open Developer Console (F12)
2. Look for red error messages
3. Report the exact error message

### Verify Supabase Connection
1. Checkout tab loads
2. Try searching for an order
3. Check if API calls are made (Network tab)

## 📝 Files Modified

- ✅ `src/services/checkoutService.ts` - Fixed environment variable access
- ✅ `src/pages/quickmart/QuickMartCheckout.tsx` - Removed unused import (Trash2)
- ✅ `src/pages/quickmart/QuickMartAdminDashboard.tsx` - Integrated checkout component

## ✨ Next Steps

1. Refresh browser
2. Test order search
3. Verify checkout works
4. Test reimbursement
5. Check audit logs

---

**Status:** ✅ **FIXED - Checkout component should now display properly**
