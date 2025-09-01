import express from 'express';
import MpesaService from '../lib/mpesa.js';

const router = express.Router();
const mpesaService = new MpesaService();

// This route is now mounted at /api/payments/mpesa
// The full path will be /api/payments/mpesa/initiate
router.post('/initiate', async (req, res) => {
  const { phoneNumber, amount, orderId } = req.body;

  if (!phoneNumber || !amount || !orderId) {
    return res.status(400).json({ message: 'Missing required fields: phoneNumber, amount, orderId' });
  }

  try {
    const response = await mpesaService.initiateSTKPush(String(phoneNumber), String(amount), String(orderId));
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /initiate route:', error);
    res.status(500).json({ message: 'Failed to initiate M-Pesa payment', error: error.message });
  }
});

// The full path will be /api/payments/mpesa/callback
router.post('/callback', (req, res) => {
  const callbackData = req.body;

  console.log(`--- M-Pesa Callback Received ---`);
  
  try {
    const result = mpesaService.processCallback(callbackData);
    console.log('Processed Callback Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`✅ Payment successful for CheckoutRequestID: ${result.checkoutRequestId}`);
      // TODO: Find order in DB using checkoutRequestId and update status to 'paid'.
    } else {
      console.error(`❌ Payment failed for CheckoutRequestID: ${result.checkoutRequestId}. Reason: ${result.error}`);
      // TODO: Find order in DB using checkoutRequestId and update status to 'failed'.
    }
  } catch (error) {
      console.error('Fatal error processing M-Pesa callback in route:', error);
  }

  // Respond to Safaricom's API call to acknowledge receipt
  res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted"
  });
});

export default router;
