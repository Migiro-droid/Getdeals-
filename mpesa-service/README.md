# M-Pesa Microservice

A standalone microservice for handling M-Pesa payments in the GetDeals Kenya application.

## Features

- ✅ STK Push payment initiation
- ✅ Payment status querying
- ✅ Callback processing
- ✅ Environment-based configuration
- ✅ Comprehensive error handling
- ✅ Security headers with Helmet
- ✅ Request logging with Morgan

## Quick Start

### 1. Install Dependencies
```bash
cd mpesa-service
npm install
```

### 2. Configure Environment
Copy `.env` and update with your M-Pesa credentials:
```bash
cp .env .env.local
```

Update the following variables:
- `MPESA_CONSUMER_KEY` - Your M-Pesa consumer key
- `MPESA_CONSUMER_SECRET` - Your M-Pesa consumer secret
- `MPESA_PASSKEY` - Your M-Pesa passkey
- `MPESA_SHORTCODE` - Your M-Pesa shortcode (default: 174379 for sandbox)
- `MPESA_CALLBACK_URL` - Callback URL for payment notifications

### 3. Start the Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will start on `http://localhost:3001`

## API Endpoints

### Health Check
```http
GET /health
```

### Initiate STK Push
```http
POST /api/payments/mpesa/initiate
Content-Type: application/json

{
  "phoneNumber": "254712345678",
  "amount": 100,
  "orderId": "ORDER123",
  "description": "Payment for order"
}
```

### Query Payment Status
```http
GET /api/payments/mpesa/status/:checkoutRequestId
```

### M-Pesa Callback
```http
POST /api/payments/mpesa/callback
```

## Integration with Main Application

Update your main application to call the microservice instead of using local M-Pesa logic:

```javascript
// Instead of:
// const mpesaService = new MpesaService();
// const result = await mpesaService.initiateSTKPush(phone, amount, orderId);

// Use:
const response = await fetch('http://localhost:3001/api/payments/mpesa/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: phone,
    amount: amount,
    orderId: orderId,
    description: 'Payment for order'
  })
});
const result = await response.json();
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MPESA_CONSUMER_KEY` | M-Pesa consumer key | - |
| `MPESA_CONSUMER_SECRET` | M-Pesa consumer secret | - |
| `MPESA_PASSKEY` | M-Pesa passkey | - |
| `MPESA_SHORTCODE` | M-Pesa shortcode | `174379` |
| `MPESA_ENVIRONMENT` | Environment (`sandbox` or `production`) | `sandbox` |
| `MPESA_CALLBACK_URL` | Callback URL for payments | - |
| `PORT` | Server port | `3001` |

## Development

### Project Structure
```
mpesa-service/
├── index.js          # Main Express server
├── lib/
│   └── mpesa.js      # M-Pesa service logic
├── package.json      # Dependencies
├── .env              # Environment configuration
└── README.md         # This file
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (not implemented)

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup
For production deployment, ensure all environment variables are properly set and the callback URL is accessible from M-Pesa servers.

## Security Considerations

- Store M-Pesa credentials securely (use environment variables)
- Validate all incoming requests
- Implement rate limiting for API endpoints
- Use HTTPS in production
- Monitor callback endpoints for suspicious activity

## License

ISC
