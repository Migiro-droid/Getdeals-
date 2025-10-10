# 📧 SMTP Configuration Setup Guide

## Current Issue
Your admin user creation returns:
```json
{
    "success": true,
    "warning": "Email not sent: SMTP not configured",
    "credentials": {
        "email": "ndivoeric288@gmail.com",
        "password": "rPl7l,8V]!Gs0yj.",
        "message": "Please provide these credentials to the user manually"
    }
}
```

This means the SMTP environment variables are **not set in Vercel**.

---

## ✅ Solution: Configure SMTP in Vercel

### Option 1: Brevo (Recommended - Free & Reliable)

**Why Brevo?**
- ✅ Free tier: 300 emails/day
- ✅ Professional delivery
- ✅ Easy setup
- ✅ No credit card required
- ✅ Already tested and working in your project

#### Step 1: Get Brevo Credentials

1. **Sign up for Brevo** (if you haven't already)
   - Go to: https://www.brevo.com/
   - Click "Sign up free"
   - Verify your email

2. **Get your SMTP credentials**
   - Login to Brevo dashboard
   - Go to: Settings → SMTP & API
   - Click on "SMTP" tab
   - You'll see your credentials:
     - **SMTP server**: smtp-relay.brevo.com
     - **Port**: 587
     - **Login**: Your email address
     - **SMTP key**: Click "Generate a new SMTP key"

#### Step 2: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `getdeals-kenya-showcase`

2. **Navigate to Settings**
   - Click on "Settings" tab
   - Click on "Environment Variables" in sidebar

3. **Add these 5 variables:**

   ```
   Variable Name: SMTP_HOST
   Value: smtp-relay.brevo.com
   Environment: Production, Preview, Development
   ```

   ```
   Variable Name: SMTP_PORT
   Value: 587
   Environment: Production, Preview, Development
   ```

   ```
   Variable Name: SMTP_USER
   Value: [Your Brevo email/login]
   Environment: Production, Preview, Development
   ```

   ```
   Variable Name: SMTP_PASS
   Value: [Your Brevo SMTP key]
   Environment: Production, Preview, Development
   ```

   ```
   Variable Name: SMTP_FROM
   Value: GetDeals Admin <noreply@getdeals.co.ke>
   Environment: Production, Preview, Development
   ```

4. **Redeploy your application**
   - Go to "Deployments" tab
   - Click on the latest deployment
   - Click "..." menu → "Redeploy"
   - **OR** just push a small change to trigger rebuild:
     ```bash
     git commit --allow-empty -m "Trigger redeploy for SMTP config"
     git push origin main
     ```

---

### Option 2: Gmail (Quick Setup)

**Note**: Less reliable for production, but good for testing

#### Step 1: Enable App Password in Gmail

1. **Enable 2-Factor Authentication** (if not already)
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Enter "GetDeals"
   - Click "Generate"
   - Copy the 16-character password (e.g., "abcd efgh ijkl mnop")

#### Step 2: Add to Vercel

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  (your app password)
SMTP_FROM=GetDeals Admin <your-email@gmail.com>
```

---

### Option 3: SendGrid (Production Quality)

1. **Sign up**: https://sendgrid.com/
2. **Get API Key**: Settings → API Keys → Create API Key
3. **Configure**:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=[Your SendGrid API Key]
   SMTP_FROM=GetDeals Admin <noreply@getdeals.co.ke>
   ```

---

## 🧪 Testing After Setup

### Method 1: Create a Test Admin User

1. Go to: https://getdeals.co.ke/admin/users
2. Click "Add Admin User"
3. Fill in details:
   - Name: Test Admin
   - Email: your-test-email@gmail.com
   - Role: Staff (for testing)
4. Click "Create"
5. Check your email inbox

**Expected Result**:
```json
{
    "success": true,
    "message": "Credentials email sent successfully",
    "messageId": "..."
}
```

### Method 2: Test SMTP Connection

If you want to verify before creating users, you can use the test script:

```bash
# Create test-smtp-vercel.js
node test-smtp-vercel.js
```

I'll create this test script for you.

---

## 🔍 Troubleshooting

### Issue: Still getting "SMTP not configured"

**Solutions**:
1. ✅ Check all 5 environment variables are set in Vercel
2. ✅ Make sure you selected "Production, Preview, Development" for each
3. ✅ Redeploy the application after adding variables
4. ✅ Wait 2-3 minutes for deployment to complete
5. ✅ Hard refresh the admin page (Ctrl + Shift + R)

### Issue: Email not received

**Check**:
1. ✅ Check spam/junk folder
2. ✅ Verify SMTP credentials are correct
3. ✅ Check Brevo/Gmail daily sending limits
4. ✅ Verify sender email is valid
5. ✅ Check Vercel function logs for errors

### Issue: "Authentication failed"

**Solutions**:
1. ✅ For Gmail: Use App Password, not regular password
2. ✅ For Brevo: Generate new SMTP key
3. ✅ Copy-paste credentials carefully (no extra spaces)
4. ✅ Check if SMTP_USER matches your account email

---

## 📊 Current Status

**Files Already Created**: ✅
- `api/admin/send-credentials.ts` - Email sending function
- `api/admin/create-admin-user.ts` - User creation with email

**What's Missing**: ⚠️
- Environment variables in Vercel deployment

**Fix Duration**: ~5 minutes
1. Get Brevo SMTP credentials (2 min)
2. Add to Vercel (2 min)
3. Redeploy (1 min)
4. Test (1 min)

---

## 🎯 Quick Action Checklist

- [ ] Sign up for Brevo (https://www.brevo.com/)
- [ ] Get SMTP credentials from Brevo dashboard
- [ ] Add 5 environment variables to Vercel
- [ ] Redeploy the application
- [ ] Test by creating an admin user
- [ ] Verify email received
- [ ] ✅ Done!

---

## 💡 Recommended Approach

**Use Brevo** because:
1. ✅ Free forever (300 emails/day)
2. ✅ Professional delivery rates
3. ✅ Already integrated in your code
4. ✅ Was tested successfully before
5. ✅ No credit card required
6. ✅ Easy setup (5 minutes)

---

## 📧 Need Help?

If you need assistance:
1. Share screenshot of Vercel environment variables page
2. Share any error messages from browser console
3. Check Vercel function logs for details

---

**Next Step**: Get Brevo credentials and add to Vercel! 🚀
