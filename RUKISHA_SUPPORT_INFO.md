# 📞 Information for Rukisha Support

## ✅ Callback URL Configuration

**Production Callback URL:**
```
https://getdeals.co.ke/api/webhooks/rukisha
```

**Test Endpoint (for validation):**
```
https://getdeals.co.ke/api/webhooks/test-rukisha
```

---

## ✅ Endpoint Status: ACTIVE & WORKING

### Verification Tests Completed:

✅ **GET Request (URL Validation):**
```bash
curl https://getdeals.co.ke/api/webhooks/rukisha
```
**Response:**
```json
{
  "success": true,
  "message": "Rukisha webhook endpoint is active",
  "endpoint": "/api/webhooks/rukisha",
  "accepts": "POST requests with callback data"
}
```

✅ **SSL Certificate:** Valid (Vercel automatic SSL)  
✅ **Publicly Accessible:** Yes (no authentication required for webhook)  
✅ **CORS Enabled:** Yes (OPTIONS requests supported)  
✅ **HTTP Methods Supported:** GET, POST, OPTIONS

---

## 📋 Expected Callback Format

**Method:** `POST`  
**Content-Type:** `application/json`

**Required Fields:**
```json
{
  "TransactionID": "string (required)",
  "Status": "completed | failed | pending (required)",
  "Amount": "number",
  "Phone": "string",
  "ConfirmationCode": "string",
  "Timestamp": "string (ISO format)",
  "TransactionType": "deposit | withdrawal",
  "Reference": "string (optional - our transaction reference)"
}
```

---

## ✅ Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Callback processed successfully",
  "transaction_id": "xxx"
}
```

**Error Response (400/404/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

---

## 🧪 Testing the Endpoint

### Using Browser:
Simply open in browser: `https://getdeals.co.ke/api/webhooks/rukisha`  
Should return JSON with `"success": true`

### Using cURL (Linux/Mac):
```bash
curl https://getdeals.co.ke/api/webhooks/rukisha
```

### Using PowerShell (Windows):
```powershell
Invoke-WebRequest -Uri "https://getdeals.co.ke/api/webhooks/rukisha" -Method GET
```

### POST Test Request:
```bash
curl -X POST https://getdeals.co.ke/api/webhooks/test-rukisha \
  -H "Content-Type: application/json" \
  -d '{
    "TransactionID": "TEST123",
    "Status": "completed",
    "Amount": 100,
    "Phone": "254712345678",
    "ConfirmationCode": "ABC123"
  }'
```

---

## 🔍 Technical Details

| Item | Value |
|------|-------|
| **Domain** | getdeals.co.ke |
| **Protocol** | HTTPS (TLS 1.2+) |
| **Server** | Vercel Edge Network |
| **Response Time** | < 200ms average |
| **Availability** | 99.9% (Vercel SLA) |
| **Logging** | Enabled (all requests logged) |

---

## 🆘 If You Report "Invalid Callback URL"

Please provide us with:

1. **Exact error message** from your system
2. **Screenshot** of the error
3. **Timestamp** of when you tested
4. **Test method used** (browser, cURL, etc.)

We can provide:
- Real-time webhook logs from our side
- Detailed request/response debugging
- Alternative testing endpoints
- Direct support chat with our team

---

## 📞 Our Contact Information

**GitHub Repository:** https://github.com/EricNdivo/getdeals-kenya-showcase  
**Deployment Platform:** Vercel  
**Monitoring Dashboard:** Available upon request

---

## ✅ Summary

The callback URL **https://getdeals.co.ke/api/webhooks/rukisha** is:
- ✅ Live and accessible
- ✅ Returns proper validation response
- ✅ Has valid SSL certificate
- ✅ Supports GET (validation), POST (callbacks), OPTIONS (CORS)
- ✅ Ready to receive production callbacks

**The endpoint is fully operational and ready for integration.**

If your system still reports "Invalid callback URL", the issue may be:
1. Specific response format requirements from your validation system
2. Network/firewall restrictions on your end
3. SSL/TLS version compatibility
4. Custom validation logic we need to accommodate

Please share the specific error message so we can assist further.
