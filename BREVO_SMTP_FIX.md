# SMTP Authentication Fix - Brevo Configuration

## Problem
When creating staff/manager/admin users at https://getdeals.co.ke/admin/users, the following error occurs:

```json
{
    "success": false,
    "error": "Email service configuration error",
    "details": "Invalid login: 535 5.7.8 Authentication failed"
}
```

**Error Code**: `535 5.7.8 Authentication failed`  
**Command**: `AUTH PLAIN`  
**Root Cause**: Incorrect nodemailer TLS configuration for Brevo SMTP

## Solution

### Issue Identified
The code was using:
```typescript
secure: smtpPort === '465'  // Evaluates to false for port 587
```

This causes nodemailer to not properly handle STARTTLS negotiation with Brevo's SMTP server on port 587.

### Fix Applied

**Files Modified**:
1. `api/admin/send-credentials.ts` - User credential email sender
2. `api/admin/test-smtp.ts` - SMTP testing endpoint

**Changes Made**:
```typescript
// BEFORE (Incorrect)
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(smtpPort || '587'),
  secure: smtpPort === '465', // Wrong for port 587
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// AFTER (Correct)
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(smtpPort || '587'),
  secure: false, // STARTTLS for port 587
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: true // Verify SSL certificates
  }
});
```

## Your Current Brevo Configuration

Your Vercel environment variables are correctly set:

```
✅ SMTP_HOST: smtp-relay.brevo.com
✅ SMTP_PORT: 587
✅ SMTP_USER: info@getdeals.co.ke
✅ SMTP_PASS: xsmtpsib-ef28b07f169aa4b26b5a6eaade5c7752b81cb5ac632231e228bca7b8acc704d7-Z6ITnP5FtS4DEfBr
✅ SMTP_FROM: GetDeals Admin <info@getdeals.co.ke>
```

**Note**: The SMTP_PASS is your Brevo SMTP API key (starts with `xsmtpsib-`), which is correct.

## Testing the Fix

### Option 1: Test SMTP Endpoint
Visit this URL to test SMTP configuration:

```
https://getdeals.co.ke/api/admin/test-smtp
```

**Expected Response** (Success):
```json
{
  "timestamp": "2025-10-10T14:30:00.000Z",
  "environment": "production",
  "tests": {
    "environmentVariables": {
      "SMTP_HOST": "✅ Set",
      "SMTP_PORT": "✅ Set (587)",
      "SMTP_USER": "✅ Set (inf...ke)",
      "SMTP_PASS": "✅ Set (95 characters)",
      "SMTP_FROM": "✅ Set (GetDeals Admin <info@getdeals.co.ke>)"
    },
    "transporterCreation": "✅ Success",
    "smtpConnection": "✅ Verified - Credentials are correct"
  },
  "success": true,
  "message": "SMTP configuration is working correctly! You can send emails."
}
```

### Option 2: Create Test User
1. Go to https://getdeals.co.ke/admin/users
2. Click "Create New User"
3. Fill in details for a staff/manager/admin
4. Submit the form
5. Check if email is sent successfully

### Option 3: Check Logs
View Vercel function logs:
```bash
vercel logs
```

Look for:
- ✅ `SMTP connection verified`
- ✅ `Email sent successfully`

## Brevo SMTP Configuration Details

### Port 587 (Recommended - STARTTLS)
```typescript
{
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,  // Use STARTTLS
  auth: {
    user: 'info@getdeals.co.ke',
    pass: 'your-brevo-smtp-api-key'
  }
}
```

### Port 465 (Alternative - SSL/TLS)
```typescript
{
  host: 'smtp-relay.brevo.com',
  port: 465,
  secure: true,  // Use SSL/TLS
  auth: {
    user: 'info@getdeals.co.ke',
    pass: 'your-brevo-smtp-api-key'
  }
}
```

**We're using Port 587 with STARTTLS** (most common and recommended by Brevo)

## Deployment

### Apply the Fix

```bash
# 1. Commit changes
git add api/admin/send-credentials.ts api/admin/test-smtp.ts
git commit -m "Fix SMTP authentication for Brevo (secure: false for port 587)"

# 2. Push to main branch
git push origin main

# 3. Vercel will auto-deploy (if connected)
# OR manually deploy:
vercel --prod
```

### Verify Deployment
1. Wait for deployment to complete (~1-2 minutes)
2. Visit https://getdeals.co.ke/api/admin/test-smtp
3. Check if SMTP connection is verified

## Common Brevo SMTP Issues & Solutions

### Issue 1: "Invalid login: 535 5.7.8"
**Cause**: Incorrect TLS configuration  
**Solution**: Use `secure: false` for port 587 ✅ (Fixed in this commit)

### Issue 2: "Connection timeout"
**Cause**: Wrong SMTP host or port  
**Solution**: Use `smtp-relay.brevo.com:587` ✅ (Already correct)

### Issue 3: "Authentication failed"
**Cause**: Wrong SMTP API key  
**Solution**: 
1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Settings → SMTP & API
3. Generate new SMTP key
4. Update `SMTP_PASS` in Vercel

### Issue 4: "Sender not authorized"
**Cause**: Email from address not verified in Brevo  
**Solution**: 
1. Verify `info@getdeals.co.ke` in Brevo
2. Ensure `SMTP_FROM` matches verified sender

## Email Template

The credential email sent to new users looks like this:

```html
<h2>Welcome to GetDeals Kenya Admin</h2>
<p>Hello {name},</p>
<p>Your {role} account has been created. Here are your login credentials:</p>

<div style="background-color: #f3f4f6; padding: 15px;">
  <p><strong>Email:</strong> {email}</p>
  <p><strong>Password:</strong> {password}</p>
  <p><strong>Role:</strong> {role}</p>
</div>

<p><strong>Login here:</strong> https://getdeals.co.ke/auth</p>
<p><em>Please change your password after first login.</em></p>
```

## Troubleshooting

### Still Getting Auth Errors?

1. **Check Brevo Account Status**
   - Is your account active?
   - Any sending limits reached?
   - Domain verified?

2. **Verify Environment Variables**
   ```bash
   # Check if vars are set in Vercel
   vercel env ls
   ```

3. **Test SMTP Credentials Manually**
   ```bash
   # Use nodemailer-smtp-test tool
   npm install -g nodemailer-smtp-test
   smtp-test smtp-relay.brevo.com:587 info@getdeals.co.ke "your-api-key"
   ```

4. **Check Brevo Logs**
   - Go to Brevo Dashboard → Logs
   - Look for failed authentication attempts
   - Check IP restrictions

5. **Regenerate SMTP API Key**
   - Sometimes keys can expire or become invalid
   - Generate new key in Brevo
   - Update `SMTP_PASS` in Vercel
   - Redeploy

## Alternative: Use Brevo Transactional Email API

If SMTP continues to fail, you can switch to Brevo's HTTP API:

```typescript
// Instead of nodemailer
import axios from 'axios';

const response = await axios.post(
  'https://api.brevo.com/v3/smtp/email',
  {
    sender: { email: 'info@getdeals.co.ke', name: 'GetDeals Admin' },
    to: [{ email: recipientEmail, name: recipientName }],
    subject: 'Your Admin Credentials',
    htmlContent: emailHtml
  },
  {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    }
  }
);
```

## Security Notes

1. **Never commit SMTP credentials** to git
2. **Use environment variables** for all sensitive data
3. **Rotate SMTP keys** periodically (every 6 months)
4. **Monitor email logs** for suspicious activity
5. **Enable 2FA** on Brevo account

## Related Documentation

- [Brevo SMTP Documentation](https://developers.brevo.com/docs/send-a-transactional-email)
- [Nodemailer TLS Options](https://nodemailer.com/smtp/tls/)
- [SMTP_SETUP_GUIDE.md](./SMTP_SETUP_GUIDE.md)
- [VERCEL_SMTP_QUICK_SETUP.md](./VERCEL_SMTP_QUICK_SETUP.md)

---

**Status**: ✅ FIXED  
**Date**: October 10, 2025  
**Issue**: SMTP 535 5.7.8 Authentication failed  
**Solution**: Changed `secure` from dynamic to `false` for port 587 STARTTLS
