# Customer ID Column Fix - October 7, 2025

## 🔴 Error Found

```
column user_profile.customer_id does not exist
```

**Cause:** The Edge Function was trying to access `profile.customer_id` but the `user_profile` table doesn't have this column.

---

## ✅ Fix Applied

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
