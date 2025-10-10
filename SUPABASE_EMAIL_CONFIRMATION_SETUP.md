# 🔐 Supabase Email Confirmation Auto-Login Setup

## ⚠️ CRITICAL ISSUE
When users sign up and click the confirmation link in their email, they are redirected to the website but **NOT automatically logged in**. This causes the preferences modal to fail with error: "Please wait, we're setting up your account."

## ✅ ROOT CAUSE & SOLUTION
The issue is **Supabase email template configuration**. By default, Supabase uses `{{ .ConfirmationURL }}` which only confirms the email but DOES NOT create a session (log the user in).

**We need to use `{{ .TokenHash }}` instead**, which creates a session automatically.

---

## 📋 EXACT STEPS TO FIX (Do This Now!)

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select project: **GetDeals Kenya** (fxyifnckgllxqbggegtw)
3. Click **Authentication** (left sidebar)
4. Click **Email Templates**

### Step 2: Configure Site URL (MUST DO FIRST!)
1. In Authentication, click **URL Configuration** tab
2. Set **Site URL** to: `https://getdeals.co.ke`
3. Under **Redirect URLs**, add:
   ```
   https://getdeals.co.ke/auth/callback
   https://getdeals.co.ke/*
   http://localhost:5173/auth/callback
   http://localhost:5173/*
   ```
4. Click **Save**

### Step 3: Update "Confirm signup" Email Template

Find the **"Confirm signup"** template and **completely replace** it with this:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - GetDeals Kenya</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to GetDeals Kenya! 🎉</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there! 👋
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for signing up with GetDeals Kenya - your trusted marketplace for quality products at unbeatable prices!
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Please confirm your email address to get started shopping:
              </p>
              
              <!-- Confirmation Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      ✅ Confirm Email & Sign In
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 10px 0 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px; word-break: break-all; font-size: 13px; color: #495057; font-family: monospace;">
                {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
              
              <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6;">
                <strong>Why confirm your email?</strong><br>
                • Secure your account<br>
                • Enable password recovery<br>
                • Receive order updates<br>
                • Get exclusive deals & promotions
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 13px;">
                This link will expire in <strong>24 hours</strong>
              </p>
              
              <p style="margin: 0 0 15px; color: #999999; font-size: 12px;">
                If you didn't create an account with GetDeals Kenya, please ignore this email.
              </p>
              
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{ .Year }} GetDeals Kenya. All rights reserved.
              </p>
              
              <p style="margin: 10px 0 0;">
                <a href="https://getdeals.co.ke" style="color: #667eea; text-decoration: none; font-size: 12px;">Visit Website</a> •
                <a href="https://getdeals.co.ke/support" style="color: #667eea; text-decoration: none; font-size: 12px;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Step 4: Save and Test!
1. Click **Save** at the bottom of the email template editor
2. **IMPORTANT**: Test with a new signup to verify it works

---

## ⚠️ CRITICAL NOTES

### Why `type=email` instead of `type=signup`?
Supabase auth callback expects specific type values:
- `type=email` - For email confirmation (creates session automatically)
- `type=recovery` - For password reset
- `type=magiclink` - For magic link login
- `type=signup` - Legacy, may not work with newer Supabase versions

### URL Format MUST be exact:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

**DO NOT USE:**
- ❌ `{{ .ConfirmationURL }}` (old way, doesn't create session)
- ❌ `type=signup` (may not work)
- ❌ `type=confirmation` (not recognized)

### Verification:
After saving, when a user signs up, the email should contain a link like:
```
https://getdeals.co.ke/auth/callback?token_hash=LONG_HASH_HERE&type=email
```

---

## 🔍 How It Works

### Before (Old Way - Manual Login Required):
```
User signs up
  ↓
Receives confirmation email with: {{ .ConfirmationURL }}
  ↓
Clicks link → Email confirmed ✅
  ↓
Redirected to site → NO SESSION ❌
  ↓
User has to manually log in again 😞
```

### After (New Way - Auto Login):
```
User signs up
  ↓
Receives confirmation email with: {{ .TokenHash }}
  ↓
Clicks link → Email confirmed ✅ + Session created ✅
  ↓
Redirected to /auth/callback with active session 🎉
  ↓
AuthCallbackPage detects new user → Shows preferences modal ✨
  ↓
User is fully logged in and ready to shop! 🛍️
```

---

## 🧪 Testing the Setup

### 1. Create Test User
```bash
# In your app, sign up with a test email
Email: test@yourdomain.com
Password: TestPassword123!
```

### 2. Check Email
- Open the confirmation email
- **Verify the link format** - it should include `token_hash=` parameter
- Click the link

### 3. Expected Result
✅ User is redirected to `https://getdeals.co.ke/auth/callback`
✅ User is automatically logged in
✅ Preferences modal appears automatically
✅ User can start shopping immediately

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect URL"
**Solution:** Make sure `https://getdeals.co.ke/auth/callback` is added to **Redirect URLs** in Supabase Dashboard

### Issue: "Token expired"
**Solution:** Confirmation links expire after 24 hours. User needs to request a new confirmation email.

### Issue: User still not logged in after clicking link
**Check:**
1. Email template uses `{{ .TokenHash }}` not `{{ .ConfirmationURL }}`
2. Link format is: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`
3. Site URL is set correctly in Supabase Dashboard
4. Redirect URL includes `/auth/callback`

### Issue: Preferences modal doesn't appear
**Check:**
1. User is actually logged in (check `supabase.auth.getSession()`)
2. AuthCallbackPage logic is running (check browser console)
3. User doesn't already have preferences set in their metadata

---

## 🔧 Additional Configuration (Optional)

### Custom Email Template Variables

You can use these Supabase variables in your email templates:

- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Short token (deprecated, use TokenHash)
- `{{ .TokenHash }}` - Secure token hash for email confirmation
- `{{ .ConfirmationURL }}` - Old default URL (DON'T use this)
- `{{ .SiteURL }}` - Your site URL from Supabase settings
- `{{ .Year }}` - Current year

### Email Template for Password Reset

While you're in Supabase, also update the **"Reset password"** template to auto-login:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

### Email Template for Magic Link

Update **"Magic Link"** template:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">Sign in to GetDeals Kenya</a>
```

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Site URL set to `https://getdeals.co.ke`
- [ ] Redirect URLs include `/auth/callback`
- [ ] Email template uses `{{ .TokenHash }}`
- [ ] Email template redirects to `/auth/callback`
- [ ] Test signup works end-to-end
- [ ] User is auto-logged in after email confirmation
- [ ] Preferences modal appears for new users
- [ ] Email design looks good on mobile and desktop

---

## 📚 References

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth Callback Docs](https://supabase.com/docs/reference/javascript/auth-signout)
- [Your AuthCallbackPage Implementation](./src/pages/AuthCallbackPage.tsx)

---

## 🆘 Need Help?

If you're still experiencing issues:

1. Check Supabase Auth logs (Dashboard → Logs → Auth)
2. Check browser console for errors
3. Verify email template saved correctly
4. Test with incognito/private browsing mode
5. Clear browser cache and cookies

---

**Last Updated:** {{ .Year }}-10-10  
**Status:** ✅ Ready to Deploy
