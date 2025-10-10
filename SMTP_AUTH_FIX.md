# SMTP Authentication Fix - Vercel Environment Variables

## Problem
Email sending is failing with error:
```
Error: Invalid login: 535 5.7.8 Authentication failed
code: 'EAUTH'
response: '535 5.7.8 Authentication failed'
```

This happens when creating admin/staff/manager users at `/admin/users`.

## Root Cause
The SMTP credentials configured in Vercel environment variables are **incorrect or invalid**.

## Solution

### Step 1: Choose Your SMTP Provider

#### Option A: Brevo (Recommended - Free)
1. Go to [Brevo](https://www.brevo.com/) and sign up
2. Navigate to **SMTP & API** → **SMTP** tab
3. Create a new SMTP key (or use existing)
4. Use these settings:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-brevo-login-email@example.com
   SMTP_PASS=your-smtp-key (NOT your account password!)
   SMTP_FROM=GetDeals Admin <noreply@getdeals.co.ke>
   ```

#### Option B: Gmail
1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an "App Password" for "Mail"
4. Use these settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=GetDeals Admin <your-email@gmail.com>
   ```

#### Option C: SendGrid
1. Go to [SendGrid](https://sendgrid.com/) and sign up
2. Create an API Key with "Mail Send" permissions
3. Use these settings:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=GetDeals Admin <verified-sender@yourdomain.com>
   ```

### Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `getdeals-kenya-showcase`
3. Go to **Settings** → **Environment Variables**
4. Update or add these variables:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `SMTP_HOST` | (from provider above) | Production, Preview, Development |
   | `SMTP_PORT` | `587` (or `465` for SSL) | Production, Preview, Development |
   | `SMTP_USER` | (from provider above) | Production, Preview, Development |
   | `SMTP_PASS` | (from provider above) | Production, Preview, Development |
   | `SMTP_FROM` | `GetDeals Admin <noreply@getdeals.co.ke>` | Production, Preview, Development |

5. Click **Save** for each variable

### Step 3: Redeploy

After updating environment variables, you MUST redeploy:

```bash
# Option 1: Push a commit (triggers auto-deploy)
git commit --allow-empty -m "Trigger redeploy for SMTP config"
git push origin main

# Option 2: Manual redeploy via Vercel Dashboard
# Go to Deployments → click "..." → Redeploy
```

### Step 4: Test

1. Go to https://getdeals.co.ke/admin/users
2. Click "Add New User"
3. Fill in the form:
   - Name: Test User
   - Email: your-test-email@gmail.com
   - Role: Staff
4. Click "Create Account"
5. Check the email inbox - you should receive login credentials

## Common Mistakes

### ❌ Wrong Password Type
- **Gmail**: Must use "App Password" (16 characters), NOT your regular Gmail password
- **Brevo**: Must use SMTP Key from dashboard, NOT your Brevo account password
- **SendGrid**: Use the API key, username must be literally `apikey`

### ❌ Not Redeploying
- Environment variables are only loaded at build time
- You MUST redeploy after changing them

### ❌ Wrong Port/Security Combination
- Port 587: `secure: false` (STARTTLS)
- Port 465: `secure: true` (SSL)
- Don't mix them up!

### ❌ Email Not Verified
- Some providers require you to verify the sender email first
- Check your provider's dashboard for verification status

## Verification Script

To test your SMTP credentials locally before deploying:

```bash
# Create test file
cat > test-smtp.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',  // Change to your SMTP host
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',  // Change to your SMTP user
    pass: 'your-smtp-password',       // Change to your SMTP password
  },
});

transporter.verify()
  .then(() => console.log('✅ SMTP connection verified successfully!'))
  .catch((err) => console.error('❌ SMTP verification failed:', err.message));
EOF

# Install nodemailer
npm install nodemailer

# Run test
node test-smtp.js
```

**Expected Output**:
```
✅ SMTP connection verified successfully!
```

**If you see error**:
```
❌ SMTP verification failed: Invalid login: 535 5.7.8 Authentication failed
```
→ Your credentials are wrong. Double-check username/password.

## Current Error Analysis

Your current error indicates:
```
SMTP verification failed: Error: Invalid login: 535 5.7.8 Authentication failed
```

This specifically means:
1. ✅ SMTP host/port are correct (connection established)
2. ❌ Username or password is **wrong**
3. ❌ OR the account requires additional authentication (2FA, app password)

## Quick Fix Checklist

- [ ] Verify SMTP provider is correct (Brevo, Gmail, SendGrid, etc.)
- [ ] Double-check `SMTP_USER` - is it the correct email/username?
- [ ] Double-check `SMTP_PASS` - is it the correct password/key?
- [ ] For Gmail: Generated "App Password" instead of regular password?
- [ ] For Brevo: Using SMTP key from dashboard, not account password?
- [ ] For SendGrid: Username is literally `apikey`?
- [ ] Updated ALL environment variables in Vercel (Production, Preview, Development)?
- [ ] Saved changes in Vercel dashboard?
- [ ] Redeployed after saving?
- [ ] Waited 2-3 minutes for deployment to complete?

## Still Not Working?

### Debug Steps
1. Check Vercel deployment logs:
   ```
   Vercel Dashboard → Deployments → [Latest] → Function Logs
   ```

2. Look for this line:
   ```
   SMTP not configured. Missing environment variables
   ```
   If you see this, variables aren't set correctly.

3. Check if variables are visible:
   ```
   Vercel Dashboard → Settings → Environment Variables
   ```
   Make sure all 5 variables are present.

### Temporary Workaround
If you need to create users urgently while fixing SMTP:

1. The API will return credentials in the response even if email fails
2. Copy the password from the error response
3. Manually send it to the user via WhatsApp/SMS/other channel

Example response when SMTP fails:
```json
{
  "success": true,
  "warning": "Email not sent: SMTP not configured",
  "credentials": {
    "email": "user@example.com",
    "password": "auto-generated-password",
    "message": "Please provide these credentials to the user manually"
  }
}
```

## Support

If you're still having issues after following this guide:
1. Verify your SMTP credentials work using the verification script above
2. Check Vercel function logs for specific error messages
3. Ensure your SMTP provider account is active and not blocked

---

**Status**: ⚠️ REQUIRES MANUAL CONFIGURATION  
**Priority**: HIGH (blocking admin user creation)  
**ETA**: 5-10 minutes (after getting correct SMTP credentials)
