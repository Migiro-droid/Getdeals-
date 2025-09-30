# Frontend API URL Fix - Summary

## Problem Identified
The frontend was making M-Pesa API calls to the wrong domain:
- ❌ **Wrong**: `https://getdeals-kenya-showcase.vercel.app/api/payments/mpesa/stk-push`
- ✅ **Correct**: `https://getdeals.co.ke/api/payments/mpesa/stk-push`

## Files Fixed

### 1. `src/services/mpesa-service.ts`
**Before:**
```typescript
SERVICE_URL: import.meta.env.VITE_MPESA_SERVICE_URL || 
  (import.meta.env.PROD ? 'https://getdeals-kenya-showcase.vercel.app' : 'http://localhost:3001'),
```

**After:**
```typescript
SERVICE_URL: import.meta.env.VITE_MPESA_SERVICE_URL || 
  (import.meta.env.PROD ? 'https://getdeals.co.ke' : 'http://localhost:3001'),
```

### 2. `src/pages/CheckoutPage.tsx`
**Fixed two occurrences:**
- STK Push initiation (line ~215)
- Payment status check (line ~270)

**Before:**
```typescript
const mpesaServiceUrl = import.meta.env.VITE_MPESA_SERVICE_URL || 
  (import.meta.env.PROD ? 'https://getdeals-kenya-showcase.vercel.app' : 'http://localhost:3001');
```

**After:**
```typescript
const mpesaServiceUrl = import.meta.env.VITE_MPESA_SERVICE_URL || 
  (import.meta.env.PROD ? 'https://getdeals.co.ke' : 'http://localhost:3001');
```

**Also fixed API field name:**
- ❌ `orderReference` → ✅ `orderId`

### 3. `.env` file
**Added explicit environment variable:**
```env
# M-Pesa Service URL for frontend
VITE_MPESA_SERVICE_URL="https://getdeals.co.ke"
```

## Testing Results
✅ **API Test Successful:**
```bash
POST https://getdeals.co.ke/api/payments/mpesa/stk-push
Response: 200 OK
{
  "success": true,
  "CheckoutRequestID": "ws_CO_30092025094656727708374149",
  "MerchantRequestID": "10db-4f23-bd09-87fb9a4d69434387339",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing"
}
```

## Status
✅ **FIXED** - Frontend now correctly calls M-Pesa API on custom domain
✅ **DEPLOYED** - Changes are live in production
✅ **TESTED** - API responds with successful STK Push

## Next Steps
The M-Pesa integration should now work correctly from your frontend. Users will no longer see "failed to fetch" errors when making payments.