import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import MpesaService from './lib/mpesa.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


// Enhanced security for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'https://getdeals.co.ke']
    : ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const mpesaService = new MpesaService();

// Simple rate limiting (in production, use Redis-based solution)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

const rateLimit = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, []);
  }

  const requests = rateLimitMap.get(clientIP);
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }

  validRequests.push(now);
  rateLimitMap.set(clientIP, validRequests);
  next();
};

const validateSTKPushRequest = (req, res, next) => {
  const { phoneNumber, amount, orderReference } = req.body;

  if (!phoneNumber || !amount || !orderReference) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: phoneNumber, amount, orderReference'
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be a positive number'
    });
  }

  if (amount > 70000) { // M-Pesa transaction limit
    return res.status(400).json({
      success: false,
      error: 'Amount exceeds M-Pesa transaction limit (KES 70,000)'
    });
  }

  const phoneRegex = /^(?:\+?254|0)?[17]\d{8}$/;
  if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format'
    });
  }

  next();
};

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'M-Pesa Microservice',
    timestamp: new Date().toISOString()
  });
});

// Original endpoint for microservice compatibility
app.post('/api/payments/mpesa/initiate', rateLimit, validateSTKPushRequest, async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, description } = req.body;

    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, amount, orderId'
      });
    }

    const result = await mpesaService.initiateSTKPush(phoneNumber, amount, orderId, description);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error initiating STK push:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Additional endpoint to match frontend expectations
app.post('/api/payments/mpesa/stk-push', rateLimit, validateSTKPushRequest, async (req, res) => {
  try {
    const { phoneNumber, amount, orderReference, description } = req.body;

    if (!phoneNumber || !amount || !orderReference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, amount, orderReference'
      });
    }

    const result = await mpesaService.initiateSTKPush(phoneNumber, amount, orderReference, description);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error initiating STK push:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


app.get('/api/payments/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Missing checkoutRequestId parameter'
      });
    }

    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error querying STK push status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Additional endpoint to match frontend expectations
app.get('/api/payments/mpesa/query/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Missing checkoutRequestId parameter'
      });
    }

    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error querying STK push status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


app.post('/api/payments/mpesa/callback', (req, res) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    const result = mpesaService.processCallback(callbackData);


    res.json({ success: true });


    console.log('Processed callback result:', result);

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);

    res.json({ success: true });
  }
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});


app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 M-Pesa Microservice running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 STK Push: POST http://localhost:${PORT}/api/payments/mpesa/initiate`);
  console.log(`🔍 Status Query: GET http://localhost:${PORT}/api/payments/mpesa/status/:checkoutRequestId`);
  console.log(`📞 Callback: POST http://localhost:${PORT}/api/payments/mpesa/callback`);
});
