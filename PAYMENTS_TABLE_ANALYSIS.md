# Payments Table - Complete Analysis & Documentation

## 📊 Table Overview
The `payments` table is a **critical component** of the GetDeals Kenya e-commerce platform, managing all payment transactions, primarily M-Pesa payments through the Safaricom STK Push API.

---

## 🏗️ Database Schema

### Core Structure
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  phone_number TEXT,
  reference TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhanced Columns (Added via Migration 20250930 and 20251007)
```sql
ALTER TABLE public.payments ADD COLUMN mpesa_receipt_number TEXT;
ALTER TABLE public.payments ADD COLUMN transaction_date BIGINT;
ALTER TABLE public.payments ADD COLUMN merchant_request_id TEXT;
ALTER TABLE public.payments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.payments ADD COLUMN sender_name TEXT; -- Added Oct 7, 2025
```

---

## 📋 Column Details

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key, auto-generated |
| `order_id` | UUID | NO | Foreign key to `orders.id`, cascades on delete |
| `amount` | NUMERIC | NO | Payment amount in **cents** (multiply by 100 from KES) |
| `method` | TEXT | NO | Payment method (e.g., 'mpesa', 'card', 'cash') |
| `status` | TEXT | YES | Payment status: 'pending', 'success', 'failed' |
| `transaction_id` | TEXT | YES | M-Pesa CheckoutRequestID (unique identifier) |
| `phone_number` | TEXT | YES | Customer's M-Pesa phone number (254XXXXXXXXX format) |
| `sender_name` | TEXT | YES | M-Pesa sender's full name (FirstName + MiddleName + LastName) |
| `reference` | TEXT | YES | Order reference or custom reference |
| `failure_reason` | TEXT | YES | Error message if payment fails |
| `mpesa_receipt_number` | TEXT | YES | M-Pesa receipt number (e.g., QGR123ABC) |
| `transaction_date` | BIGINT | YES | M-Pesa transaction timestamp |
| `merchant_request_id` | TEXT | YES | M-Pesa MerchantRequestID |
| `processed_at` | TIMESTAMPTZ | YES | When payment was processed by callback |
| `created_at` | TIMESTAMPTZ | NO | When payment record was created |
| `updated_at` | TIMESTAMPTZ | YES | Auto-updated timestamp |

---

## 🔑 Indexes for Performance

```sql
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_mpesa_receipt ON payments(mpesa_receipt_number);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_phone_number ON payments(phone_number);
CREATE INDEX idx_payments_sender_name ON payments(sender_name); -- For searching by sender
```

**Purpose**: Fast lookups for:
- Transaction status checks
- M-Pesa receipt verification
- Order-payment linking
- Payment status filtering
- Phone number searches
- Sender name searches (for support/audit)

---

## 🔄 Payment Lifecycle

### 1. **Payment Initiation** (`api/payments/mpesa/stk-push.ts`)
```typescript
// When STK Push is triggered
{
  order_id: 'ORD-1234567890-ABCD',
  amount: 120000, // KES 1,200 * 100
  method: 'mpesa',
  status: 'pending',
  phone_number: '254712345678',
  reference: 'ORD-1234567890-ABCD',
  transaction_id: 'ws_CO_01012025123456789',
  merchant_request_id: '12345-67890-12345',
  created_at: '2025-01-07T10:30:00Z',
  updated_at: '2025-01-07T10:30:00Z'
}
```

**Flow**:
1. User submits checkout with M-Pesa
2. STK Push API sends prompt to user's phone
3. Payment record created with `status: 'pending'`
4. `transaction_id` and `merchant_request_id` stored
5. User receives M-Pesa prompt on phone

---

### 2. **Payment Success** (`api/payments/mpesa/callback.ts`)
```typescript
// M-Pesa callback updates payment
UPDATE payments SET
  status = 'success',
  mpesa_receipt_number = 'QGR4H2B3LS',
  transaction_date = 20250107103045,
  processed_at = NOW(),
  updated_at = NOW()
WHERE transaction_id = 'ws_CO_01012025123456789'
```

**Flow**:
1. User enters M-Pesa PIN
2. M-Pesa processes payment
3. Callback sent to `/api/payments/mpesa/callback`
4. Payment status updated to `'success'`
5. Receipt number stored
6. Order status updated to `'CONFIRMED'`
7. Email notifications sent

---

### 3. **Payment Failure** (`api/payments/mpesa/callback.ts`)
```typescript
// If user cancels or payment fails
UPDATE payments SET
  status = 'failed',
  failure_reason = 'The initiator information is invalid',
  processed_at = NOW(),
  updated_at = NOW()
WHERE transaction_id = 'ws_CO_01012025123456789'
```

**Flow**:
1. User cancels prompt OR insufficient balance OR timeout
2. M-Pesa sends failure callback
3. Payment status updated to `'failed'`
4. Failure reason stored
5. Order status updated to `'PAYMENT_FAILED'`

---

### 4. **Status Check** (`api/payments/mpesa/status/[checkoutRequestId].ts`)
```typescript
// Frontend polls for payment status
GET /api/payments/mpesa/status/ws_CO_01012025123456789

Response:
{
  success: true,
  resultCode: '0',
  resultDesc: 'Payment confirmed',
  mpesaReceiptNumber: 'QGR4H2B3LS',
  paymentConfirmed: true,
  amount: 1200.00,
  source: 'database'
}
```

**Flow**:
1. Frontend polls status endpoint every 3-6 seconds
2. Checks database for payment record
3. Returns current status to user
4. Stops polling when status is final ('success' or 'failed')

---

## 🔗 Relationships

### To Orders Table
```sql
order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL
```
- **One-to-Many**: One order can have multiple payment attempts
- **Cascade Delete**: If order deleted, payments are deleted
- **Used for**: Linking payment confirmation to order fulfillment

### Payment Linking (in `api/orders/create.ts`)
```typescript
// After order creation, link existing payment
await supabase
  .from('payments')
  .update({ order_id: order.id })
  .eq('transaction_id', orderData.checkout_request_id);
```

---

## 🔒 Row Level Security (RLS)

```sql
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
```

### Default Policies
- **Service Role**: Full access (API endpoints use service role key)
- **Authenticated Users**: Cannot directly access via client
- **Public**: No access

**Why**: Payments contain sensitive financial data and should only be accessed through secure API endpoints with proper validation.

---

## 📊 Payment Status Values

| Status | Description | Next Action |
|--------|-------------|-------------|
| `pending` | STK Push sent, awaiting user response | Wait for callback or timeout |
| `success` | Payment confirmed by M-Pesa | Fulfill order |
| `failed` | Payment failed or cancelled | Show error to user, retry option |

**Note**: The system uses lowercase status values consistently.

---

## 💰 Amount Storage

### Important: Amounts in Cents
```typescript
// When storing
amount: Math.round(1200.00 * 100) // Store as 120000

// When displaying
displayAmount: payment.amount / 100 // Show as 1200.00
```

**Why**: Avoid floating-point precision issues in financial calculations.

---

## 🔍 Common Queries

### Get Payment by Transaction ID
```typescript
const { data: payment } = await supabase
  .from('payments')
  .select('*')
  .eq('transaction_id', checkoutRequestId)
  .single();
```

### Get Payments for an Order
```typescript
const { data: payments } = await supabase
  .from('payments')
  .select('*')
  .eq('order_id', orderId)
  .order('created_at', { ascending: false });
```

### Get Recent Successful Payments
```typescript
const { data: payments } = await supabase
  .from('payments')
  .select('*, orders(*)')
  .eq('status', 'success')
  .order('created_at', { ascending: false })
  .limit(50);
```

### Get Failed Payments for Analysis
```typescript
const { data: failedPayments } = await supabase
  .from('payments')
  .select('*')
  .eq('status', 'failed')
  .not('failure_reason', 'is', null)
  .order('created_at', { ascending: false });
```

---

## 📡 API Endpoints Using Payments Table

### 1. **STK Push Initiation**
- **File**: `api/payments/mpesa/stk-push.ts`
- **Method**: POST
- **Action**: Creates payment record with `status: 'pending'`
- **Returns**: CheckoutRequestID for status polling

### 2. **M-Pesa Callback**
- **File**: `api/payments/mpesa/callback.ts`
- **Method**: POST (called by M-Pesa)
- **Action**: Updates payment status to 'success' or 'failed'
- **Triggers**: Order status update, email notifications

### 3. **Payment Status Check**
- **File**: `api/payments/mpesa/status/[checkoutRequestId].ts`
- **Method**: GET
- **Action**: Reads payment status from database
- **Used by**: Frontend polling during checkout

### 4. **Order Creation**
- **File**: `api/orders/create.ts`
- **Method**: POST
- **Action**: Links payment to created order
- **Updates**: `order_id` field in payment record

---

## 🎯 Key Features

### 1. **Automatic Timestamps**
```sql
CREATE TRIGGER update_payments_updated_at 
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
- `created_at`: Set on insert
- `updated_at`: Auto-updated on every change

### 2. **Transaction Idempotency**
- `transaction_id` is unique per STK Push
- Prevents duplicate payment records
- Safe to retry callback processing

### 3. **Comprehensive Tracking**
- Full M-Pesa response data stored
- Phone numbers for customer support
- Receipt numbers for verification
- Transaction timestamps

### 4. **Failure Analysis**
- `failure_reason` captures exact M-Pesa error
- Common failures: timeout, cancelled, insufficient funds
- Helps improve user experience

---

## 📈 Monitoring & Analytics

### Payment Success Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM payments
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Revenue by Method
```sql
SELECT 
  method,
  COUNT(*) as transaction_count,
  SUM(amount) / 100.0 as total_revenue_kes,
  AVG(amount) / 100.0 as avg_transaction_kes
FROM payments
WHERE status = 'success'
GROUP BY method;
```

### Failure Reasons
```sql
SELECT 
  failure_reason,
  COUNT(*) as occurrence_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM payments
WHERE status = 'failed'
  AND failure_reason IS NOT NULL
GROUP BY failure_reason
ORDER BY occurrence_count DESC;
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Duplicate Payments
**Problem**: Same transaction ID inserted twice  
**Solution**: Use UPSERT or check existence first
```typescript
const { data: existing } = await supabase
  .from('payments')
  .select('id')
  .eq('transaction_id', checkoutRequestId)
  .single();

if (!existing) {
  // Insert new payment
}
```

### Issue 2: Orphaned Payments
**Problem**: Payment without order_id  
**Solution**: Link payment during order creation
```typescript
// After order created
await supabase
  .from('payments')
  .update({ order_id: order.id })
  .eq('transaction_id', checkoutRequestId);
```

### Issue 3: Stuck in Pending
**Problem**: Callback never received  
**Solution**: Status polling fallback
```typescript
// Query M-Pesa API directly if pending too long
if (payment.status === 'pending' && 
    Date.now() - payment.created_at > 5 * 60 * 1000) {
  // 5 minutes timeout
  await queryMpesaStatus(payment.transaction_id);
}
```

---

## 🔮 Related Tables

### 1. **transaction_logs** (Migration 20250930)
- Comprehensive audit trail
- Stores full M-Pesa callback data
- Separate from payments for historical analysis

### 2. **orders**
- Linked via `order_id`
- Order fulfillment depends on payment success

### 3. **payment_methods** (User saved methods)
- Stores user's preferred payment methods
- Different from `payments` (transactions)

---

## 📝 Best Practices

### 1. **Always Use Service Role Key**
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Not anon key
);
```

### 2. **Store Amounts in Cents**
```typescript
amount: Math.round(amount * 100) // KES to cents
```

### 3. **Log Everything**
```typescript
console.log('💰 Payment status:', {
  transaction_id,
  status,
  amount,
  mpesa_receipt_number
});
```

### 4. **Handle Callback Idempotency**
```typescript
// Always return 200 to M-Pesa to prevent retries
res.status(200).json({ success: true });
```

### 5. **Update Order Status**
```typescript
// After payment success
await supabase
  .from('orders')
  .update({ 
    status: 'CONFIRMED',
    payment_status: 'paid' 
  })
  .eq('id', payment.order_id);
```

---

## 🎓 Summary

The **payments table** is the backbone of the GetDeals payment system:

✅ **Tracks all M-Pesa transactions** from initiation to completion  
✅ **Links payments to orders** for fulfillment  
✅ **Stores comprehensive data** for support and analysis  
✅ **Handles callbacks** from M-Pesa API  
✅ **Provides status polling** for real-time updates  
✅ **Supports auditing** with timestamps and failure reasons  
✅ **Enables analytics** for business insights  

**Critical for**: Order processing, payment verification, customer support, financial reporting, fraud prevention.

---

**Last Updated**: October 7, 2025  
**Migration Version**: 20251007_fix_payment_amount_and_add_sender.sql  
**Status**: Production-ready ✅

**Recent Changes**:
- ✅ Added `sender_name` column to capture M-Pesa sender's full name
- ✅ Fixed payment amount calculation to reflect actual charged amount (pickup vs delivery)
- ✅ Enhanced payment_transactions_view to include sender_name
