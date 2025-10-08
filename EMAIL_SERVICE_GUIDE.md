# GetDeals Email Service - Implementation Guide

## 📧 Overview

GetDeals uses **Brevo (formerly Sendinblue)** for transactional email delivery with custom HTML fallback templates.

**Current Status:** ✅ Fully Integrated with HTML Templates

---

## 🎯 Implemented Email Types

### 1. Welcome Email
- **Trigger:** User signs up for the first time
- **Location:** `src/contexts/AuthContext.tsx` (line 297)
- **Template:** `src/services/email-templates.js` → `getWelcomeEmail()`
- **Content:** 
  - Welcome message
  - Account details
  - Quick start guide
  - Shopping CTA

### 2. Order Confirmation Email
- **Triggers:**
  - M-Pesa payment successful (`api/payments/mpesa/callback.ts` line 174)
  - Wallet payment successful (`src/pages/CheckoutPage.tsx` after order creation)
  - Other payment methods (`api/orders/create.ts` after order creation)
- **Template:** `src/services/email-templates.js` → `getOrderConfirmationEmail()`
- **Content:**
  - Order number and details
  - Item list with quantities
  - Delivery information
  - Total amount

### 3. Payment Confirmation Email
- **Triggers:**
  - M-Pesa payment successful (`api/payments/mpesa/callback.ts` line 156)
  - Wallet payment successful (`src/pages/CheckoutPage.tsx` after payment)
- **Template:** `src/services/email-templates.js` → `getPaymentConfirmationEmail()`
- **Content:**
  - Transaction ID
  - Amount paid
  - Payment method
  - Receipt details

---

## 🔧 Configuration

### Environment Variables (`.env`)

```bash
# Brevo API Configuration
BREVO_API_KEY="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"
BREVO_SENDER_NAME="Getdeals"
BREVO_SENDER_EMAIL="info@getdeals.co.ke"

# Template IDs (set to 1 to force HTML fallback templates)
BREVO_ORDER_CONFIRMATION_TEMPLATE_ID=1
BREVO_PAYMENT_CONFIRMATION_TEMPLATE_ID=1
BREVO_WELCOME_TEMPLATE_ID=1
BREVO_PASSWORD_RESET_TEMPLATE_ID=1

# Contact List
BREVO_CUSTOMERS_LIST_ID=5

# Frontend URL (for API calls)
FRONTEND_URL=https://getdeals.co.ke
```

### Template ID Logic

- **ID = 1 or 2**: Forces use of custom HTML templates from `email-templates.js`
- **ID ≥ 3**: Uses Brevo dashboard templates (if created)

---

## 🚀 Testing

### Quick Test Script

```bash
# Test all email types
node test-email-service.js your-email@example.com
```

### Manual API Testing

```bash
# 1. Welcome Email
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "recipientEmail": "test@example.com",
    "data": {
      "name": "John Doe",
      "email": "test@example.com",
      "organization": "Test Org"
    }
  }'

# 2. Order Confirmation
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order-confirmation",
    "recipientEmail": "test@example.com",
    "data": {
      "customerName": "John Doe",
      "orderNumber": "ORD-12345",
      "total": 2500,
      "items": [
        {"name": "Coffee", "quantity": 2, "price": 1000}
      ],
      "deliveryAddress": "123 Main St",
      "paymentMethod": "M-Pesa",
      "createdAt": "2025-10-08T10:00:00Z"
    }
  }'

# 3. Payment Confirmation
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment-confirmation",
    "recipientEmail": "test@example.com",
    "data": {
      "customerName": "John Doe",
      "transactionId": "TXN-67890",
      "amount": 2500,
      "paymentMethod": "M-Pesa",
      "orderNumber": "ORD-12345",
      "paidAt": "2025-10-08T10:00:00Z"
    }
  }'
```

---

## 📝 Code Integration Examples

### Frontend (React/TypeScript)

```typescript
// Send order confirmation email
const sendOrderEmail = async (orderData: any) => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order-confirmation',
        recipientEmail: orderData.customerEmail,
        data: {
          customerName: orderData.customerName,
          orderNumber: orderData.orderNumber,
          total: orderData.total,
          items: orderData.items,
          deliveryAddress: orderData.deliveryAddress,
          paymentMethod: orderData.paymentMethod,
          createdAt: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Email sent:', result.messageId);
    }
  } catch (error) {
    console.error('⚠️ Email failed:', error);
    // Don't block user flow if email fails
  }
};
```

### Backend (Vercel Serverless)

```typescript
// In API route
import BrevoService from '../../src/services/brevo-service-fetch.js';

const brevoService = new BrevoService();

// Send email
const result = await brevoService.sendOrderConfirmation(
  customerEmail,
  orderData
);

if (result.success) {
  console.log('Email sent:', result.messageId);
}
```

---

## 🎨 Customizing Email Templates

### Editing HTML Templates

1. Open `src/services/email-templates.js`
2. Locate the email function (e.g., `getWelcomeEmail()`)
3. Modify the `htmlContent` string
4. Redeploy the application

### Template Structure

```javascript
static getWelcomeEmail(customerName, organization) {
  const subject = 'Welcome to GetDeals Kenya! 🎉';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Your custom styles */
      </style>
    </head>
    <body>
      <!-- Your email content -->
    </body>
    </html>
  `;
  
  return { subject, htmlContent, textContent };
}
```

---

## 🔄 Migrating to Brevo Dashboard Templates

### Steps to Create Brevo Templates

1. **Login to Brevo Dashboard**
   - Go to https://app.brevo.com
   - Navigate to **Campaigns** → **Templates**

2. **Create New Template**
   - Click **Create a new template**
   - Choose **Email** → **Transactional**
   - Use drag-and-drop editor

3. **Add Dynamic Variables**
   ```
   {{ params.customerName }}
   {{ params.orderNumber }}
   {{ params.total }}
   ```

4. **Save and Get Template ID**
   - Note the template ID (e.g., 3, 4, 5)

5. **Update `.env` File**
   ```bash
   BREVO_ORDER_CONFIRMATION_TEMPLATE_ID=3
   BREVO_PAYMENT_CONFIRMATION_TEMPLATE_ID=4
   BREVO_WELCOME_TEMPLATE_ID=5
   ```

---

## 📊 Monitoring & Logs

### Check Email Delivery

- **Brevo Dashboard**: https://app.brevo.com/statistics
- **View sent emails**: Navigate to **Statistics** → **Email**
- **Monitor bounces**: Check bounce rates and email deliverability

### Application Logs

```bash
# Check Vercel logs
vercel logs

# Local development console
# Look for:
✅ Welcome email sent successfully
✅ Order confirmation email sent
⚠️  Failed to send email: [error]
```

---

## 🐛 Troubleshooting

### Email Not Sending

1. **Check API Key**
   ```bash
   # Verify in .env
   echo $BREVO_API_KEY
   ```

2. **Test API Connection**
   ```bash
   node test-email-service.js your-email@example.com
   ```

3. **Check Brevo Account**
   - Verify sender email is verified
   - Check account quota (free: 300 emails/day)
   - Review spam reports

### Email Goes to Spam

1. **Verify sender domain** in Brevo settings
2. **Add SPF/DKIM records** to DNS
3. **Review email content** for spam triggers

### Template Not Loading

1. Check template ID in `.env`
2. Verify template exists in Brevo
3. Check template ID matches (use 1 for fallback)

---

## 📚 Additional Resources

- **Brevo API Docs**: https://developers.brevo.com
- **Email Best Practices**: https://www.brevo.com/blog/email-best-practices
- **DNS Setup Guide**: https://help.brevo.com/hc/en-us/articles/208846449

---

## 🎯 Next Steps

- [ ] Monitor email delivery rates
- [ ] Create Brevo dashboard templates (optional)
- [ ] Add more email types (password reset, shipping updates)
- [ ] Implement email preferences for users
- [ ] Add email analytics tracking

---

**Last Updated:** October 8, 2025  
**Maintained By:** GetDeals Development Team
