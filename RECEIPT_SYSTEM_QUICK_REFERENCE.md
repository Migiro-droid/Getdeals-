# Receipt System - Quick Reference Guide

## 🎯 Quick Answer

**Q: Do users receive a receipt after payment?**

**A: ✅ YES - 3 ways to access receipt**

---

## 📨 Receipt Delivery Methods

### Method 1: Payment Confirmation Email ✉️
```
┌─────────────────────────────────────┐
│ Subject: Payment Confirmed - TXN123 ✅│
├─────────────────────────────────────┤
│ To: user@example.com                │
├─────────────────────────────────────┤
│ ✓ Amount Paid: KES 5,000            │
│ ✓ Transaction ID: TXN-ABC123        │
│ ✓ Order Number: GD1729527894ABC     │
│ ✓ Payment Method: Wallet/M-Pesa     │
│ ✓ Date & Time: Oct 21, 2:31 PM      │
│ ✓ Professional HTML template        │
│ ✓ Company branding & footer         │
└─────────────────────────────────────┘
```

**When Sent:** Immediately after payment is processed (within seconds)

---

### Method 2: Order Confirmation Email 📦
```
┌─────────────────────────────────────┐
│ Subject: Order Confirmed - ORD-ABC 📦│
├─────────────────────────────────────┤
│ To: user@example.com                │
├─────────────────────────────────────┤
│ ✓ Order ID: ORD-1729527894-ABC      │
│ ✓ Items Ordered:                    │
│   - Essential Basket × 1 = KES 3,000│
│   - Premium Bundle × 2 = KES 5,000  │
│ ✓ Subtotal: KES 8,000               │
│ ✓ Delivery Fee: KES 200              │
│ ✓ TOTAL: KES 8,200                  │
│ ✓ Delivery Address: 123 Main St     │
│ ✓ Next Steps (processing timeline)  │
│ ✓ Support contact information       │
└─────────────────────────────────────┘
```

**When Sent:** After order is created in database (within 1-2 seconds of payment)

---

### Method 3: Dashboard Receipt 💻
```
Location: /account?tab=orders

Click on order → Opens receipt modal:

┌─────────────────────────────────┐
│ Order ORD-123      Oct 21, 2:31 PM
├──────────────────────────────────┤
│
│ ITEMS                TOTALS
│ ─────────────        ──────────
│ ┌─────────────┐      Subtotal: 8000
│ │   Essential │      Delivery: 200
│ │   Basket    │      ──────────
│ │ Qty: 1      │      TOTAL:   8200
│ │ 3,000 KES   │
│ └─────────────┘
│
│ ┌─────────────┐      STATUS
│ │  Premium    │      ✓ Pending
│ │  Bundle     │      ○ Confirmed
│ │ Qty: 2      │      ○ Shipped
│ │ 5,000 KES   │      ○ Delivered
│ └─────────────┘
│                      CUSTOMER
│                      ─────────
│                      John Doe
│                      +254712345678
│                      john@example.com
│
│                      DELIVERY
│                      ────────
│                      Speedy Drop
│                      123 Main St
│
└──────────────────────────────────┘
```

**When Available:** Immediately (can be viewed anytime)

---

## 💳 Payment Methods & Receipt Handling

### Wallet Payment Flow
```
1. User selects "Wallet" payment
   ↓
2. System verifies sufficient balance
   ↓
3. Payment processed
   ↓
4. ✉️ PAYMENT CONFIRMATION EMAIL SENT
   - Transaction ID
   - Amount: KES [amount]
   - Payment method: GetDeals Wallet
   ↓
5. Order created in database
   ↓
6. ✉️ ORDER CONFIRMATION EMAIL SENT
   - Full order details
   - Itemized list
   - Total amount
   ↓
7. Cashback calculated (5% of total)
   ↓
8. User redirected to account page
   ↓
9. ✅ Receipt available on dashboard
```

---

### M-Pesa Payment Flow
```
1. User selects "M-Pesa" payment
   ↓
2. STK Push sent to user's phone
   ↓
3. User enters M-Pesa PIN
   ↓
4. Payment processes (5-30 seconds)
   ↓
5. System confirms payment with M-Pesa
   ↓
6. M-Pesa receipt number captured
   ↓
7. ✉️ PAYMENT CONFIRMATION EMAIL SENT
   - M-Pesa Receipt Number
   - Amount: KES [amount]
   - Payment method: M-Pesa
   - Transaction ID
   ↓
8. Order created in database
   ↓
9. ✉️ ORDER CONFIRMATION EMAIL SENT
   - Full order details
   ↓
10. User redirected to account page
    ↓
11. ✅ THREE receipts:
    - M-Pesa receipt on phone
    - Payment confirmation email
    - Order confirmation email
    - Dashboard record
```

---

## 📋 What's In Each Receipt

### Payment Confirmation Receipt
```
Information Included:
├─ ✓ Success status (✅ Confirmed)
├─ ✓ Amount paid (KES format)
├─ ✓ Transaction ID (unique reference)
├─ ✓ Order Number (order reference)
├─ ✓ Payment method (Wallet/M-Pesa)
├─ ✓ Date & Time (ISO format converted to local)
├─ ✓ Company branding
├─ ✓ Support contact info
└─ ✓ Professional HTML formatting
```

---

### Order Confirmation Receipt
```
Information Included:
├─ ✓ Order ID
├─ ✓ Customer name
├─ ✓ Order date
├─ ✓ Itemized product list
│  ├─ Product name
│  ├─ Quantity ordered
│  └─ Price per item
├─ ✓ Order subtotal
├─ ✓ Delivery fee
├─ ✓ Order total
├─ ✓ Payment method used
├─ ✓ Delivery address or pickup location
├─ ✓ Processing timeline (1-2 business days)
├─ ✓ Shipping timeline (2-5 business days)
├─ ✓ Support contact information
└─ ✓ Company details & footer
```

---

### Dashboard Receipt (Modal)
```
Information Displayed:
├─ ✓ Order ID
├─ ✓ Order date/time
├─ ✓ Product images (thumbnails)
├─ ✓ Product names
├─ ✓ Quantities per item
├─ ✓ Individual item prices
├─ ✓ Price breakdown
│  ├─ Subtotal
│  ├─ Delivery fee
│  └─ Total
├─ ✓ Order status (badge)
├─ ✓ Customer details
│  ├─ Name
│  ├─ Phone
│  └─ Email
├─ ✓ Fulfillment details
│  ├─ Delivery method
│  ├─ Address/Pickup location
│  └─ Payment method
└─ ✓ Special notes (if any)
```

---

## 🔄 Complete User Journey

```
STEP 1: USER IN CHECKOUT
   │
   └─→ Fills in customer information
       └─→ Selects delivery method
           └─→ Chooses payment method
               └─→ CLICKS "PLACE ORDER"

STEP 2: PAYMENT PROCESSING
   │
   ├─ Wallet: Deducts from balance ✓
   ├─ M-Pesa: User enters PIN on phone ✓
   └─ Cash: Order marked pending ✓

STEP 3: PAYMENT CONFIRMED
   │
   └─→ ✉️ PAYMENT CONFIRMATION EMAIL SENT
       - Contains payment details
       - Transaction ID visible
       - Amount clearly displayed
       - Status: ✅ CONFIRMED

STEP 4: ORDER CREATED
   │
   └─→ Order inserted into database
       └─→ Order ID generated
           └─→ Order status: "pending"

STEP 5: ORDER CONFIRMATION EMAIL SENT
   │
   └─→ ✉️ FULL ORDER RECEIPT EMAILED
       - All order items listed
       - Itemized prices shown
       - Total amount displayed
       - Delivery info included
       - Processing timeline provided

STEP 6: USER INTERFACE UPDATE
   │
   └─→ Cart cleared
       └─→ Success toast message
           └─→ User redirected to:
               /account?tab=orders&orderId=[order_id]

STEP 7: RECEIPT ACCESSIBLE
   │
   ├─→ ✉️ TWO EMAILS IN INBOX
   │   ├─ Payment confirmation
   │   └─ Order confirmation
   │
   ├─→ 💻 DASHBOARD RECEIPT
   │   └─ Click order to view modal
   │
   └─→ 📱 (M-Pesa only) SMS receipt on phone
```

---

## ✉️ Email Service Details

**Email Provider:** Brevo Email Service  
**Service Class:** `BrevoService`  
**Configuration File:** `api/email/send.ts`

**Email Template Types Supported:**
```
1. payment-confirmation  ← Used for payment receipt
2. order-confirmation    ← Used for order receipt
3. welcome              ← For new user signup
4. password-reset       ← For password recovery
5. simple               ← Custom emails
```

**Template Sources:**
- ✓ Primary: Brevo templates (if template IDs configured)
- ✓ Fallback: Built-in HTML templates (email-templates.js)

**Email Features:**
```
├─ Professional HTML formatting
├─ Company branding (logo, colors)
├─ Responsive design (mobile + desktop)
├─ Professional styling
├─ Contact information in footer
├─ Auto-retry on failure
└─ Async sending (doesn't block checkout)
```

---

## 🎯 Key Takeaways

| Aspect | Status |
|--------|--------|
| Payment Receipt? | ✅ YES (email + dashboard) |
| Order Receipt? | ✅ YES (email + dashboard) |
| Multiple receipts? | ✅ YES (2 emails minimum) |
| Immediate delivery? | ✅ YES (within seconds) |
| Professional format? | ✅ YES (HTML email) |
| Accessible anytime? | ✅ YES (email + dashboard) |
| Printable? | ✅ YES (browser print) |
| Downloadable? | ✅ YES (save email as PDF) |
| M-Pesa receipt? | ✅ YES (in email + SMS) |
| Wallet receipt? | ✅ YES (in email) |

---

## 🚀 User Experience Timeline

```
T = 0s:     User clicks "Place Order"
            ↓
T = 0-2s:   Payment processed
            ↓
T = 1-2s:   ✉️ PAYMENT EMAIL RECEIVED
            "Payment Confirmed - TXN-123 ✅"
            ↓
T = 1-3s:   Order created in database
            ↓
T = 2-3s:   ✉️ ORDER EMAIL RECEIVED
            "Order Confirmed - ORD-456 📦"
            ↓
T = 2-3s:   User redirected to account page
            ↓
T = 3s+:    Receipt visible on dashboard
            └─ User can view anytime
            └─ Can print via browser
            └─ Can reference emails
```

---

## 💡 Summary

**Yes, users receive comprehensive receipts:**

1. **✅ Payment Confirmation Email**
   - Immediate delivery
   - Payment verification
   - Transaction reference

2. **✅ Order Confirmation Email**
   - Full order details
   - Itemized items list
   - Delivery information

3. **✅ Dashboard Receipt**
   - Always accessible
   - Interactive modal
   - Print/reference capability

**Total Receipt Channels: 3** (Email + Email + Dashboard)

All receipt systems are fully operational and user-friendly.

---

**Last Updated:** October 21, 2025  
**Status:** ✅ Receipt System Fully Operational
