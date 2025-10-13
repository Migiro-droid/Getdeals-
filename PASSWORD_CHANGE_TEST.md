# 🧪 Password Change Feature - Quick Test Guide

## Test Right Now (5 Minutes)

### Prerequisites
⏳ Wait for Vercel deployment (~2 minutes)
- Check: https://vercel.com/ericndivo/getdeals-kenya-showcase

### Step 1: Navigate to Settings
1. Go to: https://getdeals.co.ke
2. Login with your account
3. Click your profile icon/name
4. Go to **"My Account"**
5. Click **"Settings"** tab
6. Find **"Change Password"** button

### Step 2: Test Valid Password Change ✅
1. Click **"Change Password"**
2. Modal should open with 3 fields
3. Enter:
   ```
   Current Password: [your actual current password]
   New Password: TestPass123!
   Confirm New Password: TestPass123!
   ```
4. Click **"Change Password"** button
5. **Expected Results**:
   - ✅ Button shows "Changing..." while processing
   - ✅ Success toast: "Password changed successfully"
   - ✅ Modal closes automatically
   - ✅ Form is cleared

### Step 3: Verify New Password Works ✅
1. Click **"Sign Out"**
2. Go back to login page
3. Login with:
   ```
   Email: [your email]
   Password: TestPass123!
   ```
4. **Expected**: ✅ Login successful with new password

### Step 4: Test Wrong Current Password ❌
1. Go to Settings → Change Password
2. Enter:
   ```
   Current Password: WrongPasswordHere
   New Password: AnotherPass456!
   Confirm New Password: AnotherPass456!
   ```
3. Click "Change Password"
4. **Expected**: 
   - ❌ Error toast: "Current password is incorrect"
   - Modal stays open
   - Can try again

### Step 5: Test Password Too Short ❌
1. In the modal, enter:
   ```
   Current Password: TestPass123!
   New Password: 123
   Confirm New Password: 123
   ```
2. Click "Change Password"
3. **Expected**:
   - ❌ Error: "Password too short"
   - Hint visible: "Must be at least 6 characters long"

### Step 6: Test Passwords Don't Match ❌
1. In the modal, enter:
   ```
   Current Password: TestPass123!
   New Password: NewPass789!
   Confirm New Password: DifferentPass456!
   ```
2. Click "Change Password"
3. **Expected**:
   - ❌ Error: "Passwords do not match"

### Step 7: Test Empty Fields ❌
1. In the modal, leave fields empty
2. Click "Change Password"
3. **Expected**:
   - ❌ Error: "Please fill in all fields"

### Step 8: Test Cancel Button ✅
1. Open password change modal
2. Enter some data in fields
3. Click **"Cancel"**
4. **Expected**:
   - Modal closes
   - No password change
   - Can re-open and start fresh

### Step 9: Test Same Password ❌
1. Open modal, enter:
   ```
   Current Password: TestPass123!
   New Password: TestPass123!
   Confirm New Password: TestPass123!
   ```
2. Click "Change Password"
3. **Expected**:
   - ❌ Error: "New password must be different from current password"

## Visual Checks

### Modal Appearance
- [ ] Modal has clear title "Change Password"
- [ ] 3 input fields visible
- [ ] All inputs have labels
- [ ] Placeholder text visible
- [ ] Password hint under "New Password" field
- [ ] Cancel and Change Password buttons visible

### Form Behavior
- [ ] Can type in all fields
- [ ] Password characters are hidden (shows •••)
- [ ] Can toggle password visibility (if implemented)
- [ ] Tab key moves between fields
- [ ] Enter key submits form

### Feedback
- [ ] Loading state shows "Changing..." text
- [ ] Button disables during submission
- [ ] Success toast appears on success
- [ ] Error toasts appear on errors
- [ ] Error messages are clear and helpful

## For Admin Users (Received Email Credentials)

### Test Admin Password Change
1. **Login** with credentials from email:
   ```
   Email: [from credentials email]
   Password: [temporary password from email]
   ```
2. **Go to Settings** → Change Password
3. **Change password**:
   ```
   Current Password: [temporary password from email]
   New Password: [your secure password]
   Confirm: [your secure password]
   ```
4. **Verify**:
   - Sign out
   - Login with new password
   - Old temporary password should not work

## Browser Testing

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

## Success Criteria

✅ **All Pass**:
- Current password verification works
- Password change succeeds with valid input
- All validation errors show correctly
- Form clears after success
- Can login with new password
- Old password no longer works
- Cancel button works
- UI is responsive and clear

❌ **If Any Fail**:
Report with:
1. Which test failed
2. What happened instead
3. Browser/device used
4. Any console errors

## Quick Fix for Common Issues

### Issue: Can't change password
**Check**:
1. Are you logged in?
2. Is current password correct?
3. Is new password 6+ characters?
4. Do passwords match?

### Issue: Success but can't login
**Try**:
1. Clear browser cache
2. Use incognito/private window
3. Wait 1 minute and try again
4. Check if you're using correct email

### Issue: Button stays on "Changing..."
**Try**:
1. Wait 10 seconds
2. Refresh page
3. Check internet connection
4. Try again

## Report Format

After testing, report:

**✅ Working**:
```
✅ Password change with valid input
✅ Current password verification
✅ Validation errors show correctly
✅ Can login with new password
✅ UI is clear and responsive
```

**❌ Issues Found**:
```
❌ [Describe issue]
   - Steps to reproduce
   - Expected vs actual
   - Browser/device
```

---

**Feature**: Secure Password Change  
**Commit**: e2184f4  
**Status**: ✅ Deployed  
**Test Time**: ~5 minutes  
**Documentation**: See PASSWORD_CHANGE_FEATURE.md
