# Brevo SMTP Credentials Issue - Diagnostic & Fix

## Current Status
✅ TLS Configuration: Fixed  
❌ SMTP Authentication: **Still Failing**

**Error**: `535 5.7.8 Authentication failed`  
**Root Cause**: Invalid SMTP username or password

## Your Current Settings (from Vercel)
```
SMTP_HOST: smtp-relay.brevo.com ✅
SMTP_PORT: 587 ✅
SMTP_USER: info@getdeals.co.ke
SMTP_PASS: xsmtpsib-ef28b07f169aa4b26b5a6eaade5c7752b81cb5ac632231e228bca7b8acc704d7-Z6ITnP5FtS4DEfBr (90 chars)
SMTP_FROM: GetDeals Admin <info@getdeals.co.ke> ✅
```

## Problem Analysis

The SMTP_PASS you provided starts with `xsmtpsib-` which is the correct Brevo SMTP key format, BUT the authentication is still failing. This means:

1. ❌ The SMTP key may be **expired or revoked**
2. ❌ The SMTP key may be **regenerated** in Brevo dashboard
3. ❌ There may be **whitespace/special characters** in the copied key
4. ❌ The email `info@getdeals.co.ke` may not be **verified as a sender** in Brevo

## Solution: Regenerate Brevo SMTP Credentials

### Step 1: Log into Brevo
Go to: **https://app.brevo.com/account/smtp**

### Step 2: Check Sender Verification
1. Click **"Senders & IP"** in the left menu
2. Verify that `info@getdeals.co.ke` is in the list and has status: **✅ Verified**
3. If not verified:
   - Click "Add a sender"
   - Add `info@getdeals.co.ke`
   - Check the verification email sent to that address
   - Click the verification link

### Step 3: Generate New SMTP Key
1. Go to **Settings** → **SMTP & API**
2. Click on **"SMTP"** tab
3. Under **"SMTP Key"** section, click **"Generate a new SMTP key"**
4. Give it a name (e.g., "GetDeals Production")
5. Click **"Generate"**
6. **IMPORTANT**: Copy the entire key immediately (it won't be shown again)

The key will look like:
```
xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx
```

### Step 4: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/ericndivo/getdeals-kenya-showcase/settings/environment-variables)

2. **Update SMTP_PASS**:
   - Find `SMTP_PASS` in the list
   - Click the **"..."** menu → **"Edit"**
   - **Paste the NEW SMTP key** (make sure NO spaces before/after)
   - Select: **Production, Preview, Development**
   - Click **"Save"**

3. **Verify SMTP_USER** matches verified sender:
   - Find `SMTP_USER` in the list
   - Should be: `info@getdeals.co.ke`
   - This MUST match the verified sender email in Brevo

### Step 5: Redeploy

**CRITICAL**: Environment variables only take effect after redeployment!

```bash
# Option 1: Force redeploy with empty commit
git commit --allow-empty -m "Trigger redeploy for new Brevo SMTP key"
git push origin main

# Option 2: Redeploy via Vercel Dashboard
# Go to: Deployments → Latest → "..." → Redeploy
```

### Step 6: Wait & Test

1. **Wait 2-3 minutes** for Vercel to rebuild
2. Visit: **https://getdeals.co.ke/api/admin/test-smtp**
3. Expected result:
   ```json
   {
     "success": true,
     "smtpConnection": "✅ Verified - Credentials are correct"
   }
   ```

## Common Mistakes to Avoid

### ❌ Mistake 1: Using Account Password
**Wrong**: Your Brevo account password  
**Correct**: SMTP API Key from Settings → SMTP & API

### ❌ Mistake 2: Copy/Paste Errors
- Extra spaces before/after the key
- Line breaks in the middle of the key
- Partial key copied

**Solution**: Copy the entire key in one go, paste into a text editor first to verify

### ❌ Mistake 3: Wrong Email Address
**Wrong**: Using an unverified email as SMTP_USER  
**Correct**: Use only verified sender emails from Brevo

### ❌ Mistake 4: Not Redeploying
**Wrong**: Just updating env vars and expecting it to work  
**Correct**: MUST redeploy after changing environment variables

### ❌ Mistake 5: Using Old Key
**Wrong**: Reusing a revoked or expired key  
**Correct**: Generate fresh key if authentication fails

## Alternative: Use Different SMTP Authentication

If Brevo continues to fail, try switching to **port 465 with SSL**:

### Update in Vercel:
```
SMTP_PORT=465  (change from 587)
```

Then update the code:
```typescript
// In send-credentials.ts
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: 465,
  secure: true,  // Use SSL for port 465
  auth: {
    user: smtpUser,
    pass: smtpPass,
  }
});
```

## Verification Checklist

Before testing again, verify:

- [ ] Logged into Brevo dashboard successfully
- [ ] `info@getdeals.co.ke` is verified as a sender (green checkmark)
- [ ] Generated NEW SMTP key (starts with `xsmtpsib-`)
- [ ] Copied ENTIRE key with no spaces/line breaks
- [ ] Updated `SMTP_PASS` in Vercel with new key
- [ ] Updated for all environments (Production, Preview, Development)
- [ ] Clicked "Save" in Vercel
- [ ] Redeployed the project (`git push` or manual redeploy)
- [ ] Waited 2-3 minutes for deployment to complete
- [ ] Tested at: https://getdeals.co.ke/api/admin/test-smtp

## Still Not Working?

### Debug Step 1: Check Brevo Account Status
1. Go to Brevo Dashboard → **Account**
2. Check if account is **active** (not suspended)
3. Check **sending limits** (daily quota not exceeded)
4. Check **IP restrictions** (if any - should be "No restrictions" for Vercel)

### Debug Step 2: Test Credentials Locally

Create a test file to verify credentials work outside Vercel:

```javascript
// test-brevo-smtp.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'info@getdeals.co.ke',
    pass: 'YOUR_NEW_SMTP_KEY_HERE'  // Paste fresh key
  }
});

transporter.verify()
  .then(() => console.log('✅ SUCCESS: SMTP credentials are valid!'))
  .catch((err) => console.error('❌ FAILED:', err.message));
```

Run it:
```bash
node test-brevo-smtp.js
```

**If this fails locally**, your Brevo credentials are definitely wrong.  
**If this succeeds locally but fails on Vercel**, there's an environment variable issue.

### Debug Step 3: Check Vercel Logs
```bash
vercel logs --follow
```

Look for any errors related to SMTP authentication.

### Debug Step 4: Contact Brevo Support
If you've tried everything:
1. Go to Brevo Dashboard → **Support**
2. Create a ticket: "SMTP authentication failing with 535 5.7.8 error"
3. Provide:
   - Your Brevo account email
   - Sender email: info@getdeals.co.ke
   - SMTP settings (host, port, user)
   - Error message
   - Time of last failed attempt

## Last Resort: Use Brevo Transactional Email API

If SMTP is completely blocked, use Brevo's REST API instead:

1. **Get Brevo API Key** (not SMTP key):
   - Go to Settings → **API Keys**
   - Generate new API key
   - Add to Vercel as `BREVO_API_KEY`

2. **Update code** to use HTTP API instead of SMTP:
```typescript
// Replace nodemailer with axios
import axios from 'axios';

const response = await axios.post(
  'https://api.brevo.com/v3/smtp/email',
  {
    sender: { 
      email: 'info@getdeals.co.ke', 
      name: 'GetDeals Admin' 
    },
    to: [{ email: recipientEmail, name: recipientName }],
    subject: 'Your Admin Credentials',
    htmlContent: emailHtml
  },
  {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  }
);
```

This bypasses SMTP entirely and uses Brevo's REST API.

---

## Action Items (Do These Now)

1. ✅ Go to Brevo Dashboard: https://app.brevo.com/account/smtp
2. ✅ Verify `info@getdeals.co.ke` is a verified sender
3. ✅ Generate NEW SMTP key
4. ✅ Copy the ENTIRE key (no spaces)
5. ✅ Update `SMTP_PASS` in Vercel
6. ✅ Redeploy: `git push origin main` or manual redeploy
7. ✅ Wait 2-3 minutes
8. ✅ Test: https://getdeals.co.ke/api/admin/test-smtp

**The most likely issue is that your SMTP key is expired or invalid. Generate a fresh one!** 🔑
