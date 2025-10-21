# Receipt System - Technical Implementation Details

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         GETDEALS RECEIPT SYSTEM                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND (React)                    BACKEND (Node.js)          │
│  ──────────────────                  ──────────────────          │
│                                                                  │
│  CheckoutPage.tsx          →→→→→     api/orders/create.ts       │
│  ├─ Collect payment info             ├─ Validate order          │
│  ├─ Process payment                  ├─ Create order record     │
│  ├─ Send confirmation                ├─ Call email service      │
│  └─ Redirect to account              └─ Return order details    │
│                                                                  │
│              ↓                                ↓                  │
│  AccountPage.tsx                  Brevo Email Service           │
│  ├─ Display orders                ├─ Send payment email        │
│  ├─ Show receipt modal             ├─ Send order email         │
│  └─ View order details             └─ Handle retries           │
│                                                                  │
│              ↓                                ↓                  │
│  OrderDetailsModal                 Email Templates              │
│  ├─ Itemized list                  ├─ Payment confirmation HTML │
│  ├─ Totals breakdown               ├─ Order confirmation HTML  │
│  └─ Delivery info                  └─ Other email types        │
│                                                                  │
│  DATABASE (Supabase/PostgreSQL)                                │
│  ──────────────────────────────────                            │
│  ├─ orders table                                               │
│  │  ├─ id                                                      │
│  │  ├─ date                                                    │
│  │  ├─ items (JSON)                                           │
│  │  ├─ customer (JSON)                                        │
│  │  ├─ total                                                  │
│  │  ├─ paymentMethod                                          │
│  │  └─ status                                                 │
│  │                                                             │
│  └─ All receipt data persisted                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. PAYMENT FLOW ARCHITECTURE

### Wallet Payment Receipt Flow

```
User selects Wallet Payment
    ↓
CheckoutPage.tsx:670
├─ GET balance from WalletContext
├─ Verify: balance ≥ finalTotal
└─ If insufficient:
   └─ Show error toast
   └─ Block submission

WalletPaymentService.initiatePayment()
├─ Call Rukisha merchant API
├─ Deduct from wallet
└─ Return transaction_id

WalletResult received
├─ walletResult.success = true
├─ walletResult.transaction_id = "TXN-123"
└─ Continue to email sending

✉️ PAYMENT CONFIRMATION EMAIL
├─ fetch('/api/email/send', {
├─   type: 'payment-confirmation',
├─   recipientEmail: email,
├─   data: {
├─     customerName,
├─     transactionId: walletResult.transaction_id,
├─     amount: finalTotal,
├─     paymentMethod: 'GetDeals Wallet',
├─     orderNumber: orderResult.order.order_reference,
├─     paidAt: new Date().toISOString()
├─   }
├─ })
└─ Brevo sends HTML email

createOrder()
├─ Create order with:
├─   paymentMethod: 'wallet',
├─   paymentConfirmed: true,
├─   paymentReference: orderReference
└─ Return { success: true, order }

✉️ ORDER CONFIRMATION EMAIL
├─ fetch('/api/email/send', {
├─   type: 'order-confirmation',
├─   recipientEmail: email,
├─   data: {
├─     customerName,
├─     orderNumber,
├─     total: finalTotal,
├─     items: items.map(...),
├─     deliveryAddress,
├─     paymentMethod: 'GetDeals Wallet',
├─     createdAt: new Date().toISOString()
├─   }
├─ })
└─ Brevo sends HTML email

Navigate to account page
└─ /account?tab=orders&orderId=[order.id]
```

**Code Location:** `src/pages/CheckoutPage.tsx:620-750`

---

### M-Pesa Payment Receipt Flow

```
User selects M-Pesa Payment
    ↓
initiateSTKPush(amount, phone, orderReference)
├─ Call M-Pesa API
├─ Send prompt to user's phone
├─ Receive CheckoutRequestID
└─ Return { CheckoutRequestID, MerchantRequestID }

STK Push on user's phone
├─ User sees prompt: "Enter M-Pesa PIN"
├─ User enters PIN
└─ M-Pesa processes payment

System polls for status (every 6 seconds, max 30 times)
├─ checkPaymentStatus(CheckoutRequestID)
├─ Query M-Pesa API
└─ Loop until:
   ├─ paymentConfirmed = true (success)
   ├─ OR timeout (failure)
   └─ OR explicit cancellation

Payment Confirmed
├─ statusResult.success = true
├─ statusResult.paymentConfirmed = true
├─ statusResult.mpesaReceiptNumber = "ABC123XYZ"
└─ Continue to order creation

✉️ PAYMENT CONFIRMATION EMAIL
├─ fetch('/api/email/send', {
├─   type: 'payment-confirmation',
├─   recipientEmail: email,
├─   data: {
├─     customerName,
├─     transactionId: stkResult.CheckoutRequestID,
├─     amount: finalTotal,
├─     paymentMethod: 'M-Pesa',
├─     orderNumber: orderReference,
├─     paidAt: new Date().toISOString(),
├─     mpesaReceiptNumber  ← M-PESA REFERENCE
├─   }
├─ })
└─ Brevo sends HTML email

createOrder()
├─ Create order with:
├─   paymentMethod: 'mpesa',
├─   paymentConfirmed: true,
├─   paymentReference: orderReference,
├─   mpesaReceiptNumber: statusResult.mpesaReceiptNumber,
├─   checkoutRequestId: stkResult.CheckoutRequestID
└─ Return { success: true, order }

✉️ ORDER CONFIRMATION EMAIL
├─ fetch('/api/email/send', {
├─   type: 'order-confirmation',
├─   recipientEmail: email,
├─   data: {...}
├─ })
└─ Brevo sends HTML email

Navigate to account
└─ /account?tab=orders&orderId=[order.id]
```

**Code Location:** `src/pages/CheckoutPage.tsx:460-550`

---

## 2. EMAIL SERVICE ARCHITECTURE

### Email API Endpoint

```typescript
// api/email/send.ts

handler(req, res):
  ├─ Extract request body:
  │  ├─ type: EmailType
  │  ├─ recipientEmail: string
  │  └─ data: EmailData
  │
  ├─ Switch on type:
  │  ├─ 'payment-confirmation':
  │  │  └─ brevoService.sendPaymentConfirmation(email, data)
  │  │
  │  ├─ 'order-confirmation':
  │  │  └─ brevoService.sendOrderConfirmation(email, data)
  │  │
  │  └─ other types...
  │
  └─ Return result:
     ├─ { success: true, messageId: "..." }
     └─ OR { success: false, error: "..." }
```

---

### Brevo Service Flow

```typescript
// src/services/brevo-service-fetch.js

sendPaymentConfirmation(customerEmail, paymentData):
  │
  ├─ Check environment:
  │  ├─ If BREVO_PAYMENT_CONFIRMATION_TEMPLATE_ID exists:
  │  │  └─ Use Brevo template (faster, customizable)
  │  └─ Else:
  │     └─ Use fallback HTML template (built-in)
  │
  ├─ Build email payload:
  │  ├─ to: [{ email: customerEmail }]
  │  ├─ subject: "Payment Confirmed - [TXN] ✅"
  │  ├─ sender:
  │  │  ├─ name: "GetDeals Kenya" (from env)
  │  │  └─ email: "info@getdeals.co.ke" (from env)
  │  └─ templateId OR htmlContent
  │
  ├─ Call Brevo API:
  │  └─ POST https://api.brevo.com/v3/smtp/email
  │
  └─ Return:
     ├─ { success: true, messageId: "..." }
     └─ { success: false, error: "..." }

sendOrderConfirmation(customerEmail, orderData):
  │
  ├─ Similar flow to payment confirmation
  ├─ Uses order-specific template
  ├─ Includes itemized list
  └─ Returns email result
```

**Code Location:** `src/services/brevo-service-fetch.js:87-145`

---

### Email Template Fallback

```javascript
// src/services/email-templates.js

EmailTemplates.getPaymentConfirmationEmail(data):
  └─ Returns:
     ├─ subject: string
     ├─ htmlContent: string (HTML email)
     └─ textContent: string (plain text fallback)

// Template includes:
├─ Success message with ✅ icon
├─ Amount displayed prominently
├─ Transaction ID
├─ Order number
├─ Payment date/time
├─ Professional styling with CSS
├─ Company branding (colors, fonts)
└─ Footer with company info

EmailTemplates.getOrderConfirmationEmail(data):
  └─ Returns:
     ├─ subject: string
     ├─ htmlContent: string (HTML email)
     └─ textContent: string (plain text fallback)

// Template includes:
├─ Order confirmation message
├─ Itemized table:
│  ├─ Item name
│  ├─ Quantity
│  └─ Price per item
├─ Subtotal
├─ Delivery fee
├─ Total amount
├─ Order date
├─ Payment method
├─ Delivery address
├─ Processing timeline
├─ Next steps
└─ Support contact info
```

**Code Location:** `src/services/email-templates.js:60-250`

---

## 3. ORDER STORAGE ARCHITECTURE

### Database Schema (Orders Table)

```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,              -- ORD-1729527894-ABC
  user_id UUID,                            -- Link to user
  date TIMESTAMP,                          -- ISO format
  items JSONB,                             -- [{id, name, price, quantity}]
  customer JSONB,                          -- {firstName, lastName, phone, email, address}
  subtotal NUMERIC,                        -- Order subtotal
  delivery_fee NUMERIC,                    -- Delivery cost
  total NUMERIC,                           -- Total amount
  delivery_method VARCHAR(20),             -- 'pickup' or 'speedy'
  payment_method VARCHAR(20),              -- 'mpesa', 'wallet', 'cash', 'card'
  payment_confirmed BOOLEAN,               -- true/false
  payment_reference VARCHAR(100),          -- Order reference
  mpesa_receipt_number VARCHAR(50),        -- M-Pesa receipt
  checkout_request_id VARCHAR(100),        -- STK push ID
  merchant_request_id VARCHAR(100),        -- M-Pesa merchant ID
  status VARCHAR(20),                      -- pending, confirmed, shipped, delivered, cancelled
  created_at TIMESTAMP,                    -- Record creation
  updated_at TIMESTAMP                     -- Last update
);
```

---

### Receipt Data Persistence

```typescript
// Order object structure stored in database

interface Order {
  id: string;                    // "ORD-1729527894-ABC"
  date: string;                  // ISO timestamp
  items: OrderItem[];            // [{id, name, price, quantity}]
  subtotal: number;              // 8000
  deliveryFee: number;           // 200
  total: number;                 // 8200
  deliveryMethod: "pickup" | "speedy";
  paymentMethod: "mpesa" | "wallet" | "cash" | "card";
  customer: OrderCustomer;       // {firstName, lastName, phone, email}
  status: OrderStatus;           // "pending" | "confirmed" | ...
  note?: string;
  demoSeed?: boolean;
}

// All data needed for receipt is stored here
// Accessible via OrdersContext.getById(orderId)
```

**Code Location:** `src/contexts/OrdersContext.tsx:1-35`

---

## 4. RECEIPT DISPLAY ARCHITECTURE

### Dashboard Receipt Modal

```typescript
// src/pages/AccountPage.tsx:613-702

function OrderDetailsModal({ order, onClose }) {
  return (
    <Dialog open={!!order}>
      <DialogHeader>
        <DialogTitle>
          <span>Order {order.id}</span>
          <span>{new Date(order.date).toLocaleString()}</span>
        </DialogTitle>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT SIDE: Items */}
        <div>
          <h3>Items</h3>
          {order.items.map(item => (
            <div key={item.id}>
              <img src={item.image} />
              <span>{item.name}</span>
              <span>Qty {item.quantity}</span>
              <span>KES {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          
          {/* Totals */}
          <div>
            <div>Subtotal: KES {order.subtotal.toLocaleString()}</div>
            <div>Delivery Fee: KES {order.deliveryFee.toLocaleString()}</div>
            <Separator />
            <div>Total: KES {order.total.toLocaleString()}</div>
          </div>
        </div>

        {/* RIGHT SIDE: Status & Customer */}
        <div>
          <h3>Status</h3>
          <StatusBadges order={order} />
          
          <h3>Customer</h3>
          <p>{order.customer.firstName} {order.customer.lastName}</p>
          <p>{order.customer.phone}</p>
          <p>{order.customer.email}</p>
          
          <h3>Fulfillment</h3>
          <p>Delivery: {order.deliveryMethod}</p>
          <p>Address: {order.customer.address}</p>
          <p>Payment: {order.paymentMethod}</p>
          {order.note && <p>Note: {order.note}</p>}
        </div>
      </div>
    </Dialog>
  );
}
```

**Features:**
- Interactive modal display
- Tabbed receipt view
- Itemized products with images
- Status indicators
- All payment details visible
- Mobile-responsive layout

**Code Location:** `src/pages/AccountPage.tsx:613-702`

---

## 5. PAYMENT CONFIRMATION INTEGRATION

### Email Sending from Checkout

```typescript
// src/pages/CheckoutPage.tsx:671-720 (Wallet Payment)

try {
  const baseUrl = import.meta.env.VITE_MPESA_SERVICE_URL || window.location.origin;
  
  // Send payment confirmation email
  await fetch(`${baseUrl}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'payment-confirmation',           // Email type
      recipientEmail: email,                  // User's email
      data: {
        customerName: `${firstName} ${lastName}`.trim(),
        transactionId: walletResult.transaction_id,   // Payment ID
        amount: finalTotal,                            // Amount paid
        paymentMethod: 'GetDeals Wallet',             // Payment method
        orderNumber: orderResult.order.order_reference, // Order ID
        paidAt: new Date().toISOString()              // Payment time
      }
    })
  });

  // Send order confirmation email
  await fetch(`${baseUrl}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'order-confirmation',            // Email type
      recipientEmail: email,                 // User's email
      data: {
        customerName: `${firstName} ${lastName}`.trim(),
        orderNumber: orderResult.order.order_reference,
        total: finalTotal,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity
        })),
        deliveryAddress: deliveryMethod === "speedy" 
          ? address 
          : (selectedPickupLocationData?.name || 'Store Pickup'),
        paymentMethod: 'GetDeals Wallet',
        createdAt: new Date().toISOString()
      }
    })
  });
} catch (emailError) {
  console.error('Failed to send emails:', emailError);
  // Don't block checkout if email fails
}
```

---

## 6. ERROR HANDLING

### Email Failure Handling

```typescript
// Emails are sent asynchronously (don't block checkout)

try {
  await fetch(`${baseUrl}/api/email/send`, {...});
} catch (emailError) {
  // Log but don't fail the order
  console.error('Email error:', emailError);
  // Order still completes successfully
  // User still sees success message
}

// Benefits:
├─ Order not lost if email fails
├─ Retry mechanism in Brevo
├─ User can still access receipt on dashboard
└─ Support can manually send receipt if needed
```

---

### Payment Validation

```typescript
// CheckoutPage.tsx:405-430

if (paymentMethod === "wallet") {
  // Check balance first
  if (balance < finalTotal) {
    throw new Error(
      `Insufficient wallet balance. You have KES ${balance.toLocaleString()} 
       but need KES ${finalTotal.toLocaleString()}`
    );
  }
}

if (paymentMethod === "mobile-money" && !mpesaPhone) {
  throw new Error('Phone number required for M-Pesa payment');
}

// M-Pesa STK push validation
if (!stkResult.success) {
  setPaymentStatus("failed");
  toast({
    title: "Payment Initiation Failed",
    description: stkResult.error,
    variant: "destructive"
  });
  return;
}
```

---

## 7. DEPLOYMENT CONSIDERATIONS

### Environment Variables Required

```bash
# Brevo Email Service
BREVO_API_KEY=xxx_your_brevo_api_key_xxx
BREVO_SENDER_NAME=GetDeals Kenya
BREVO_SENDER_EMAIL=info@getdeals.co.ke

# Optional: Custom templates
BREVO_PAYMENT_CONFIRMATION_TEMPLATE_ID=123
BREVO_ORDER_CONFIRMATION_TEMPLATE_ID=456

# Wallet Service
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=xxx

# M-Pesa Service
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_BUSINESS_SHORT_CODE=xxx
MPESA_PASSKEY=xxx

# Frontend
VITE_MPESA_SERVICE_URL=https://your-api.com
```

---

### Testing Receipt System

```javascript
// test-email-service.js (provided in repo)

// Test payment confirmation email
const paymentResult = await fetch('/api/email/send', {
  method: 'POST',
  body: JSON.stringify({
    type: 'payment-confirmation',
    recipientEmail: 'test@example.com',
    data: {
      customerName: 'John Doe',
      transactionId: 'TXN-TEST-123',
      amount: 5000,
      paymentMethod: 'Wallet'
    }
  })
});

// Test order confirmation email
const orderResult = await fetch('/api/email/send', {
  method: 'POST',
  body: JSON.stringify({
    type: 'order-confirmation',
    recipientEmail: 'test@example.com',
    data: {
      customerName: 'John Doe',
      orderNumber: 'ORD-TEST-456',
      items: [{name: 'Test Item', quantity: 1, price: 5000}],
      total: 5000,
      deliveryAddress: '123 Test St'
    }
  })
});
```

**Location:** `/test-email-service.js`

---

## Summary

| Component | Location | Responsibility |
|-----------|----------|-----------------|
| Checkout Logic | `src/pages/CheckoutPage.tsx` | Process payment, trigger emails |
| Email API | `api/email/send.ts` | Route email requests |
| Email Service | `src/services/brevo-service-fetch.js` | Send emails via Brevo |
| Templates | `src/services/email-templates.js` | Fallback email HTML |
| Order Storage | `src/contexts/OrdersContext.tsx` | Store/retrieve orders |
| Receipt Display | `src/pages/AccountPage.tsx` | Show order modal |
| Payment Service | `src/services/WalletPaymentService.ts` | Process wallet payment |
| M-Pesa Integration | `api/payments/mpesa/` | M-Pesa payment handling |

---

**Last Updated:** October 21, 2025  
**Status:** ✅ All Systems Operational  
**Documentation Version:** 1.0
