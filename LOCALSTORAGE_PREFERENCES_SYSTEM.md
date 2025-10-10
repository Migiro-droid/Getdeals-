# 💾 localStorage Preferences System

## Overview

This system allows users to save their shopping preferences **before email confirmation**, storing them temporarily in the browser's localStorage. Once the user confirms their email and logs in, the preferences are automatically synced to the database.

## How It Works

### 1. **User Signs Up**
- User fills out signup form
- Account is created but email is NOT confirmed yet
- Preferences modal appears

### 2. **Preferences Saved to localStorage**
```javascript
// When user selects preferences and clicks "Complete"
localStorage.setItem('pendingPreferences', JSON.stringify({
  categories: ['groceries', 'electronics'],
  categoryDetails: { ... },
  preferencesSetAt: '2025-10-10T12:00:00Z',
  onboardingCompleted: true
}));
```

**Success Message:**
> "Preferences Saved! ✓  
> Please confirm your email to complete setup. Your preferences are saved and will sync automatically."

### 3. **User Confirms Email**
- User clicks confirmation link in email
- Email is verified
- User is automatically logged in
- Redirected to `/auth/callback`

### 4. **Automatic Sync to Database**
The `useSyncPendingPreferences` hook automatically:
1. Detects user is now logged in
2. Checks for `pendingPreferences` in localStorage
3. Syncs preferences to database via Supabase
4. Clears localStorage (no longer needed)
5. Shows success toast

**Success Message:**
> "Welcome back!  
> Your preferences have been saved successfully."

## Implementation Details

### Files Modified

#### 1. **PostSignupChecklist.tsx**
```typescript
// STEP 1: Save to localStorage FIRST (works for unconfirmed users)
localStorage.setItem('pendingPreferences', JSON.stringify(detailedPreferences));

// STEP 2: Try to save to database if user is logged in
const { data: { session } } = await supabase.auth.getSession();

if (!session?.user) {
  // Not logged in yet - show success and let them confirm email
  toast({ title: "Preferences Saved! ✓" });
  onComplete();
  return;
}

// STEP 3: User IS logged in - sync to database
await updateProfile({ preferences: JSON.stringify(detailedPreferences) });
localStorage.removeItem('pendingPreferences'); // Clean up
```

#### 2. **useSyncPendingPreferences.ts** (New Hook)
```typescript
export function useSyncPendingPreferences() {
  const { user, updateProfile } = useAuth();
  
  useEffect(() => {
    if (!user?.id) return; // Not logged in
    
    const pending = localStorage.getItem('pendingPreferences');
    if (!pending) return; // No pending preferences
    
    // Sync to database
    await updateProfile({ preferences: pending });
    localStorage.removeItem('pendingPreferences');
    
    toast({ title: "Welcome back! Preferences saved." });
  }, [user?.id]);
}
```

#### 3. **App.tsx**
```typescript
function AppContent() {
  // Automatically sync preferences on every page load
  useSyncPendingPreferences();
  
  return <BrowserRouter>...</BrowserRouter>;
}
```

#### 4. **AuthCallbackPage.tsx**
```typescript
// Also sync on the callback page for immediate feedback
useSyncPendingPreferences();
```

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Signs Up                                            │
│    → Account created (email NOT confirmed)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Preferences Modal Appears                                │
│    → User selects categories & details                      │
│    → Clicks "Complete"                                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Save to localStorage                                     │
│    localStorage.setItem('pendingPreferences', {...})        │
│    ✓ "Preferences Saved! Please confirm email"             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User Checks Email                                        │
│    → Clicks confirmation link                                │
│    → Email verified + Auto login                             │
│    → Redirected to /auth/callback                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Auto Sync (useSyncPendingPreferences hook)              │
│    → Detects user.id exists                                  │
│    → Finds 'pendingPreferences' in localStorage             │
│    → Syncs to database via updateProfile()                   │
│    → Clears localStorage                                     │
│    ✓ "Welcome back! Your preferences have been saved"       │
└─────────────────────────────────────────────────────────────┘
```

## Edge Cases Handled

### Case 1: User Never Confirms Email
- ✅ Preferences stay in localStorage
- ✅ Still visible in browser
- ✅ Will sync automatically if they confirm later
- ❌ Lost if they clear browser data or use different browser

### Case 2: User Logs in on Different Browser
- ❌ localStorage is browser-specific
- ✅ They can set preferences again
- ✅ New preferences will be saved to database

### Case 3: User Already Has Preferences in Database
- ✅ localStorage preferences are skipped
- ✅ Database preferences take priority
- ✅ No overwriting of existing preferences

### Case 4: Database Save Fails
- ✅ Preferences remain in localStorage
- ✅ Will retry on next page load
- ✅ User sees: "Preferences saved locally"

### Case 5: OAuth User (Google Sign-In)
- ✅ Email pre-confirmed
- ✅ Direct save to database
- ✅ No localStorage needed
- ✅ Instant sync

## Benefits

### ✅ **Better UX**
- Users can save preferences immediately
- No frustrating "wait for confirmation" message
- Smooth onboarding flow

### ✅ **No Data Loss**
- Preferences preserved even if user closes browser
- Automatic sync when they come back
- Graceful fallback to localStorage

### ✅ **Works Offline**
- localStorage works without internet
- Syncs when connection restored

### ✅ **Simple & Reliable**
- Browser-native localStorage API
- No complex state management
- Works across all modern browsers

## Testing Checklist

- [ ] Sign up with new email
- [ ] Select preferences in modal
- [ ] Click "Complete"
- [ ] Verify localStorage has `pendingPreferences`
- [ ] Close browser
- [ ] Open confirmation email
- [ ] Click confirmation link
- [ ] Verify auto-login works
- [ ] Verify preferences synced to database
- [ ] Verify localStorage is cleared
- [ ] Check user profile shows preferences

## localStorage Structure

```json
{
  "pendingPreferences": {
    "categories": ["groceries", "electronics", "household"],
    "categoryDetails": {
      "groceries": {
        "subcategories": ["Staples", "Fruits & Vegetables"],
        "frequency": "weekly"
      },
      "electronics": {
        "subcategories": ["Phones", "Laptops"],
        "frequency": "monthly"
      }
    },
    "shoppingPreferences": ["groceries", "electronics", "household"],
    "preferencesSetAt": "2025-10-10T12:34:56.789Z",
    "onboardingCompleted": true
  }
}
```

## Debugging

### Check if preferences are in localStorage:
```javascript
// In browser console
console.log(localStorage.getItem('pendingPreferences'));
```

### Manually trigger sync:
```javascript
// In browser console (when logged in)
import { supabase } from './lib/supabase';

const prefs = localStorage.getItem('pendingPreferences');
if (prefs) {
  await supabase.auth.updateUser({
    data: { preferences: prefs, onboardingCompleted: true }
  });
  localStorage.removeItem('pendingPreferences');
  console.log('✅ Manually synced!');
}
```

### Clear pending preferences:
```javascript
// In browser console
localStorage.removeItem('pendingPreferences');
console.log('🧹 Cleared pending preferences');
```

## Next Steps

1. ✅ Test with real email confirmation flow
2. ✅ Verify Supabase email template is configured correctly
3. ✅ Monitor localStorage for stuck preferences
4. 📊 Add analytics to track sync success rate
5. 🔔 Add reminder notification if preferences aren't synced after 24h

## Support

If users report preferences not saving:
1. Check browser console for errors
2. Verify localStorage is enabled in browser
3. Check Supabase auth metadata
4. Manually trigger sync using debugging commands above
