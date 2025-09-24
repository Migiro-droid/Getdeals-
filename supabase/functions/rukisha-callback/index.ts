import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RukishaCallbackPayload {
  transaction_id: string;
  customer_id: string;
  amount: number;
  phone: string;
  status: 'success' | 'failed' | 'cancelled';
  reference?: string;
  timestamp?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for callback operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body - this comes from Rukisha
    const payload: RukishaCallbackPayload = await req.json()
    
    console.log('Received Rukisha callback:', { 
      transaction_id: payload.transaction_id,
      status: payload.status,
      amount: payload.amount,
      customer_id: payload.customer_id
    })

    // Validate required fields
    if (!payload.transaction_id || !payload.customer_id || !payload.amount || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields in callback' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Find the user by customer_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('customer_id', payload.customer_id)
      .single()

    if (profileError || !profile) {
      console.error('User not found for customer_id:', payload.customer_id, profileError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = profile.user_id

    // Find the pending transaction
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('wallet_transactions')
      .select('*')
      .eq('transaction_id', payload.transaction_id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction not found:', payload.transaction_id, transactionError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update transaction status
    const newStatus = payload.status === 'success' ? 'completed' : 
                     payload.status === 'failed' ? 'failed' : 'cancelled'
    
    const { error: updateError } = await supabaseClient
      .from('wallet_transactions')
      .update({
        status: newStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If payment was successful, update wallet balance
    if (payload.status === 'success') {
      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (walletError) {
        console.error('Error fetching wallet:', walletError)
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Update wallet balance
      const currentBalance = Number(wallet.balance) || 0
      const newBalance = currentBalance + Number(payload.amount)

      const { error: balanceUpdateError } = await supabaseClient
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceUpdateError) {
        console.error('Error updating wallet balance:', balanceUpdateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update wallet balance' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.log(`✅ Deposit successful: KES ${payload.amount} added to user ${userId}`)
      console.log(`💰 Wallet balance updated: ${currentBalance} → ${newBalance}`)
      
      // Check if this is a checkout payment transaction
      if (transaction.type === 'payment' && transaction.description?.includes('checkout')) {
        console.log(`🛒 Processing checkout payment notification for transaction: ${transaction.id}`)
        
        try {
          // Extract order ID from transaction description or metadata
          const orderIdMatch = transaction.description.match(/order[:\s]+([A-Za-z0-9\-_]+)/i)
          const orderId = orderIdMatch ? orderIdMatch[1] : null
          
          if (orderId) {
            // Fetch order details
            const { data: order, error: orderError } = await supabaseClient
              .from('orders')
              .select(`
                *,
                user:users(*),
                items:order_items(*, product:products(*))
              `)
              .eq('id', orderId)
              .single()

            if (order && !orderError) {
              // Update order status
              await supabaseClient
                .from('orders')
                .update({
                  status: 'CONFIRMED',
                  payment_status: 'paid',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderId)

              // Send payment confirmation notifications
              await sendWalletPaymentNotifications(order, {
                paymentMethod: 'Wallet',
                transactionId: payload.transaction_id,
                paymentDate: new Date().toISOString()
              })
              
              console.log(`✅ Checkout payment notifications sent for order ${orderId}`)
            } else {
              console.warn(`⚠️ Order not found for ID: ${orderId}`)
            }
          } else {
            console.warn(`⚠️ Could not extract order ID from transaction description: ${transaction.description}`)
          }
        } catch (notificationError) {
          console.error('❌ Failed to send checkout payment notifications:', notificationError)
        }
      } else if (transaction.type === 'deposit') {
        // Send deposit confirmation SMS
        try {
          await sendDepositConfirmationSMS(payload.phone, {
            amount: payload.amount,
            transactionId: payload.transaction_id,
            newBalance: newBalance
          })
          console.log(`✅ Deposit confirmation SMS sent to ${payload.phone}`)
        } catch (smsError) {
          console.error('❌ Failed to send deposit confirmation SMS:', smsError)
        }
      }
    } else {
      console.log(`❌ Deposit ${payload.status}: ${payload.transaction_id} for user ${userId}`)
      
      // Send failure notification for checkout payments
      if (transaction.type === 'payment' && transaction.description?.includes('checkout')) {
        try {
          await sendPaymentFailureNotification(payload.phone, {
            amount: payload.amount,
            transactionId: payload.transaction_id,
            reason: payload.status
          })
          console.log(`📱 Payment failure notification sent to ${payload.phone}`)
        } catch (notificationError) {
          console.error('❌ Failed to send payment failure notification:', notificationError)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Callback processed successfully',
        transaction_id: payload.transaction_id,
        status: newStatus
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in rukisha-callback function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper functions for notifications
async function sendWalletPaymentNotifications(order: any, paymentDetails: any) {
  const customerPhone = order.mpesa_phone || order.phone
  const customerEmail = order.user?.email
  const orderNumber = order.orderNumber || order.id

  // Send SMS confirmation
  if (customerPhone) {
    const itemsList = order.items?.slice(0, 2).map((item: any) => 
      `${item.product?.name || item.name} (x${item.quantity})`
    ).join(', ') || ''
    
    const moreItems = order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''
    
    const message = `Payment CONFIRMED! 🎉
Order #${orderNumber}
Amount: KES ${((order.total || 0) / 100).toLocaleString()}
Items: ${itemsList}${moreItems}
Payment: WALLET${paymentDetails.transactionId ? `\nRef: ${paymentDetails.transactionId}` : ''}

E-receipt sent to your email. Thank you for choosing GetDeals!`

    console.log(`📱 Wallet payment SMS to ${customerPhone}:`, message)
  }

  // Log e-receipt (in production, you'd actually send the email)
  if (customerEmail) {
    console.log(`📧 E-receipt would be sent to ${customerEmail} for order ${orderNumber}`)
  }
}

async function sendDepositConfirmationSMS(phoneNumber: string, depositData: any) {
  const { amount, transactionId, newBalance } = depositData
  
  const message = `Wallet TOP-UP successful! 💰
Amount: KES ${amount.toLocaleString()}
New Balance: KES ${newBalance.toLocaleString()}
Ref: ${transactionId}

Ready to shop with instant payments and 5% cashback! - GetDeals`

  console.log(`📱 Deposit confirmation SMS to ${phoneNumber}:`, message)
}

async function sendPaymentFailureNotification(phoneNumber: string, failureData: any) {
  const { amount, transactionId, reason } = failureData
  
  const message = `Payment failed for KES ${amount.toLocaleString()}
Ref: ${transactionId}
Reason: ${reason}

Please try again or contact support. No charges applied. - GetDeals`

  console.log(`📱 Payment failure SMS to ${phoneNumber}:`, message)
}