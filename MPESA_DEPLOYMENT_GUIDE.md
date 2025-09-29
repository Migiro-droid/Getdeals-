# 🚀 M-Pesa Integration Deployment Guide

## ✅ **Integration Fixed - Ready for Production**

Your M-Pesa integration has been **completely consolidated** and is now ready for deployment. Here's what was implemented:

---

## 🏗️ **What Was Done**

### **✅ Consolidated Architecture**
- ❌ **Removed**: Redundant `mpesa-service` microservice
- ❌ **Removed**: Duplicate M-Pesa endpoints from main server  
- ✅ **Implemented**: Single source of truth using Vercel Edge Functions

### **✅ New M-Pesa Endpoints**
1. **STK Push**: `/api/payments/mpesa/stk-push.ts`
2. **Callback**: `/api/payments/mpesa/callback.ts`

### **✅ Complete Transaction Flow**
- STK Push initiation with proper validation
- Payment record creation in Supabase
- Callback processing with order status updates
- Comprehensive error handling and logging

---

## 🔧 **Deployment Steps**

### **1. Configure Vercel Environment Variables**

In your Vercel Dashboard, add these environment variables:

```env
# M-Pesa Credentials (CRITICAL - Get from Safaricom)
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret  
MPESA_PASSKEY=your_production_passkey
MPESA_SHORTCODE=your_production_shortcode
MPESA_ENVIRONMENT=production

# Supabase (CRITICAL - Get from Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **2. Deploy to Vercel**

```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://getdeals.co.ke/api/payments/mpesa/stk-push
```

### **3. Update Safaricom Developer Portal**

**CRITICAL**: Update your callback URL in Safaricom portal:

- **Old**: `https://getdeals.co.ke:3001/api/payments/mpesa/callback` ❌
- **New**: `https://getdeals.co.ke/api/payments/mpesa/callback` ✅

### **4. Test Integration**

```bash
# Test STK Push
curl -X POST https://getdeals.co.ke/api/payments/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 1,
    "orderId": "test_order_123"
  }'

# Expected Response:
{
  "success": true,
  "CheckoutRequestID": "ws_CO_123456789",
  "ResponseCode": "0",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

### **5. Monitor Callback**

Check Vercel function logs to ensure callbacks are being received:
- Navigate to Vercel Dashboard → Functions → `api/payments/mpesa/callback`
- Monitor real-time logs during test payments

---

## 🔗 **New API Endpoints**

### **STK Push**
```
POST /api/payments/mpesa/stk-push
Content-Type: application/json

{
  "phoneNumber": "254712345678",
  "amount": 100,
  "orderId": "order_123"
}
```

### **Callback (Safaricom → Your App)**
```
POST /api/payments/mpesa/callback
(Automatic from Safaricom)
```

---

## 🎯 **Frontend Updates Required**

Update your frontend to use the new endpoint:

```javascript
// OLD - Remove this
const response = await fetch('https://getdeals.co.ke:3001/api/payments/mpesa/stk-push', {...});

// NEW - Use this
const response = await fetch('/api/payments/mpesa/stk-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '254712345678',
    amount: 100,
    orderId: 'order_123'
  })
});
```

---

## 📊 **Database Schema Updates**

Ensure your `payments` table has these columns:

```sql
-- Verify payments table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments';

-- Required columns:
-- transaction_id (for CheckoutRequestID)
-- merchant_request_id  
-- mpesa_receipt_number
-- status (pending, success, failed)
-- amount (in cents)
-- phone_number
-- order_id
```

---

## 🛡️ **Security Features Implemented**

✅ **Input Validation**: Phone format, amount limits  
✅ **Environment Variables**: Secure credential storage  
✅ **Error Handling**: Graceful failure responses  
✅ **Callback Validation**: Basic payload verification  
✅ **CORS Configuration**: Proper API access control  

---

## 🚨 **Critical Success Factors**

### **1. Environment Variables**
- **MUST** be set in Vercel (not in code)
- **MUST** use production M-Pesa credentials  
- **MUST** include Supabase service role key

### **2. Callback URL**
- **MUST** be updated in Safaricom portal
- **MUST** be accessible (no port numbers)
- **MUST** accept POST requests

### **3. Database Permissions**
- **MUST** allow service role to update `payments` and `orders` tables
- **MUST** have proper RLS policies configured

---

## 🔍 **Testing Checklist**

- [ ] Vercel deployment successful
- [ ] Environment variables configured  
- [ ] Callback URL updated in Safaricom portal
- [ ] STK Push endpoint accessible
- [ ] Test payment initiated successfully
- [ ] Callback received and processed
- [ ] Order status updated in database
- [ ] Frontend updated to use new endpoint

---

## 📞 **Support & Troubleshooting**

### **Common Issues**

1. **"Callback not working"**
   - Check Vercel function logs
   - Verify callback URL in Safaricom portal
   - Ensure no trailing slashes

2. **"STK Push not sent"**
   - Verify M-Pesa credentials in Vercel
   - Check phone number format (254...)
   - Confirm environment is set to 'production'

3. **"Orders not updating"**  
   - Check Supabase RLS policies
   - Verify service role key permissions
   - Monitor database logs

### **Monitoring**

```sql
-- Monitor recent payments
SELECT * FROM payments 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC;

-- Check callback processing
SELECT transaction_id, status, processed_at 
FROM payments 
WHERE processed_at IS NOT NULL;
```

---

## 🎉 **You're Ready!**

Your M-Pesa integration is now:
- ✅ **Consolidated** to a single source of truth
- ✅ **Production-ready** with proper error handling  
- ✅ **Secure** with environment-based configuration
- ✅ **Scalable** using Vercel's serverless infrastructure

**Next Step**: Deploy and test with a small real payment! 🚀