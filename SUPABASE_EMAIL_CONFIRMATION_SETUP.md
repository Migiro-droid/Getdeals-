# 🔐 Supabase Email Confirmation Auto-Login Setup

## Issue
When users sign up and click the confirmation link in their email, they are redirected to the website but **NOT automatically logged in**. They have to manually sign in again after confirming their email.

## Solution
Configure Supabase to use **automatic token generation** on email confirmation, which will log users in automatically when they click the confirmation link.

---

## 📋 Step-by-Step Configuration

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **GetDeals Kenya** (fxyifnckgllxqbggegtw)
3. Navigate to **Authentication** → **Email Templates** (left sidebar)

### 2. Update Confirmation Email Template

Find the **"Confirm signup"** template and replace the confirmation link with this:

#### ❌ OLD (Default - Does NOT log user in):
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

#### ✅ NEW (Auto-login):
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

### 3. Full Email Template (Recommended)

Replace the entire **"Confirm signup"** email template with this professional version:

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
                    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup" 
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
                {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
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

### 4. Configure Site URL

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://getdeals.co.ke`
3. Add **Redirect URLs**:
   - `https://getdeals.co.ke/auth/callback`
   - `http://localhost:5173/auth/callback` (for development)

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
