# M-Pesa Integration - GetDeals Kenya

## Overview

The M-Pesa integration has been consolidated to use **Vercel Edge Functions** as the single source of truth, eliminating the redundant microservice and main server implementations.

## Architecture

```
Frontend → Vercel Edge Functions → Safaricom M-Pesa API
                ↓
            Supabase Database
```

## Endpoints

### 1. STK Push Initiation
**Endpoint**: `POST /api/payments/mpesa/stk-push`

**Request Body**:
```json
{
  "phoneNumber": "254712345678",
  "amount": 100,
  "orderId": "order_123",
  "description": "GetDeals Payment"
}
```

**Response**:
```json
{
  "success": true,
  "CheckoutRequestID": "ws_CO_123456789",
  "MerchantRequestID": "123456789",
  "ResponseCode": "0",
  "ResponseDescription": "Success",
  "CustomerMessage": "Check your phone for payment prompt"
}
```

### 2. Payment Callback
**Endpoint**: `POST /api/payments/mpesa/callback`

This endpoint receives callbacks from Safaricom and:
- Updates payment status in `payments` table
- Updates order status in `orders` table
- Logs transaction details

## Environment Variables

Configure these in Vercel Environment Variables (not in `.env` files):

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_ENVIRONMENT=production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  method TEXT DEFAULT 'mpesa',
  status TEXT DEFAULT 'pending', -- pending, success, failed
  phone_number TEXT,
  reference TEXT,
  transaction_id TEXT, -- CheckoutRequestID
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending', -- pending, CONFIRMED, PAYMENT_FAILED
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  -- other order fields...
);
```

## Security Features

1. **Input Validation**: Phone number format, amount limits
2. **Environment-based URLs**: Sandbox vs Production
3. **Proper Error Handling**: Graceful error responses
4. **Callback Validation**: Basic payload structure validation

## Deployment Steps

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel Dashboard

3. **Update Safaricom Developer Portal**:
   - Callback URL: `https://getdeals.co.ke/api/payments/mpesa/callback`

4. **Test Integration**:
   ```bash
   curl -X POST https://getdeals.co.ke/api/payments/mpesa/stk-push \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"254712345678","amount":1,"orderId":"test_123"}'
   ```

## Frontend Integration

Update your frontend to use the new endpoint:

```javascript
// OLD (remove this)
const response = await fetch('https://getdeals.co.ke:3001/api/payments/mpesa/stk-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber, amount, orderId })
});

// NEW (use this)
const response = await fetch('/api/payments/mpesa/stk-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber, amount, orderId })
});
```

## Troubleshooting

### Common Issues

1. **Callback not receiving data**:
   - Verify callback URL in Safaricom portal
   - Check Vercel function logs
   - Ensure environment variables are set

2. **Payment stuck in pending**:
   - Check if callback URL is accessible
   - Verify database permissions
   - Check for typos in CheckoutRequestID

3. **STK Push not sent**:
   - Verify M-Pesa credentials
   - Check phone number format
   - Confirm environment (sandbox vs production)

### Monitoring

Monitor payments using Supabase dashboard:
```sql
-- Check recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check failed payments
SELECT * FROM payments WHERE status = 'failed' ORDER BY created_at DESC;

-- Check pending payments older than 5 minutes
SELECT * FROM payments 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '5 minutes';
```

## Migration Notes

The following components were **removed**:
- `mpesa-service/` directory (standalone microservice)
- M-Pesa endpoints from `server/index.js`
- `server/lib/mpesa.js` service file

The following components are **active**:
- `api/payments/mpesa/stk-push.ts` (Vercel Edge Function)
- `api/payments/mpesa/callback.ts` (Vercel Edge Function)

## Support

For issues or questions, check:
1. Vercel function logs
2. Supabase database logs
3. Safaricom developer portal documentation