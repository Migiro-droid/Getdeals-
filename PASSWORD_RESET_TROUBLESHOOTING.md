# 🔍 Password Reset Email Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. **Supabase Email Settings**
Go to your Supabase Dashboard > Authentication > Settings:

#### **Email Provider Check:**
- ✅ **Using Supabase Built-in Email:** Should work out of the box
- ⚠️ **Using Custom SMTP:** Verify your SMTP configuration
- ❌ **No Email Provider:** You need to configure email sending

#### **Email Templates:**
- Go to **Authentication > Email Templates**
- Ensure **"Reset Password"** template is enabled
- Check if the template content is correct

#### **Rate Limiting:**
- Supabase has built-in rate limiting for emails
- Check if you've exceeded the limit (usually 3-4 emails per hour per email address)

### 2. **Redirect URL Configuration**

#### **Required URLs in Supabase Dashboard:**
Go to **Authentication > URL Configuration** and ensure these URLs are added:

```
Site URL: https://getdeals.co.ke

Redirect URLs:
✅ http://localhost:3000/auth/callback
✅ https://getdeals.co.ke/auth/callback  
✅ https://getdeals.co.ke/auth/reset-password  ← IMPORTANT FOR PASSWORD RESET
```

### 3. **Code Implementation Issues**

#### **Environment Variables:**
Check if these are properly set:
```bash
VITE_SUPABASE_URL=https://fxyifnckgllxqbggegtw.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### **Browser Console Debugging:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try the password reset
4. Look for error messages

### 4. **Email Delivery Issues**

#### **Check These Locations:**
1. **Primary Inbox** - Most important
2. **Spam/Junk Folder** - Very common
3. **Promotions Tab** (Gmail)
4. **Updates Tab** (Gmail)

#### **Email Provider Issues:**
- Some email providers block automated emails
- Corporate email servers might filter Supabase emails
- Try with a personal Gmail/Yahoo account for testing

### 5. **Testing Steps**

#### **Basic Test:**
1. Open your site in browser
2. Go to sign-in page
3. Click "Forgot Password"
4. Enter email address
5. Check browser console for errors

#### **Advanced Testing:**
1. Import the debug script: `src/debug/password-reset-debug.ts`
2. Open browser console
3. Run: `detailedPasswordReset('your-email@example.com')`
4. Check the detailed logs

### 6. **Supabase Dashboard Debugging**

#### **Check Logs:**
1. Go to Supabase Dashboard
2. Navigate to **Logs > Auth Logs**
3. Look for password reset events
4. Check for any error messages

#### **User Management:**
1. Go to **Authentication > Users**
2. Verify the user exists with the correct email
3. Check if the user is confirmed/verified

### 7. **Common Error Messages**

#### **"User not found"**
- The email address doesn't exist in your user table
- User might have signed up with a different email

#### **"Email not confirmed"**
- Some configurations require email confirmation before password reset
- Check your Supabase auth settings

#### **"Too many requests"**
- Rate limiting is active
- Wait 1 hour and try again
- Or try with a different email address

#### **"Invalid redirect URL"**
- The redirect URL is not in your allowed list
- Add the URL to Supabase Dashboard > Authentication > URL Configuration

### 8. **Quick Fixes to Try**

1. **Add localhost to redirect URLs** (for testing):
   ```
   http://localhost:3000/auth/reset-password
   http://localhost:8080/auth/reset-password
   ```

2. **Test with simple redirect URL**:
   ```typescript
   // Temporarily change to:
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: 'https://getdeals.co.ke'
   });
   ```

3. **Check Supabase project status**:
   - Ensure your project is not paused
   - Check if you've exceeded free tier limits

4. **Verify email template variables**:
   - Ensure `{{ .SiteURL }}` is used in templates
   - Check if custom variables are properly set

### 9. **Manual Testing Script**

Add this to your browser console for manual testing:

```javascript
// Test password reset directly
async function testReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://getdeals.co.ke/auth/reset-password'
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

// Usage: testReset('your-email@example.com')
```

### 10. **Contact Supabase Support**

If none of the above work:
1. Go to Supabase Dashboard
2. Click on the help/support icon
3. Submit a ticket with:
   - Your project ID: `fxyifnckgllxqbggegtw`
   - The exact error message
   - Steps you've already tried

---

## 🎯 Most Likely Causes (in order):

1. **Missing redirect URL** in Supabase configuration
2. **Email in spam folder**
3. **Rate limiting** - too many requests
4. **SMTP configuration** issues (if using custom email)
5. **Email template** disabled or misconfigured

Try these solutions in order! 🚀