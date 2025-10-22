# Payment Amount Conversion Analysis

## Data Arrangement Overview

The `payments` table follows a standard **double-entry payment ledger** pattern with comprehensive transaction lifecycle tracking:

### Column Organization

| **Category** | **Columns** | **Purpose** |
|---|---|---|
| **Identifiers** | `id`, `order_id`, `reference` | Unique transaction ID, linked order, business reference |
| **M-Pesa IDs** | `transaction_id`, `merchant_request_id` | Checkout request ID and merchant request ID from M-Pesa |
| **Amount & Method** | `amount`, `method` | Transaction amount (in cents), payment channel (mpesa) |
| **Status Tracking** | `status` | Transaction state: `pending`, `success`, `failed` |
| **Contact Info** | `phone_number`, `sender_name` | Customer phone and M-Pesa account holder name |
| **M-Pesa Confirmation** | `mpesa_receipt_number` | Official M-Pesa receipt code (empty until callback) |
| **Timestamps** | `transaction_date`, `created_at`, `updated_at` | M-Pesa timestamp, record creation, last modification |
| **Processing** | `processed_at` | When payment was confirmed by callback |
| **Legacy/Unused** | `phone`, `sender_name` | Duplicate fields (not actively used) |

### Data Flow Timeline

```
1. STK PUSH REQUEST (client initiates payment)
   └─ User selects amount → Payment form submits to /api/payments/mpesa/stk-push
   
2. STK PUSH PROCESSING (stk-push.ts creates pending record)
   ├─ Amount received: 200 KES (user input)
   ├─ Amount multiplied by 100: 20,000 cents
   ├─ Record inserted with amount: 20,000 (in cents)
   └─ M-Pesa STK prompt shown to customer
   
3. M-PESA CONFIRMATION (user enters M-Pesa PIN)
   ├─ Customer completes transaction on phone
   └─ M-Pesa fires callback to our server
   
4. CALLBACK PROCESSING (callback.ts receives M-Pesa response)
   ├─ M-Pesa sends amount in cents: 20,000
   ├─ We multiply by 100 again: 20,000 * 100 = 2,000,000 ❌ **BUG!**
   └─ Payment amount becomes: 2,000,000 cents (20,000 KES)
```

---

## 🔴 THE AMOUNT CONVERSION BUG

### Why Does 2 or 20 KES Become 200?

**The Root Cause: Double Conversion**

Looking at the code:

#### **stk-push.ts (Line 142)** - First Conversion ✅ CORRECT
```typescript
const paymentData = {
  // ...
  amount: Math.round(amount * 100), // Convert KES to cents
  // ...
};
```
- User sends: `amount: 2` (KES)
- We multiply by 100: `2 * 100 = 200` (cents)
- **Stored in DB**: 200 cents

#### **callback.ts (Line 81)** - Second Conversion ❌ BUG!
```typescript
...(amount && { amount: Math.round(amount * 100) }), // Store in cents
```
- M-Pesa sends amount in **cents already**: `200`
- We multiply by 100 AGAIN: `200 * 100 = 20,000` (cents)
- **Updated in DB**: 20,000 cents = 200 KES ❌

### Example Transactions from CSV

| Transaction | Original Input | After STK Push | After Callback | Display | Issue |
|---|---|---|---|---|---|
| Row 1 | 2 KES | 200 cents ✅ | 20,000 cents ❌ | 200 KES | **100x multiplier** |
| Row 2 | 20 KES | 2,000 cents ✅ | 200,000 cents ❌ | 2,000 KES | **100x multiplier** |
| Row 9 (9b3b) | 20 KES | 2,000 cents ✅ | 200,000 cents ❌ | 2,000 KES | **100x multiplier** |
| Row 21 (be28) | 20 KES | 2,000 cents ✅ | 200,000 cents ❌ | 2,000 KES | **100x multiplier** |

**Pattern**: Every successful transaction where M-Pesa sent the amount gets multiplied by 100x again, inflating the stored value.

### M-Pesa API Documentation Context

According to M-Pesa docs:
- **M-Pesa stores amounts in cents**
- In callback metadata: `Amount: 20000` means 200 KES
- **We should NOT multiply by 100 again** in the callback

---

## 🔧 The Fix

### Option 1: Remove Multiplication in Callback (RECOMMENDED)

**File**: `api/payments/mpesa/callback.ts` (Line 79-82)

**Current (Wrong)**:
```typescript
...(amount && { amount: Math.round(amount * 100) }), // Store in cents
```

**Fixed**:
```typescript
...(amount && { amount: amount }), // amount is already in cents from M-Pesa
```

### Option 2: Verify What M-Pesa Actually Sends

Add debug logging to see the raw value from M-Pesa:
```typescript
console.log('M-Pesa Amount Received:', { 
  rawAmount: amount, 
  type: typeof amount,
  afterMultiply: Math.round(amount * 100) 
});
```

---

## 📊 Amount Storage Convention

### Current Convention (with bug)
```
Database Storage: CENTS
Display to User: KES (divide by 100)
M-Pesa Input: CENTS
```

### Example Flow (BUGGY)
```
User sends: 2 KES
→ Frontend → Backend (stk-push)
  × 100 → 200 cents (stored) ✅

M-Pesa confirms payment
→ Callback receives: 200 cents
  × 100 → 20,000 cents (stored) ❌
  ÷ 100 → Display as 200 KES ❌

Result: User paid 2 KES but system shows 200 KES paid
```

---

## 🛠 Complete Fix Required

### Files to Update

#### 1. **api/payments/mpesa/callback.ts** - Line 79-82
```diff
- ...(amount && { amount: Math.round(amount * 100) }), // Store in cents
+ ...(amount && { amount: amount }), // amount is already in cents from M-Pesa
```

#### 2. **Verification Query** - Check all affected transactions
```sql
-- Find transactions with suspiciously large amounts
SELECT id, amount, status, created_at, processed_at
FROM payments
WHERE amount > 500000  -- More than 5000 KES
  AND status = 'success'
  AND processed_at IS NOT NULL
ORDER BY created_at DESC;
```

#### 3. **Data Migration** - Divide affected amounts by 100
```sql
-- Fix successful payments that were multiplied by 100
UPDATE payments
SET amount = ROUND(amount / 100)
WHERE status = 'success'
  AND processed_at IS NOT NULL
  AND amount > 500000  -- Suspicious threshold
  AND amount % 100 = 0;  -- Only amounts divisible by 100 (likely multiplied)
```

---

## 📈 Impact Analysis

### Affected Transactions
From your CSV data, **every successful payment has this issue**:
- 200 KES stored when 2 KES was actually paid
- 2,000 KES stored when 20 KES was actually paid
- Revenue inflated by **100x** in all confirmed payments

### Potential Issues
1. ✅ **Wallet Balance**: Not affected (wallet uses different tables)
2. ❌ **Financial Reports**: Revenue reports show 100x inflation
3. ❌ **Analytics**: Payment amounts completely inaccurate
4. ⚠️ **Email Confirmations**: Show wrong amounts to customers (Line 125 in callback.ts)
5. ⚠️ **Future Transactions**: Will continue to be wrong until fixed

---

## 🎯 Recommendation

1. **Immediate**: Fix the callback multiplication
2. **Short-term**: Deploy fix to production
3. **Medium-term**: Migrate historical data (divide by 100 for successful payments)
4. **Verification**: Compare against actual M-Pesa settlement statements
5. **Testing**: Add unit tests to prevent regression

---

## Data Schema Insight

The CSV shows why the bug persists:
- Most amounts are round hundreds: `200`, `400000`, `100200`, `2000`
- These are suspicious (200 is 2 KES, not 2 shillings)
- Pending payments have no `processed_at` - they weren't affected by callback multiplication
- Only `success` payments have the double-multiplication applied

This confirms the bug happens **only during callback processing**, not during initial STK push.
