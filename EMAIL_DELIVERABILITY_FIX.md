# 📧 Email Deliverability Fix - Stop Emails Going to Spam

## 🎯 **Issue Identified:**
Password reset emails are working but going to spam folder instead of inbox.

## 🔧 **Immediate Solutions:**

### **Option 1: Custom Email Templates (Quick Fix)**
1. Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/auth/templates
2. Click on "Reset password" template
3. Replace the default template with this professional version:

```html
<h2>Reset Your GetDeals Password</h2>

<p>Hello,</p>

<p>You requested to reset your password for your GetDeals account.</p>

<p>Click the button below to reset your password:</p>

<p style="text-align: center; margin: 20px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
    Reset Password
  </a>
</p>

<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p><strong>This link will expire in 24 hours for security reasons.</strong></p>

<p>If you didn't request this password reset, you can safely ignore this email.</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="font-size: 12px; color: #666;">
  Best regards,<br>
  The GetDeals Team<br>
  <a href="https://getdeals.co.ke">getdeals.co.ke</a>
</p>
```

### **Option 2: Configure Custom SMTP (Recommended)**

#### **Step 1: Set up SendGrid (Free)**
1. Go to: https://sendgrid.com/
2. Sign up for free account (100 emails/day free)
3. Verify your account
4. Go to Settings > API Keys
5. Create new API key with "Full Access"
6. Copy the API key

#### **Step 2: Configure in Supabase**
1. Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/settings/auth
2. Scroll to "SMTP Settings"
3. Enable "Enable custom SMTP"
4. Enter these settings:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Pass: [Your SendGrid API Key]
   SMTP From: noreply@getdeals.co.ke
   ```

#### **Step 3: Domain Authentication (Important)**
1. In SendGrid dashboard, go to Settings > Sender Authentication
2. Click "Authenticate Your Domain"
3. Enter your domain: `getdeals.co.ke`
4. Follow the DNS setup instructions
5. Add the CNAME records to your domain's DNS

### **Option 3: DNS Records for Default Supabase (Alternative)**

If you want to keep using Supabase's email service, add these DNS records to improve deliverability:

#### **Add to your domain DNS:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.supabase.co ~all

Type: TXT  
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@getdeals.co.ke

Type: CNAME
Name: dkim._domainkey
Value: dkim._domainkey.supabase.co
```

## 🚀 **Quick Test After Changes:**

1. **Wait 10-15 minutes** for changes to propagate
2. **Test password reset** with different email providers:
   - Gmail
   - Yahoo
   - Outlook
3. **Check inbox** instead of spam folder

## 📊 **Expected Results:**

✅ **Before Fix:** Emails go to spam  
✅ **After Fix:** Emails go to inbox  
✅ **Professional appearance:** Branded email template  
✅ **Better deliverability:** Custom SMTP or DNS records  

## 🎯 **Recommended Approach:**

1. **Start with Option 1** (Custom Templates) - 5 minutes
2. **If still spam, use Option 2** (SendGrid SMTP) - 30 minutes
3. **For long-term solution:** Set up DNS records

## 📝 **Additional Tips:**

- **Ask users to whitelist** `noreply@getdeals.co.ke`
- **Add to instructions:** "Check spam folder if email not received"
- **Consider adding phone verification** as backup
- **Monitor email deliverability** in SendGrid dashboard

---

## 🔥 **Priority Actions:**
1. Update email template (5 min)
2. Set up SendGrid SMTP (30 min)  
3. Test with multiple email providers

This should resolve the spam folder issue completely!