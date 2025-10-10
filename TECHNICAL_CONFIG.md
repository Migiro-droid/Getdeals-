# Wallet-to-Merchant Payment - Technical Configuration

**Date:** October 7, 2025  
**Status:** ✅ Deployed & Configured

---

## 🔐 Environment Variables Configuration

### Variables Set in Supabase:

| Variable | Value | Purpose |
|----------|-------|---------|
| `RUKISHA_API_URL` | `https://api.rukisha.com/api/tap-and-go` | Base URL for Rukisha API |
| `RUKISHA_API_TOKEN` | `179568|hA8CTcN7aMwsZWbwPxPF2gSYkjbtTsN0fV8izUW0` | Authentication token |
| `RUKISHA_AGENT_ID` | `110` | Your agent/merchant ID |

### How merchant_id is Resolved:

The Edge Function uses this logic to determine `merchant_id`:

```typescript
const rukishaMerchantId = Deno.env.get('RUKISHA_MERCHANT_ID') || Deno.env.get('RUKISHA_AGENT_ID')
```

**Priority:**
1. If `RUKISHA_MERCHANT_ID` is set → use that
2. Otherwise → use `RUKISHA_AGENT_ID` (110)

**Current Configuration:** `merchant_id` = "110" (from `RUKISHA_AGENT_ID`)

---

## 📡 API Request Details

### Endpoint:
```
POST https://api.rukisha.com/api/tap-and-go/pay-merchant-with-rukisha
```

### Headers:
```http
Content-Type: application/json
Authorization: Bearer 179568|hA8CTcN7aMwsZWbwPxPF2gSYkjbtTsN0fV8izUW0
Accept: application/json
```

### Request Body:
```json
{
  "merchant_id": "110",
  "amount": 1000,
  "phone": "254719575272",
  "customer_id": "GD-123456",
  "callback_url": "https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/wallet-payment-callback",
  "reference": "GD1728345678ABCD"
}
```

### Field Details:

| Field | Source | Description |
|-------|--------|-------------|
| `merchant_id` | `RUKISHA_AGENT_ID` env var | Your merchant/agent ID (110) |
| `amount` | User input | Payment amount in KES |
| `phone` | User input | Customer's phone number |
| `customer_id` | User profile | From `user_profile.customer_id` or `getdeals_number` |
| `callback_url` | Supabase URL | Webhook endpoint for payment status updates |
| `reference` | Generated | Unique order reference (e.g., GD1728345678ABCD) |

---

## 🔄 How customer_id is Determined:

The Edge Function uses this fallback logic:

```typescript
customer_id: profile.customer_id || profile.getdeals_number || user.id
```

**Priority:**
1. `user_profile.customer_id` (if set)
2. `user_profile.getdeals_number` (if customer_id is null)
3. `user.id` (Supabase auth user ID as last resort)

---

## 🎯 API Response Examples

### Success Response:
```json
{
  "success": true,
  "transaction_id": "RUK123456789",
  "status": "processing",
  "message": "Payment initiated successfully",
  "reference": "GD1728345678ABCD"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Insufficient balance in customer wallet",
  "message": "Customer wallet has insufficient funds"
}
```

---

## 📥 Callback Webhook

### Callback URL:
```
https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/wallet-payment-callback
```

### Expected Callback Payload from Rukisha:
```json
{
  "transaction_id": "RUK123456789",
  "reference": "GD1728345678ABCD",
  "status": "completed",
  "amount": 1000,
  "phone": "254719575272",
  "confirmation_code": "ABC123XYZ",
  "timestamp": "2025-10-07T12:34:56Z"
}
```

### Callback Handler Actions:

1. **Find Transaction:** Look up by `reference`
2. **Update Status:** Set to `completed` or `failed`
3. **Handle Failure:** Rollback wallet balance if payment failed
4. **Log Details:** Store callback data in `metadata` column

---

## 🔍 Transaction Metadata Structure

The `metadata` JSONB column stores:

```json
{
  "merchant_id": "110",
  "customer_id": "GD-123456",
  "payment_type": "wallet_to_merchant",
  "rukisha_request": {
    "merchant_id": "110",
    "amount": 1000,
    "phone": "254719575272",
    "customer_id": "GD-123456",
    "callback_url": "https://...",
    "reference": "GD1728345678ABCD"
  },
  "rukisha_response": {
    "success": true,
    "transaction_id": "RUK123456789",
    "status": "processing"
  },
  "rukisha_status": "processing",
  "callback_received": true,
  "callback_data": {
    "transaction_id": "RUK123456789",
    "status": "completed",
    "confirmation_code": "ABC123XYZ"
  },
  "callback_timestamp": "2025-10-07T12:34:56Z"
}
```

---

## ✅ Verification Checklist

### Environment Variables:
- [x] RUKISHA_API_URL set correctly
- [x] RUKISHA_API_TOKEN configured
- [x] RUKISHA_AGENT_ID = "110"
- [x] merchant_id resolved to "110"

### Edge Functions:
- [x] wallet-to-merchant-payment deployed
- [x] wallet-payment-callback deployed
- [x] Functions responding to requests

### API Integration:
- [x] Correct endpoint URL
- [x] Proper authentication header
- [x] Complete request payload
- [x] merchant_id included in payload

### Database:
- [ ] metadata column added (pending migration)
- [ ] 'processing' status allowed (pending migration)
- [ ] Indexes created (pending migration)
- [ ] Trigger configured (pending migration)

---

## 🧪 Test Scenarios

### Scenario 1: Successful Payment
```
Input: amount=100, phone=254719575272
Expected: 
- Balance deducted: -100 KES
- Transaction created with status 'processing'
- Rukisha API returns success
- Callback updates status to 'completed'
```

### Scenario 2: Insufficient Balance
```
Input: amount=10000, wallet_balance=500
Expected:
- Error: "Insufficient balance"
- No transaction created
- No API call made
- Balance unchanged
```

### Scenario 3: Payment Failure
```
Input: amount=100, phone=254719575272
Rukisha Response: { success: false, error: "..." }
Expected:
- Transaction marked 'failed'
- Balance rolled back: +100 KES
- Error message shown to user
```

---

## 📊 Monitoring Queries

### Check Recent Payments:
```sql
SELECT 
  id,
  type,
  amount,
  status,
  reference,
  transaction_id,
  metadata->>'merchant_id' as merchant_id,
  metadata->>'rukisha_status' as rukisha_status,
  created_at
FROM wallet_transactions
WHERE type = 'payment'
  AND metadata->>'payment_type' = 'wallet_to_merchant'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Payment Success Rate:
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM wallet_transactions
WHERE type = 'payment'
  AND metadata->>'payment_type' = 'wallet_to_merchant'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Find Failed Payments:
```sql
SELECT 
  id,
  reference,
  amount,
  status,
  metadata->>'error' as error_message,
  metadata->'rukisha_response' as rukisha_response,
  created_at
FROM wallet_transactions
WHERE status = 'failed'
  AND type = 'payment'
  AND metadata->>'payment_type' = 'wallet_to_merchant'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 Configuration Management

### To Update Environment Variables:

```powershell
# Update API token
npx supabase secrets set RUKISHA_API_TOKEN="new-token-here" --project-ref fxyifnckgllxqbggegtw

# Update agent/merchant ID
npx supabase secrets set RUKISHA_AGENT_ID="new-id" --project-ref fxyifnckgllxqbggegtw

# Or set explicit merchant ID (takes priority)
npx supabase secrets set RUKISHA_MERCHANT_ID="merchant-id" --project-ref fxyifnckgllxqbggegtw
```

### To View Current Configuration:

```sql
-- Check what merchant_id will be used
SELECT 
  'RUKISHA_AGENT_ID' as variable,
  '110' as current_value
UNION ALL
SELECT 
  'merchant_id (resolved)',
  '110'
```

---

## 📞 Support Information

**Supabase Project:** fxyifnckgllxqbggegtw  
**Rukisha Agent ID:** 110  
**API Token:** 179568|hA8CTcN7aMwsZWbwPxPF2gSYkjbtTsN0fV8izUW0

**Edge Functions:**
- wallet-to-merchant-payment
- wallet-payment-callback

**Callback URL for Rukisha:**
```
https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/wallet-payment-callback
```

---

**Configuration Status:** ✅ Complete & Ready for Testing
