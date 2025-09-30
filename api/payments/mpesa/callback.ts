import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log(' M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const callbackData: MpesaCallbackData = req.body;
    
    // Basic validation - ensure callback structure is correct
    if (!callbackData?.Body?.stkCallback) {
      console.error('Invalid callback structure');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid callback structure' 
      });
    }

    const { stkCallback } = callbackData.Body;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log('📋 Processing callback:', {
      checkoutRequestId,
      merchantRequestId,
      resultCode,
      resultDesc
    });

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      
      const amount = getCallbackValue(callbackMetadata, 'Amount');
      const mpesaReceiptNumber = getCallbackValue(callbackMetadata, 'MpesaReceiptNumber');
      const transactionDate = getCallbackValue(callbackMetadata, 'TransactionDate');
      const phoneNumber = getCallbackValue(callbackMetadata, 'PhoneNumber');

      console.log('💰 Payment successful:', {
        amount,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        checkoutRequestId
      });

      // Update payment record in Supabase with comprehensive data
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          mpesa_receipt_number: mpesaReceiptNumber,
          transaction_date: transactionDate,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Ensure amount is stored if not already
          ...(amount && { amount: Math.round(amount * 100) }), // Store in cents
          // Ensure phone number is stored if not already
          ...(phoneNumber && { phone_number: phoneNumber })
        })
        .eq('transaction_id', checkoutRequestId);

      if (updatePaymentError) {
        console.error('❌ Error updating payment record:', updatePaymentError);
      } else {
        console.log('✅ Payment record updated successfully');
      }

      // TODO: Add comprehensive transaction logging once schema is fixed

      // Get the payment record to find the associated order
      const { data: payment, error: getPaymentError } = await supabase
        .from('payments')
        .select('order_id, amount')
        .eq('transaction_id', checkoutRequestId)
        .single();

      if (getPaymentError) {
        console.error('Error fetching payment record:', getPaymentError);
      } else if (payment?.order_id) {
        // Update order status to confirmed
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({
            status: 'CONFIRMED',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.order_id);

        if (updateOrderError) {
          console.error('Error updating order status:', updateOrderError);
        } else {
          console.log('✅ Order status updated to CONFIRMED');
          
          // Send email notifications for successful payment
          try {
            // Get order and customer details for email
            const { data: orderDetails } = await supabase
              .from('orders')
              .select(`
                *,
                customer_email,
                customer_name,
                items,
                delivery_address
              `)
              .eq('id', payment.order_id)
              .single();

            if (orderDetails && orderDetails.customer_email) {
              const baseUrl = process.env.FRONTEND_URL || 'https://getdeals.co.ke';
              
              // Send payment confirmation email
              await fetch(`${baseUrl}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'payment-confirmation',
                  recipientEmail: orderDetails.customer_email,
                  data: {
                    customerName: orderDetails.customer_name || 'Valued Customer',
                    transactionId: mpesaReceiptNumber,
                    amount: (amount / 100) || (orderDetails.total_amount / 100), // Convert from cents
                    paymentMethod: 'M-Pesa',
                    orderNumber: orderDetails.order_reference || `ORD-${orderDetails.id}`,
                    paidAt: new Date().toISOString()
                  }
                })
              });

              // Send order confirmation email
              await fetch(`${baseUrl}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'order-confirmation',
                  recipientEmail: orderDetails.customer_email,
                  data: {
                    customerName: orderDetails.customer_name || 'Valued Customer',
                    orderNumber: orderDetails.order_reference || `ORD-${orderDetails.id}`,
                    total: (orderDetails.total_amount / 100) || 0, // Convert from cents
                    items: orderDetails.items || [],
                    deliveryAddress: orderDetails.delivery_address || 'Address not provided',
                    paymentMethod: 'M-Pesa',
                    createdAt: orderDetails.created_at
                  }
                })
              });

              console.log('📧 Email notifications sent for successful payment');
            }
          } catch (emailError) {
            console.error('❌ Failed to send email notifications:', emailError);
            // Don't fail the callback because of email issues
          }
        }

        // TODO: Update inventory if needed
        // TODO: Trigger any post-payment workflows
      }

    } else {
      // Payment failed
      console.log('Payment failed:', {
        resultCode,
        resultDesc,
        checkoutRequestId
      });

      // Update payment record as failed
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_reason: resultDesc,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', checkoutRequestId);

      if (updatePaymentError) {
        console.error(' Error updating failed payment record:', updatePaymentError);
      }

      // Get the payment record to find the associated order
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('transaction_id', checkoutRequestId)
        .single();

      if (payment?.order_id) {
        // Update order status to payment failed
        await supabase
          .from('orders')
          .update({
            status: 'PAYMENT_FAILED',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.order_id);

        console.log(' Order status updated to PAYMENT_FAILED');
      }
    }

    // Always respond with success to M-Pesa to prevent retries
    res.status(200).json({ 
      success: true,
      message: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error(' Error processing M-Pesa callback:', error);
    
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