# 🎯 Quick Setup: Vercel Environment Variables

## Copy these to Vercel Dashboard

**Location**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

---

## Option 1: Brevo (Recommended)

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=[Your Brevo email/login]
SMTP_PASS=[Your Brevo SMTP key]
SMTP_FROM=GetDeals Admin <noreply@getdeals.co.ke>
```

**Get Brevo credentials**:
1. Sign up: https://www.brevo.com/
2. Dashboard → Settings → SMTP & API
3. Click "Generate a new SMTP key"
4. Copy the key

---

## Option 2: Gmail (For Testing)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[your-email@gmail.com]
SMTP_PASS=[your-app-password]
SMTP_FROM=GetDeals Admin <your-email@gmail.com>
```

**Get Gmail App Password**:
1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → "Other (Custom name)" → "GetDeals"
4. Copy the 16-character password

---

## ✅ Vercel Setup Steps

### 1. Navigate to Environment Variables
```
Vercel Dashboard → getdeals-kenya-showcase → Settings → Environment Variables
```

### 2. Add Each Variable

For **each** of the 5 variables above:

1. Click "Add New"
2. **Name**: (e.g., `SMTP_HOST`)
3. **Value**: (e.g., `smtp-relay.brevo.com`)
4. **Environments**: ✅ Check all 3:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click "Save"

### 3. Redeploy

**Option A**: Trigger from Vercel
- Go to "Deployments" tab
- Click latest deployment
- Click "..." → "Redeploy"

**Option B**: Push a commit
```bash
git commit --allow-empty -m "Add SMTP configuration"
git push origin main
```

### 4. Wait for Deployment
- Wait 2-3 minutes for build to complete
- Check deployment status in Vercel dashboard

### 5. Test
- Go to: https://getdeals.co.ke/admin/users
- Click "Add Admin User"
- Fill in details
- Click "Create"
- Check email inbox

---

## ✅ Expected Success Response

```json
{
    "success": true,
    "message": "Credentials email sent successfully",
    "messageId": "abc123..."
}
```

## ❌ Before Setup (Current Error)

```json
{
    "success": true,
    "warning": "Email not sent: SMTP not configured",
    "credentials": {
        "email": "user@example.com",
        "password": "generated-password",
        "message": "Please provide these credentials to the user manually"
    }
}
```

---

## 🔍 Verification Checklist

After adding variables to Vercel:

- [ ] All 5 variables added (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
- [ ] All 3 environments selected (Production, Preview, Development)
- [ ] Application redeployed
- [ ] Deployment completed successfully
- [ ] Hard refresh admin page (Ctrl + Shift + R)
- [ ] Test admin user creation
- [ ] Email received successfully

---

## 🆘 Troubleshooting

### Still Getting "SMTP not configured"?

1. **Check Variables in Vercel**
   - Verify all 5 variables are shown in the list
   - Confirm "Production" is checked
   
2. **Verify Deployment**
   - Check deployment completed (green checkmark)
   - New deployment should be live (not previous one)
   
3. **Clear Cache**
   - Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   - Or open in incognito/private window
   
4. **Check Vercel Logs**
   - Vercel Dashboard → Deployments → Latest
   - Click on "Functions" tab
   - Check `/api/admin/send-credentials` logs

### Email Not Received?

1. Check spam/junk folder
2. Wait 2-3 minutes (may be delayed)
3. Verify SMTP credentials are correct
4. Test credentials locally first: `node test-smtp-vercel.js`

---

## 📞 Support

If still having issues:
1. Screenshot Vercel environment variables page
2. Screenshot error message from admin page
3. Check browser console for errors (F12)
4. Check Vercel function logs

---

**Estimated Setup Time**: 5-10 minutes

**Difficulty**: ⭐⭐☆☆☆ (Easy)

---

✅ Once setup, admin user creation will automatically send emails!
