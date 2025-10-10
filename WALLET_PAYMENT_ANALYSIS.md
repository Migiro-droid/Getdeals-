# Wallet Payment System Analysis

**Branch:** `feature/wallet-to-merchant-payment`  
**Date:** October 7, 2025

## Current Implementation Status

### ✅ What EXISTS:

1. **Wallet Balance Management**
   - Users can deposit money into their wallet via M-Pesa
   - Wallet balance is tracked in the `wallets` table
   - Real-time balance updates via Supabase subscriptions
   - Transaction history is maintained

2. **Wallet Payment Flow (INTERNAL ONLY)**
   - When a user selects "Pay with Wallet" at checkout:
     - System checks if balance is sufficient
     - Uses `WalletService.recordWithdrawal()` to deduct money
     - Creates a withdrawal transaction record
     - Updates wallet balance atomically (in database)
     - Creates the order with payment marked as "wallet"
   - **Location:** `src/pages/CheckoutPage.tsx` (lines 620-670)
   - **Service:** `src/services/wallet-backend.ts`

### ❌ What's MISSING:

**The money NEVER leaves the user's GetDeals wallet to reach the merchant!**

The current implementation:
- ✅ Deducts money from user's wallet balance
- ✅ Records it as a withdrawal/payment
- ❌ **Does NOT transfer funds to GetDeals merchant account**
- ❌ **Does NOT trigger any actual money movement**

## The Problem

```
Current Flow:
User Wallet → [Deduction] → Transaction Record → Order Created
              ↓
         Money just "disappears" (stays in user's account balance)
         
What Should Happen:
User Wallet → [Deduction] → [Transfer to Merchant] → Transaction Record → Order Created
                            ↓
                        Money moves to GetDeals account
```

## Existing But Unused Code

There IS a `wallet-payment` Edge Function (`supabase/functions/wallet-payment/index.ts`), but:
- ❌ It calls Rukisha's **third-party merchant payment API** (which is for M-Pesa STK push)
- ❌ This is NOT what we need - we don't want to charge the user's phone again
- ❌ The user already has money in their GetDeals wallet
- ❌ This function is currently **NOT called** during checkout

## What We Need to Build

### Wallet-to-Merchant Transfer API

We need to integrate with a payment provider (likely Rukisha) that supports:

1. **Wallet Transfer / Disbursement API**
   - Transfer funds from user's GetDeals wallet to merchant account
   - Or: Use a payment aggregator that can handle wallet-to-wallet transfers
   - Or: Integrate with M-Pesa B2B/B2C API for actual money movement

2. **Required Components:**

   a) **Backend Edge Function:** `wallet-to-merchant-transfer`
      - Accept: user_id, amount, order_reference
      - Verify user has sufficient balance
      - Call payment provider's transfer/disbursement API
      - Record transaction
      - Update balances
      - Handle success/failure states

   b) **Update Checkout Flow:**
      - Replace current `recordWithdrawal()` call
      - Call new transfer function
      - Handle async processing (transfers may not be instant)
      - Show appropriate loading/success states

   c) **Database Changes:**
      - Add `transfer_status` field to wallet_transactions
      - Add `merchant_transaction_id` for external reference
      - Add `merchant_response` JSON field for debugging

## Questions to Resolve

1. **Which payment provider should we use?**
   - Does Rukisha support wallet-to-wallet or disbursement APIs?
   - Do we need to integrate with M-Pesa Business API directly?
   - Should we use a different payment aggregator?

2. **How should we handle merchant account?**
   - Is there a GetDeals merchant wallet/account?
   - What are the credentials/API keys?
   - What's the merchant ID or account number?

3. **Settlement timeline:**
   - Should transfers be instant?
   - Or batched daily/weekly?
   - How do we handle transfer failures?

4. **Reconciliation:**
   - How do we track that money actually reached the merchant account?
   - What reports/webhooks do we need?
   - How do we handle refunds?

## Next Steps

1. ✅ Create feature branch (DONE)
2. 🔍 Research Rukisha API documentation for:
   - Wallet transfer capabilities
   - Disbursement APIs
   - B2B payment options
3. 📝 Design the wallet-to-merchant transfer flow
4. 💻 Implement the Edge Function
5. 🔄 Update checkout flow
6. 🧪 Test with sandbox/test environment
7. 🚀 Deploy to production

## Files to Modify

1. `supabase/functions/wallet-to-merchant-transfer/index.ts` (NEW)
2. `src/services/WalletPaymentService.ts` (UPDATE)
3. `src/services/wallet-backend.ts` (UPDATE - add merchant transfer method)
4. `src/pages/CheckoutPage.tsx` (UPDATE - replace withdrawal with transfer)
5. Database migrations for new transaction fields

---

**Current Status:** Investigation complete. Ready to start implementation once payment provider details are confirmed.
