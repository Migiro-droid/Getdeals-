# Rukisha Webhook Configuration Guide

## 🔗 Callback URLs

### Production Callback URL
```
https://getdeals.co.ke/api/webhooks/rukisha
```

### Test Callback URL (for validation)
```
https://getdeals.co.ke/api/webhooks/test-rukisha
```

## ✅ Endpoint Validation

### Test if the endpoint is accessible:

**Using Browser (GET request):**
```
https://getdeals.co.ke/api/webhooks/rukisha
```
Should return:
```json
{
  "success": true,
  "message": "Rukisha webhook endpoint is active",
  "endpoint": "/api/webhooks/rukisha",
  "accepts": "POST requests with callback data"
}
```

**Using curl (GET request):**
```bash
curl https://getdeals.co.ke/api/webhooks/rukisha
```

**Using curl (POST test):**
```bash
curl -X POST https://getdeals.co.ke/api/webhooks/test-rukisha \
  -H "Content-Type: application/json" \
  -d '{
    "TransactionID": "TEST123",
    "TransactionType": "deposit",
    "Amount": 100,
    "Phone": "254712345678",
    "Status": "completed",
    "ConfirmationCode": "ABC123",
    "Timestamp": "2025-10-07T10:00:00Z",
    "Reference": "REF123"
  }'
```

## 📋 Expected Callback Data Format

Rukisha should send POST requests to `/api/webhooks/rukisha` with the following JSON structure:

```json
{
  "TransactionID": "string (required)",
  "TransactionType": "deposit | withdrawal",
  "Amount": "number (required)",
  "Phone": "string (required)",
  "Status": "completed | failed | pending (required)",
  "ConfirmationCode": "string (required)",
  "Timestamp": "string (ISO format)",
  "Reference": "string (optional - our transaction reference)",
  "Description": "string (optional)"
}
```

## 🔧 Troubleshooting

### Issue: "Invalid callback URL"

**Possible causes:**
1. **SSL Certificate**: Rukisha requires HTTPS endpoints with valid SSL certificates
   - ✅ getdeals.co.ke has a valid SSL certificate from Vercel

2. **Endpoint not responding**: The endpoint must respond to validation requests
   - ✅ Now supports GET requests for validation
   - ✅ Now supports OPTIONS requests for CORS

3. **Firewall/Access restrictions**: The endpoint must be publicly accessible
   - ✅ No authentication required for webhook endpoint
   - ✅ CORS headers configured in vercel.json

4. **Response format**: Rukisha may expect specific response format
   - ✅ Returns proper JSON with success/error fields

### Validation Steps:

1. **Test GET request:**
   ```bash
   curl -v https://getdeals.co.ke/api/webhooks/rukisha
   ```
   Should return 200 OK with JSON response

2. **Test POST request:**
   ```bash
   curl -X POST https://getdeals.co.ke/api/webhooks/test-rukisha \
     -H "Content-Type: application/json" \
     -d '{"TransactionID":"TEST","Status":"completed"}'
   ```
   Should return 200 OK with validation details

3. **Check Vercel deployment:**
   - Go to: https://vercel.com/ericndivo/getdeals-kenya-showcase
   - Check Functions tab for any errors
   - View logs for webhook requests

## 📞 Information to Provide to Rukisha Support

**Callback URL:**
```
https://getdeals.co.ke/api/webhooks/rukisha
```

**Supported Methods:**
- GET (for URL validation)
- POST (for actual callbacks)
- OPTIONS (for CORS preflight)

**Expected Response Format:**
```json
{
  "success": true,
  "message": "Callback processed successfully",
  "transaction_id": "xxx"
}
```

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

**Content-Type:** `application/json`

**SSL/TLS:** Valid certificate (Vercel automatic SSL)

## 🔍 Monitoring

### View webhook logs:
1. Go to Vercel Dashboard: https://vercel.com/ericndivo/getdeals-kenya-showcase
2. Click on "Functions" tab
3. Find `/api/webhooks/rukisha`
4. View real-time logs

### Check database for transactions:
```sql
-- Check recent wallet transactions
SELECT * FROM wallet_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check pending transactions
SELECT * FROM wallet_transactions 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

## 📝 Deployment Notes

After making changes to the webhook:
1. Commit and push changes to GitHub
2. Vercel auto-deploys from main branch
3. Wait 1-2 minutes for deployment
4. Test the endpoint with curl/browser
5. Provide updated information to Rukisha if needed

## 🆘 Support Contact

If issues persist:
1. Check Vercel function logs
2. Check Supabase database logs
3. Test with `/api/webhooks/test-rukisha` endpoint
4. Contact Rukisha support with:
   - Exact error message
   - Timestamp of test
   - Screenshots of validation attempts
   - Logs from our test endpoint
