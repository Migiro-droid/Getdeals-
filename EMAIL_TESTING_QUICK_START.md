# Email Testing Quick Start 📧

## ✅ What Was Implemented

### Email Integration Summary

**Status:** ✅ **COMPLETE** - All transactional emails are now integrated

**Email Types:**
1. ✅ Welcome Email (on user signup)
2. ✅ Order Confirmation Email (after order placement)
3. ✅ Payment Confirmation Email (after successful payment)

**Integration Points:**
- ✅ User Signup → Welcome Email
- ✅ M-Pesa Payment → Payment + Order Confirmation
- ✅ Wallet Payment → Payment + Order Confirmation
- ✅ Other Payments → Order Confirmation

---

## 🚀 Testing the Email Service

### Option 1: Test Via Production Deployment (Recommended)

Since the code is deployed to production, test emails will work automatically when:

1. **New User Signs Up**
   - Go to https://getdeals.co.ke
   - Click "Sign Up"
   - Complete registration
   - ✅ Welcome email will be sent to your email

2. **Complete a Wallet Payment**
   - Add items to cart
   - Go to checkout
   - Select "GetDeals Wallet" as payment method
   - Complete order
   - ✅ Payment confirmation + Order confirmation emails sent

3. **Complete an M-Pesa Payment**
   - Add items to cart
   - Go to checkout
   - Select "Mobile Money" → M-Pesa
   - Complete payment
   - ✅ Payment confirmation + Order confirmation emails sent

---

### Option 2: Test Using Automated Script (After Deployment)

**Prerequisites:**
- Vercel deployment must be live
- Internet connection

**Run Test:**
```powershell
# Deploy first
vercel --prod

# Wait for deployment to complete, then test
node test-email-service.js your-email@example.com --prod
```

**Expected Output:**
```
🧪 GetDeals Email Service Test Suite
=====================================
📬 Test recipient: your@email.com
🌐 API Base URL: https://getdeals.co.ke
📍 Mode: PRODUCTION

🔍 Checking server connectivity...
✅ Server is reachable

📧 Testing Welcome Email...
✅ Welcome email sent successfully!
   Message ID: <message-id>

📦 Testing Order Confirmation Email...
✅ Order confirmation email sent successfully!
   Message ID: <message-id>

💰 Testing Payment Confirmation Email...
✅ Payment confirmation email sent successfully!
   Message ID: <message-id>

📊 Test Results Summary
======================
Welcome Email:          ✅ PASS
Order Confirmation:     ✅ PASS
Payment Confirmation:   ✅ PASS

🎉 All tests passed!

📬 Check your@email.com for the test emails!
```

---

### Option 3: Manual API Testing with cURL

**Test Welcome Email:**
```powershell
curl -X POST https://getdeals.co.ke/api/email/send `
  -H "Content-Type: application/json" `
  -d '{
    \"type\": \"welcome\",
    \"recipientEmail\": \"your-email@example.com\",
    \"data\": {
      \"name\": \"Test User\",
      \"email\": \"your-email@example.com\",
      \"organization\": \"Test Org\"
    }
  }'
```

**Test Order Confirmation:**
```powershell
curl -X POST https://getdeals.co.ke/api/email/send `
  -H "Content-Type: application/json" `
  -d '{
    \"type\": \"order-confirmation\",
    \"recipientEmail\": \"your-email@example.com\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"orderNumber\": \"ORD-TEST-12345\",
      \"total\": 2500,
      \"items\": [{\"name\": \"Coffee\", \"quantity\": 2, \"price\": 1000}],
      \"deliveryAddress\": \"123 Test Street\",
      \"paymentMethod\": \"M-Pesa\",
      \"createdAt\": \"2025-10-08T10:00:00Z\"
    }
  }'
```

**Test Payment Confirmation:**
```powershell
curl -X POST https://getdeals.co.ke/api/email/send `
  -H "Content-Type: application/json" `
  -d '{
    \"type\": \"payment-confirmation\",
    \"recipientEmail\": \"your-email@example.com\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"transactionId\": \"TXN-TEST-67890\",
      \"amount\": 2500,
      \"paymentMethod\": \"M-Pesa\",
      \"orderNumber\": \"ORD-TEST-12345\",
      \"paidAt\": \"2025-10-08T10:00:00Z\"
    }
  }'
```

---

## 🔍 Monitoring Email Delivery

### Check Brevo Dashboard

1. Go to https://app.brevo.com
2. Login with your credentials
3. Navigate to **Statistics** → **Email**
4. You'll see:
   - Total emails sent
   - Delivery rate
   - Open rate
   - Bounce rate

### Check Application Logs

**Vercel Logs:**
```powershell
vercel logs --follow
```

**Look for these log messages:**
```
✅ Welcome email sent successfully
✅ Order confirmation email sent
✅ Payment confirmation email sent
✅ Wallet payment emails sent successfully
```

---

## 📊 What Happens When You Test

### Welcome Email Test
- **Recipient:** Your test email
- **Subject:** "Welcome to GetDeals Kenya! 🎉"
- **Content:**
  - Welcome message
  - Account details
  - Quick start guide
  - "Start Shopping Now" button

### Order Confirmation Test
- **Recipient:** Your test email
- **Subject:** "Order Confirmed - ORD-TEST-12345 📦"
- **Content:**
  - Order summary
  - Item list with quantities
  - Delivery address
  - Total amount
  - Next steps

### Payment Confirmation Test
- **Recipient:** Your test email
- **Subject:** "Payment Confirmed - TXN-TEST-67890 ✅"
- **Content:**
  - Transaction ID
  - Amount paid (KES 2,500)
  - Payment method
  - Order number
  - Receipt details

---

## ⚙️ Current Configuration

**Email Provider:** Brevo (Sendinblue)  
**API Key:** Configured in `.env`  
**Sender:** info@getdeals.co.ke  
**Template Mode:** HTML Fallback (custom templates)  
**Daily Limit:** 300 emails/day (free tier)

---

## 🎯 Next Steps After Testing

1. **✅ Verify emails arrive** - Check inbox and spam folder
2. **✅ Review email content** - Ensure formatting looks good
3. **✅ Test on mobile** - Check responsive design
4. **✅ Monitor delivery rates** - Check Brevo dashboard
5. **Optional:** Create Brevo dashboard templates for more customization

---

## 🐛 Troubleshooting

### Emails Not Arriving

**Check 1: Spam Folder**
```
Check your spam/junk folder - test emails often go there
```

**Check 2: Brevo Account**
```
- Login to Brevo dashboard
- Verify sender email is verified
- Check daily quota (300 emails/day for free tier)
- Review account status
```

**Check 3: Application Logs**
```powershell
vercel logs --follow
# Look for email-related errors
```

### API Endpoint Not Working

**Solution: Deploy to Vercel**
```powershell
# Make sure code is deployed
vercel --prod

# Wait for deployment to complete
# Then test again
```

---

## 📝 Important Notes

1. **HTML Templates Active:** Using custom HTML templates (not Brevo dashboard templates)
2. **Auto-Triggered:** Emails send automatically during user flows
3. **Non-Blocking:** Email failures won't block order/payment completion
4. **Logged:** All email attempts are logged for debugging

---

## 📞 Support

If you encounter issues:

1. Check `EMAIL_SERVICE_GUIDE.md` for detailed documentation
2. Review Vercel logs: `vercel logs`
3. Check Brevo dashboard for delivery stats
4. Contact development team with error logs

---

**Last Updated:** October 8, 2025  
**Status:** ✅ Production Ready
