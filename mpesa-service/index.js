import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import MpesaService from './lib/mpesa.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mpesaService = new MpesaService();

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'M-Pesa Microservice',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/payments/mpesa/initiate', async (req, res) => {
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
app.use('*',req, res) => {
    res.status(500).json({
        success: false,
        error: 'Internal Sever err                   '
}

app.listen(PORT, () => {
  console.log(`🚀 M-Pesa Microservice running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 STK Push: POST http://localhost:${PORT}/api/payments/mpesa/initiate`);
  console.log(`🔍 Status Query: GET http://localhost:${PORT}/api/payments/mpesa/status/:checkoutRequestId`);
  console.log(`📞 Callback: POST http://localhost:${PORT}/api/payments/mpesa/callback`);
});
