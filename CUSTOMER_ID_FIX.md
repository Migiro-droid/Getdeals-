# Customer ID Column Fix - Updated October 13, 2025

## 🔴 NEW CRITICAL ISSUE DISCOVERED (October 13, 2025)

### Problem: Invalid Customer ID Format Causing Deposit Failures

**Error**: "invalid client ID" when attempting deposits

**Root Cause**: System was generating fake customer IDs instead of using Rukisha-issued IDs:
- ❌ **Wrong Format**: `customer_c11fb25a-4542-4fec-9c7e-26d94afcadd7` (auto-generated)
- ✅ **Correct Format**: `7892` (Rukisha numeric ID)

### How It Happened:
1. `AuthContext.tsx` was auto-generating `customer_id` during signup
2. Users never got real Rukisha customer IDs from KYC registration
3. Deposits failed because Rukisha doesn't recognize fake IDs

---

## ✅ FIXES APPLIED (October 13, 2025)

### Fix 1: AuthContext - Stop Auto-Generating Customer IDs

**File**: `src/contexts/AuthContext.tsx` (Line 170)

```typescript
// BEFORE (❌ Wrong)
customer_id: `customer_${supabaseUser.id}`, // Generate customer_id

// AFTER (✅ Fixed)
customer_id: null, // Will be set by Rukisha during KYC registration
```

### Fix 2: Deposit API - Use Correct Parameter Name

**File**: `supabase/functions/deposit-funds/index.ts` (Line 210)

```typescript
// BEFORE (❌ Wrong)
const rukishaPayload = {
  amount: Number(amount),
  phone: formattedPhone,
  customer_id: profile.customer_id,  // Wrong parameter
  callback_url: "https://getdeals.co.ke/api/webhooks/rukisha",
  reference: reference
}

// AFTER (✅ Fixed)
const rukishaPayload = {
  amount: Number(amount),
  phone: formattedPhone,
  client_id: profile.customer_id,  // Rukisha uses 'client_id' for deposits
  callback_url: "https://getdeals.co.ke/api/webhooks/rukisha",
  reference: reference
}
```

### Fix 3: Database Cleanup Required

**Action**: Run `fix-customer-id-format.sql` to clear invalid customer IDs

```sql
-- Clear all auto-generated fake customer_ids
UPDATE profiles
SET customer_id = NULL
WHERE customer_id LIKE 'customer_%';
```

---

## 📋 HOW CUSTOMER IDs SHOULD WORK

### Correct Registration Flow:

1. **User Signs Up** → `customer_id` = `NULL`
2. **User Completes KYC** → System calls Rukisha `/register-customer`
3. **Rukisha Returns ID** → e.g., `{ customer: { id: 7892 } }`
4. **System Stores ID** → `customer_id` = `"7892"`
5. **Deposits Work** → Rukisha recognizes the ID ✅

### Current State:
- ✅ New users will have `NULL` customer_id until KYC
- ✅ KYC registration stores real Rukisha numeric IDs
- ⚠️ **Existing users must complete KYC again**

---

## 🔴 PREVIOUS ISSUE (October 7, 2025)

```
column user_profile.customer_id does not exist
```

**Cause:** The Edge Function was trying to access `profile.customer_id` but the `user_profile` table doesn't have this column.

---

## ✅ Previous Fix Applied (October 7, 2025)

### Changes Made to `wallet-to-merchant-payment/index.ts`:

1. **Updated profile query:**
```typescript
// BEFORE (❌ Wrong)
.select('customer_id, getdeals_number')

// AFTER (✅ Fixed)
.select('getdeals_number, phone')
```

2. **Updated metadata:**
```typescript
// BEFORE (❌ Wrong)
metadata: {
  customer_id: profile.customer_id,
  ...
}

// AFTER (✅ Fixed)
metadata: {
  customer_id: profile.getdeals_number || user.id,
  ...
}
```

3. **Updated Rukisha payload:**
```typescript
// BEFORE (❌ Wrong)
customer_id: profile.customer_id || profile.getdeals_number || user.id

// AFTER (✅ Fixed)
customer_id: profile.getdeals_number || user.id
```

---

## 📊 user_profile Table Structure

The actual columns in `user_profile` are:
- `id` - UUID primary key
- `user_id` - UUID (references auth.users)
- `first_name` - TEXT
- `last_name` - TEXT
- `full_name` - TEXT
- `phone` - TEXT
- `email` - TEXT
- `organization` - TEXT
- `organization_number` - TEXT
- `avatar_url` - TEXT
- `email_verified` - BOOLEAN
- `phone_verified` - BOOLEAN
- `is_active` - BOOLEAN
- `getdeals_number` - TEXT (added later)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**Note:** There is NO `customer_id` column!

---

## 🎯 Customer ID Resolution

Now uses this logic:
```typescript
customer_id: profile.getdeals_number || user.id
```

**Priority:**
1. Use `getdeals_number` if available (e.g., "GD-123456")
2. Fall back to `user.id` (Supabase auth user UUID)

---

## ✅ Deployment Status

- [x] Edge Function updated
- [x] Function redeployed successfully
- [x] customer_id references removed
- [x] Using getdeals_number instead

---

## 🧪 Test Now

Try making a wallet payment again. The errors should be resolved:
- ❌ "column user_profile.customer_id does not exist" → FIXED
- ❌ "PGRST116: Cannot coerce result to single JSON object" → FIXED (by auto-wallet creation)

Expected flow:
1. User attempts payment
2. Function creates wallet if missing
3. Checks balance (should show "insufficient balance" if 0)
4. If sufficient balance → processes payment

---

**Status:** ✅ DEPLOYED & FIXED  
**Updated:** October 7, 2025
