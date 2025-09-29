# M-Pesa Production Go-Live Checklist

## 📋 Pre-Production Requirements

### 1. Safaricom Developer Portal Setup
- [ ] **Production App Created**: Create a new app in Safaricom Developer Portal for production
- [ ] **Production Credentials**: Obtain production Consumer Key & Consumer Secret
- [ ] **Production Shortcode**: Get your production shortcode (different from sandbox 174379)
- [ ] **Production Passkey**: Obtain production passkey from Safaricom
- [ ] **URL Configuration**: Ensure callback URL is configured in environment variables (auto-sent in each request)

### 2. Infrastructure Requirements
- [ ] **SSL Certificate**: Ensure your domain has a valid SSL certificate (HTTPS required)
- [ ] **Public Domain**: Callback URL must be publicly accessible (no localhost/ngrok)
- [ ] **Server Security**: Implement firewall rules and security measures
- [ ] **Monitoring**: Set up application monitoring and logging
- [ ] **Backup Strategy**: Implement database and application backups

### 3. Environment Configuration
- [ ] **Production .env**: Update `.env` file with production credentials
- [ ] **Environment Variables**: Set `MPESA_ENVIRONMENT=production`
- [ ] **Callback URL**: Update to production HTTPS URL
- [ ] **CORS Origins**: Configure allowed origins for production
- [ ] **Node Environment**: Set `NODE_ENV=production`

### 4. Security Measures
- [ ] **Rate Limiting**: Implement proper rate limiting (consider Redis-based)
- [ ] **Input Validation**: Validate all incoming requests
- [ ] **Error Handling**: Implement comprehensive error handling
- [ ] **Logging**: Set up structured logging for audit trails
- [ ] **API Keys**: Secure all API keys and sensitive data

### 5. Testing Requirements
- [ ] **End-to-End Testing**: Test complete payment flow with small amounts
- [ ] **Error Scenarios**: Test failed payment scenarios
- [ ] **Callback Handling**: Verify callback processing works correctly
- [ ] **Load Testing**: Test with expected production load
- [ ] **Mobile Testing**: Test on various mobile devices

## 🚀 Production Deployment Steps

### Step 1: Update Environment Variables
```bash
# Copy your production template
cp .env.production .env

# Edit with actual production values
MPESA_CONSUMER_KEY=your_actual_production_key
MPESA_CONSUMER_SECRET=your_actual_production_secret
MPESA_PASSKEY=your_actual_production_passkey
MPESA_SHORTCODE=your_actual_production_shortcode
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
```

### Step 2: Update Frontend Configuration
Update your frontend to use production M-Pesa service URL instead of localhost:3001

### Step 3: Deploy to Production Server
```bash
# Install dependencies
npm ci --only=production

# Start with process manager (recommended)
pm2 start index.js --name mpesa-service

# Or start directly
npm start
```

### Step 4: Verify Production Setup
```bash
# Test health endpoint
curl https://yourdomain.com:3001/health

# Test small transaction (KES 1)
# Use your actual phone number for testing
```

## ⚠️ Important Production Notes

### Transaction Limits
- **Minimum**: KES 1
- **Maximum**: KES 70,000 per transaction
- **Daily Limits**: Check with Safaricom for your account limits

### Callback URL Requirements
- Must be HTTPS (SSL certificate required)
- Must be publicly accessible
- Must respond within 30 seconds
- Must return HTTP 200 status

### Error Handling
- Always return proper HTTP status codes
- Log all transactions for audit
- Implement retry logic for failed API calls
- Handle network timeouts gracefully

### Monitoring & Alerting
- Monitor API response times
- Alert on high error rates
- Track transaction success rates
- Monitor server resources

## 🆘 Troubleshooting

### Common Production Issues
1. **"Invalid CallBackURL"**: Ensure HTTPS and public accessibility
2. **"Merchant does not exist"**: Verify production shortcode
3. **SSL/TLS errors**: Check certificate validity
4. **Timeout errors**: Optimize callback response time

### Support Contacts
- **Safaricom Support**: support@safaricom.co.ke
- **Developer Portal**: https://developer.safaricom.co.ke/
- **Documentation**: https://developer.safaricom.co.ke/apis-explorer

---

## ✅ Final Go-Live Checklist
- [ ] All production credentials configured
- [ ] SSL certificate installed and valid
- [ ] Callback URL publicly accessible
- [ ] Small test transactions successful
- [ ] Error handling tested
- [ ] Monitoring and alerting active
- [ ] Team trained on production procedures
- [ ] Rollback plan prepared