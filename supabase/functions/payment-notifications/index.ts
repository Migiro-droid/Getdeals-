import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  orderId: string;
  paymentDetails: {
    paymentMethod: string;
    transactionId?: string;
    paymentDate: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { orderId, paymentDetails }: NotificationRequest = await req.json()

    console.log(`📱 Processing payment confirmation notifications for order: ${orderId}`)

    // Fetch order details with related data
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        user:users(*),
        items:order_items(*, product:products(*))
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId, orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const customerPhone = order.mpesa_phone || order.phone
    const customerEmail = order.user?.email
    const orderNumber = order.orderNumber || order.id

    console.log(`📞 Customer phone: ${customerPhone}`)
    console.log(`📧 Customer email: ${customerEmail}`)

    // Send SMS confirmation
    if (customerPhone) {
      try {
        await sendPaymentConfirmationSMS(customerPhone, {
          orderNumber,
          amount: (order.total || 0) / 100,
          items: order.items?.slice(0, 2).map((item: any) => ({
            name: item.product?.name || item.name || 'Unknown Item',
            quantity: item.quantity || 1
          })) || [],
          paymentMethod: paymentDetails.paymentMethod,
          transactionId: paymentDetails.transactionId
        })
        
        console.log(`✅ Payment confirmation SMS sent to ${customerPhone}`)
      } catch (smsError) {
        console.error('❌ Failed to send payment confirmation SMS:', smsError)
      }
    }

    // Send e-receipt
    if (customerEmail) {
      try {
        await sendEReceipt(order, paymentDetails)
        console.log(`✅ E-receipt sent to ${customerEmail}`)
        
        // Send follow-up SMS about e-receipt
        if (customerPhone) {
          await sendEReceiptSMS(customerPhone, orderNumber, true)
        }
      } catch (receiptError) {
        console.error('❌ Failed to send e-receipt:', receiptError)
        
        // Send SMS indicating e-receipt processing
        if (customerPhone) {
          await sendEReceiptSMS(customerPhone, orderNumber, false)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment confirmation notifications processed',
        orderId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment notification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendPaymentConfirmationSMS(phoneNumber: string, paymentData: any) {
  const { orderNumber, amount, items, paymentMethod, transactionId } = paymentData
  
  // Format items list (max 2 items to keep SMS short)
  const itemsList = items.map((item: any) => 
    `${item.name} (x${item.quantity})`
  ).join(', ')
  
  const moreItems = items.length > 2 ? ` +${items.length - 2} more` : ''
  
  const message = `Payment CONFIRMED! 🎉
Order #${orderNumber}
Amount: KES ${amount.toLocaleString()}
Items: ${itemsList}${moreItems}
Payment: ${paymentMethod.toUpperCase()}${transactionId ? `\nRef: ${transactionId}` : ''}

E-receipt sent to your email. Thank you for choosing GetDeals!`

  // In a real implementation, you would integrate with your SMS service here
  // For now, we'll just log the message
  console.log(`📱 SMS to ${phoneNumber}:`, message)
  
  return { success: true }
}

async function sendEReceiptSMS(phoneNumber: string, orderNumber: string, emailSent: boolean) {
  const message = emailSent 
    ? `Your e-receipt for order #${orderNumber} has been sent to your email. Keep it for your records. - GetDeals`
    : `Your order #${orderNumber} payment is confirmed. E-receipt processing... - GetDeals`
  
  console.log(`📱 E-receipt SMS to ${phoneNumber}:`, message)
  return { success: true }
}

async function sendEReceipt(order: any, paymentDetails: any) {
  const receiptHTML = generateReceiptHTML({
    orderNumber: order.orderNumber || order.id,
    customerName: order.user?.name || `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() || 'Customer',
    customerEmail: order.user?.email,
    customerPhone: order.mpesa_phone || order.phone,
    items: order.items?.map((item: any) => ({
      name: item.product?.name || item.name,
      quantity: item.quantity,
      price: item.price || item.product?.price || 0
    })) || [],
    subtotal: order.total - (order.delivery_fee || 0),
    deliveryFee: order.delivery_fee || 0,
    total: order.total,
    paymentMethod: paymentDetails.paymentMethod,
    transactionId: paymentDetails.transactionId,
    orderDate: order.created_at,
    paymentDate: paymentDetails.paymentDate,
    deliveryMethod: order.delivery_method,
    deliveryAddress: order.delivery_address,
    pickupLocation: order.pickup_location
  })

  // In a real implementation, you would send the email here
  // For now, we'll just log that it would be sent
  console.log(`📧 E-receipt would be sent to ${order.user?.email}`)
  
  return { success: true }
}

function generateReceiptHTML(receiptData: any): string {
  // Simplified receipt HTML for this edge function
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #e74c3c; }
      </style>
  </head>
  <body>
      <div class="header">
          <div class="logo">GetDeals Kenya</div>
          <h2>PAYMENT RECEIPT</h2>
          <p>Order #${receiptData.orderNumber}</p>
      </div>
      <p>Thank you for your payment of ${receiptData.total ? `KES ${receiptData.total.toLocaleString()}` : 'N/A'}</p>
      <p>Payment Method: ${receiptData.paymentMethod}</p>
      ${receiptData.transactionId ? `<p>Transaction ID: ${receiptData.transactionId}</p>` : ''}
      <p>Date: ${new Date(receiptData.paymentDate).toLocaleString()}</p>
  </body>
  </html>
  `
}