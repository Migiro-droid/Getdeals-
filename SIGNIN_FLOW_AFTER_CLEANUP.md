# 🔄 What Happens After Customer ID Cleanup - Sign In Flow

## Scenario: User's fake customer_id was cleared from database

---

## Flow When User Signs In Again

### Step 1: User Signs In ✅
```
User enters: email + password
↓
Supabase Auth validates credentials
↓
Authentication successful
```

### Step 2: AuthContext Loads User Profile ✅
**File**: `src/contexts/AuthContext.tsx`

```typescript
// System fetches profile from database
const profile = await getProfileById(user.id)

// Profile now looks like:
{
  id: "c11fb25a-4542-4fec-9c7e-26d94afcadd7",
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+254729868076",
  customer_id: NULL,  // ← Was cleared by SQL cleanup!
  created_at: "2025-10-01T10:00:00Z",
  updated_at: "2025-10-13T14:30:00Z"
}
```

### Step 3: User Logs In Successfully ✅
```
✅ User is signed in
✅ Can browse products
✅ Can add items to cart
✅ Can view orders
✅ Can access wallet page
```

### Step 4: User Tries to Deposit ❌
```
User clicks "Deposit 100 KES"
↓
System checks: profile.customer_id
↓
Result: customer_id is NULL
↓
Response: {
  error: "KYC_REQUIRED",
  message: "Wallet not activated. Please complete KYC verification first.",
  action: "REDIRECT_TO_KYC"
}
```

**User sees**: Banner or modal saying "Complete KYC to enable deposits"

### Step 5: User Completes KYC Form 📝
```
User fills in:
- First Name: John
- Last Name: Doe  
- Phone: +254729868076
- ID Number: 12345678
↓
Submits form
```

### Step 6: System Calls Rukisha API 🔄

**File**: `supabase/functions/register-customer/index.ts`

```typescript
// Request to Rukisha
POST https://api.rukisha.com/api/tap-and-go/register-customer
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+254729868076",
  "id_number": 12345678,
  "agent_id": 110
}
```

---

## 🔀 Two Possible Rukisha Responses

### Scenario A: User Already Registered with Rukisha ✅

**Rukisha Response**:
```json
{
  "status": 400,
  "error": "Customer with phone +254729868076 already exists with ID: 7892"
}
```

**Our System Handles It**:
```typescript
// In register-customer function (NEW CODE WE ADDED)
if (errorMsg.includes('already exists')) {
  // Extract customer ID from error message
  const customerId = "7892"  // ← Extracted!
  
  // Store it in database
  UPDATE profiles
  SET customer_id = '7892'
  WHERE user_id = 'c11fb25a-4542-4fec-9c7e-26d94afcadd7'
  
  // Activate wallet
  UPDATE wallets SET is_active = true
  
  // Mark KYC as verified
  UPDATE wallet_kyc SET status = 'verified'
  
  // Return success
  return {
    success: true,
    customer_id: "7892",
    message: "Account linked! You were already registered with Rukisha.",
    is_existing_customer: true
  }
}
```

**User sees**:
```
✅ "Success! Your wallet has been activated."
✅ "Your existing Rukisha account has been linked."
```

**Database after**:
```json
{
  customer_id: "7892",  // ← Real Rukisha ID!
  // ...rest of profile
}
```

---

### Scenario B: New User to Rukisha ✅

**Rukisha Response**:
```json
{
  "status": 200,
  "message": "Customer registered successfully",
  "customer": {
    "id": 8956,  // ← New customer ID assigned
    "name": "John Doe",
    "phone": "+254729868076",
    "id_number": "12345678"
  }
}
```

**Our System Handles It**:
```typescript
// Store new customer ID
UPDATE profiles
SET customer_id = '8956'
WHERE user_id = 'c11fb25a-4542-4fec-9c7e-26d94afcadd7'

// Activate wallet
UPDATE wallets SET is_active = true

// Return success
return {
  success: true,
  customer_id: "8956",
  message: "Customer registration successful. Wallet activated."
}
```

**User sees**:
```
✅ "Success! Your wallet has been activated."
✅ "You can now make deposits."
```

**Database after**:
```json
{
  customer_id: "8956",  // ← Brand new Rukisha ID!
  // ...rest of profile
}
```

---

## 📊 Summary Table

| Action | Before Cleanup | After Cleanup & Sign In | After KYC |
|--------|---------------|------------------------|-----------|
| **customer_id** | `customer_c11...` (fake) | `NULL` | `7892` or `8956` (real) |
| **Can Sign In?** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Can Browse?** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Can Deposit?** | ❌ No (invalid ID) | ❌ No (NULL) | ✅ Yes (real ID) |
| **Error Message** | "invalid client ID" | "KYC required" | None - Works! |

---

## 🎯 Key Points

### 1. **Sign In Still Works** ✅
- Clearing `customer_id` does NOT affect authentication
- Users can still log in with email/password
- They keep all their data (orders, favorites, etc.)

### 2. **Only Deposits Are Blocked** ⚠️
- Until they complete KYC again
- Clear error message: "Please complete KYC verification"

### 3. **KYC Re-Registration is Smart** 🧠
- If already registered: Rukisha returns existing ID
- If new: Rukisha creates new account
- Either way: User gets real Rukisha ID

### 4. **No Data Loss** 💾
- Transaction history preserved
- Wallet balance preserved
- Order history preserved
- Only `customer_id` field is cleared

### 5. **One-Time Process** 🎉
- User completes KYC once
- Gets real Rukisha ID
- Deposits work forever after that

---

## 🔍 What If Rukisha Doesn't Return ID in Error?

**Scenario**: Error says "already exists" but no ID in message

```json
{
  "error": "Customer already registered"
  // ← No ID provided!
}
```

**Our System Response**:
```typescript
return {
  error: "You are already registered with Rukisha but we could not automatically link your account.",
  message: "Please contact support to link your existing Rukisha account.",
  contact_email: "support@getdeals.co.ke",
  phone: "+254729868076",
  action: "CONTACT_SUPPORT"
}
```

**User sees**:
```
⚠️ "You're already registered with Rukisha"
⚠️ "Please contact support at support@getdeals.co.ke"
📞 "Provide phone number: +254729868076"
```

**Support Action**:
1. Contact Rukisha support with user's phone
2. Rukisha provides customer ID (e.g., `7892`)
3. Manually update database:
   ```sql
   UPDATE profiles
   SET customer_id = '7892'
   WHERE phone = '+254729868076';
   ```
4. Inform user they can now deposit

---

## 📝 Step-by-Step Example: Real User Journey

### Day 1: Before Cleanup
```
User: john@example.com
customer_id: customer_c11fb25a-4542-4fec-9c7e-26d94afcadd7

Tries to deposit 100 KES
❌ Error: "invalid client ID"
```

### Day 2: Admin Runs Cleanup
```sql
UPDATE profiles
SET customer_id = NULL
WHERE customer_id LIKE 'customer_%';

-- john@example.com now has customer_id = NULL
```

### Day 3: User Signs In Again
```
✅ Sign in successful
✅ Can browse and shop
❌ Deposit blocked: "Please complete KYC"
📝 User clicks "Complete KYC"
```

### Day 3: User Submits KYC
```
Form filled:
- Name: John Doe
- Phone: +254729868076  
- ID: 12345678

↓ Submitted to Rukisha ↓

Rukisha checks: Is +254729868076 already registered?
```

### Day 3: Rukisha Already Has User
```
Rukisha: "Already exists with ID: 7892"
↓
System extracts: customer_id = 7892
↓
Database updated: john@example.com → customer_id = "7892"
↓
✅ Wallet activated!
```

### Day 3: User Deposits Successfully
```
User tries: Deposit 100 KES
↓
System sends to Rukisha:
{
  "client_id": "7892",  // ← Real ID!
  "amount": 100,
  "phone": "254729868076"
}
↓
Rukisha: ✅ "Payment initiated"
↓
User receives STK push
↓
User confirms payment
↓
✅ 100 KES added to wallet!
```

---

## ✅ Testing Checklist

**Test User Sign In After Cleanup**:

1. [ ] Clear user's customer_id in database
2. [ ] User signs in → Should work ✅
3. [ ] User tries to deposit → Should see "KYC required" ⚠️
4. [ ] User completes KYC:
   - If existing customer: Should extract ID from error ✅
   - If new customer: Should get new ID ✅
5. [ ] User tries deposit again → Should work ✅

---

## 🚨 Edge Cases to Handle

### Edge Case 1: Multiple Users Same Phone
```
Problem: Two GetDeals accounts, same Rukisha phone
Solution: Only one will get linked automatically
Other: Contact support for manual linking
```

### Edge Case 2: Phone Number Changed
```
Problem: User changed phone since original Rukisha registration
Solution: Register with new phone (creates new Rukisha account)
Note: Old Rukisha account remains separate
```

### Edge Case 3: ID Number Changed
```
Problem: User wants to update ID number
Solution: Contact Rukisha support (we can't change their records)
```

---

## 📞 Support Scripts

### Script 1: User Can't Sign In
```
Issue: User can't sign in after cleanup
Response: "Clearing customer_id doesn't affect sign in. 
           Please check your email/password or reset password."
```

### Script 2: User Sees KYC Required
```
Issue: User sees "KYC Required" message
Response: "Please complete the KYC form in your wallet.
           This links your account with our payment provider."
```

### Script 3: Already Registered Error
```
Issue: User sees "already registered with Rukisha"
Response: "That's good! It means you have an existing account.
           We're linking it now. You should be able to deposit shortly.
           If not, contact us with your phone number."
```

---

## 🎉 Expected Success Rate

- **90%+** users: Automatic linking via error message ID extraction
- **5-10%** users: Manual support intervention needed
- **<1%** users: Complex cases (phone changes, etc.)

---

**Bottom Line**: 
✅ Sign in works normally after cleanup  
✅ User just needs to complete KYC once  
✅ System automatically links existing Rukisha accounts  
✅ Deposits work after KYC completed  

No user data is lost! Just a one-time KYC re-verification. 🎯
