// M-Pesa Callback Handler for GetDeals Kenya
// This endpoint receives callbacks from Safaricom M-Pesa API

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('📞 M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const callbackData = req.body;
    const { stkCallback } = callbackData.Body;

    const paymentResult = {
      merchantRequestId: stkCallback.MerchantRequestID,
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc,
      timestamp: new Date().toISOString(),
    };

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      
      const amount = getCallbackValue(callbackMetadata, 'Amount');
      const mpesaReceiptNumber = getCallbackValue(callbackMetadata, 'MpesaReceiptNumber');
      const transactionDate = getCallbackValue(callbackMetadata, 'TransactionDate');
      const phoneNumber = getCallbackValue(callbackMetadata, 'PhoneNumber');

      console.log('✅ Payment successful:', {
        amount,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        checkoutRequestId: stkCallback.CheckoutRequestID
      });

      // TODO: Update your database with successful payment
      // Example:
      // await updateOrderPaymentStatus(stkCallback.CheckoutRequestID, 'completed', {
      //   amount,
      //   mpesaReceiptNumber,
      //   transactionDate,
      //   phoneNumber
      // });

      // TODO: Send confirmation email/SMS to customer
      // TODO: Update order status
      // TODO: Trigger any post-payment workflows

    } else {
      // Payment failed
      console.log('❌ Payment failed:', {
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        checkoutRequestId: stkCallback.CheckoutRequestID
      });

      // TODO: Update your database with failed payment
      // await updateOrderPaymentStatus(stkCallback.CheckoutRequestID, 'failed', {
      //   error: stkCallback.ResultDesc
      // });
    }

    // Always respond with success to M-Pesa
    res.status(200).json({ 
      success: true,
      message: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('🚨 Error processing M-Pesa callback:', error);
    
    // Still respond with success to M-Pesa to avoid retries
    res.status(200).json({ 
      success: true,
      message: 'Callback received but processing failed' 
    });
  }
}

function getCallbackValue(metadata: any[], name: string) {
  const item = metadata.find(item => item.Name === name);
  return item ? item.Value : null;
}