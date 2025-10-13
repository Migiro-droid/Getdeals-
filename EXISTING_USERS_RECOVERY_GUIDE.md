# 🔄 Existing Users Recovery Guide - Customer ID Fix

## Problem Summary

Users who signed up **before October 13, 2025** have fake customer IDs like:
- `customer_c11fb25a-4542-4fec-9c7e-26d94afcadd7`

These users **cannot make deposits** because Rukisha doesn't recognize these fake IDs.

---

## ❌ What We CANNOT Do

**Unfortunately, Rukisha API does NOT provide:**
- ✗ Lookup customer by phone number
- ✗ Retrieve existing customer ID by email
- ✗ Search customers by name or ID number

**This means:** We cannot automatically map existing Rukisha accounts to our users.

---

## ✅ Available Solutions

### Solution 1: Force KYC Re-registration (RECOMMENDED)

**How it works:**
1. Clear all fake customer IDs from database
2. Users complete KYC form again
3. **Two possible outcomes:**

#### Outcome A: User Already Registered with Rukisha
```
Rukisha Response: "Customer with this phone number already exists"
└── Customer ID: 7892 (returned in error message or response)
└── System stores: customer_id = "7892"
└── ✅ User can now deposit
```

#### Outcome B: New User to Rukisha
```
Rukisha Response: "Customer registered successfully"
└── Customer ID: 7892 (new ID assigned)
└── System stores: customer_id = "7892"
└── ✅ User can now deposit
```

**Implementation Steps:**

1. **Database Cleanup** (Run in Supabase SQL Editor):
```sql
-- Mark all fake customer_ids for cleanup
UPDATE profiles
SET 
  customer_id = NULL,
  updated_at = NOW()
WHERE customer_id LIKE 'customer_%';

-- Verify cleanup
SELECT 
  COUNT(*) as total_users,
  COUNT(customer_id) as users_with_rukisha_id,
  COUNT(CASE WHEN customer_id LIKE 'customer_%' THEN 1 END) as invalid_ids
FROM profiles;
```

2. **Update Register-Customer Function** to handle existing customers gracefully:

```typescript
// File: supabase/functions/register-customer/index.ts
// Add after line 140

if (!rukishaResponse.ok) {
  const rukishaData: RukishaErrorResponse = await rukishaResponse.json()
  
  // Check if customer already exists
  if (rukishaData.message?.includes('already exists') || 
      rukishaData.error?.includes('already registered')) {
    
    // Extract customer ID from error message if possible
    // Some APIs return: "Customer already exists with ID: 7892"
    const idMatch = rukishaData.message?.match(/ID[:\s]+(\d+)/) || 
                   rukishaData.error?.match(/ID[:\s]+(\d+)/)
    
    if (idMatch && idMatch[1]) {
      const existingCustomerId = idMatch[1]
      
      // Store the existing customer ID
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ 
          customer_id: existingCustomerId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (profileError) {
        console.error('Error updating profile with existing customer ID:', profileError)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          customer_id: existingCustomerId,
          message: 'Customer already registered with Rukisha. Account linked successfully.',
          is_existing: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    // If we can't extract the ID, inform user to contact support
    return new Response(
      JSON.stringify({ 
        error: 'You are already registered with Rukisha. Please contact support with your phone number to link your account.',
        contact: 'support@getdeals.co.ke',
        phone: phone
      }),
      { 
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
  
  // Other errors
  console.error('Rukisha API error:', rukishaData)
  return new Response(
    JSON.stringify({ 
      error: rukishaData.error || rukishaData.message || 'Failed to register with Rukisha',
      details: rukishaData
    }),
    { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
```

3. **Add User Notice in Wallet Page**:

```tsx
// File: src/pages/WalletPage.tsx or KYC component
// Add this banner at the top

{!profile?.customer_id && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
      <div>
        <h3 className="font-semibold text-yellow-900">KYC Registration Required</h3>
        <p className="text-sm text-yellow-800 mt-1">
          To make deposits and use your wallet, you need to complete KYC registration.
          If you've registered before, this will link your existing Rukisha account.
        </p>
        <Button 
          onClick={() => setShowKycModal(true)}
          className="mt-3"
          size="sm"
        >
          Complete KYC Now
        </Button>
      </div>
    </div>
  </div>
)}
```

---

### Solution 2: Manual Admin Mapping (For Special Cases)

**Use this for VIP users or support tickets:**

1. **Get User's Phone Number** from database
2. **Contact Rukisha Support** with:
   - Phone number: `+254XXXXXXXXX`
   - Request: "Please provide customer ID for this phone number"
3. **Rukisha Provides ID**: e.g., `7892`
4. **Manually Update Database**:

```sql
-- Update specific user with Rukisha-provided ID
UPDATE profiles
SET 
  customer_id = '7892',  -- Replace with actual Rukisha ID
  updated_at = NOW()
WHERE phone = '+254XXXXXXXXX';  -- User's phone number

-- Verify update
SELECT id, email, phone, customer_id 
FROM profiles 
WHERE phone = '+254XXXXXXXXX';
```

---

### Solution 3: Detect and Handle During First Deposit Attempt

**Add retry logic with KYC prompt:**

```typescript
// File: supabase/functions/deposit-funds/index.ts
// Add before making Rukisha API call (around line 215)

// Check if customer_id looks invalid
if (!profile.customer_id || profile.customer_id.startsWith('customer_')) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'KYC_REQUIRED',
      message: 'Please complete KYC registration first to enable deposits.',
      action: 'REDIRECT_TO_KYC',
      details: 'Your wallet account needs to be linked with Rukisha payment provider.'
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
```

Then in the frontend:

```typescript
// File: src/contexts/WalletContext.tsx or deposit handler
if (error?.error === 'KYC_REQUIRED') {
  toast({
    title: 'KYC Required',
    description: 'Please complete KYC to enable deposits',
    variant: 'warning'
  })
  
  // Redirect to KYC page
  navigate('/wallet/kyc')
  return
}
```

---

## 📊 Identifying Affected Users

**Query to find users with fake customer IDs:**

```sql
-- Find all users with invalid customer_ids
SELECT 
  p.id,
  p.email,
  p.phone,
  p.customer_id,
  p.first_name,
  p.last_name,
  p.created_at,
  COUNT(wt.id) as transaction_count
FROM profiles p
LEFT JOIN wallet_transactions wt ON wt.user_id = p.id
WHERE p.customer_id LIKE 'customer_%'
GROUP BY p.id, p.email, p.phone, p.customer_id, p.first_name, p.last_name, p.created_at
ORDER BY transaction_count DESC, p.created_at DESC;
```

**Export for notification:**

```sql
-- Export user emails for notification campaign
SELECT 
  email,
  first_name,
  last_name,
  phone
FROM profiles
WHERE customer_id LIKE 'customer_%'
  AND email IS NOT NULL
ORDER BY created_at DESC;
```

---

## 📧 User Communication Template

**Email Subject:** Action Required: Update Your GetDeals Wallet

**Email Body:**

```
Dear [First Name],

We recently made improvements to our wallet system to enhance security and reliability.

ACTION REQUIRED:
To continue using your GetDeals Wallet for deposits and payments, please complete a quick verification:

1. Log in to your GetDeals account
2. Go to Wallet → KYC Tab
3. Fill in your details (this takes less than 2 minutes)

If you've previously registered with Rukisha, we'll automatically link your existing account.

WHY THIS IS NEEDED:
We're integrating directly with Rukisha payment provider for better security and faster transactions.

QUESTIONS?
Contact us at support@getdeals.co.ke or WhatsApp: +254XXX XXX XXX

Thank you for your patience!
The GetDeals Team
```

---

## 🔍 Monitoring & Verification

**After cleanup, monitor these metrics:**

```sql
-- Daily monitoring query
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_profiles,
  COUNT(customer_id) as profiles_with_rukisha_id,
  ROUND(COUNT(customer_id)::numeric / COUNT(*)::numeric * 100, 2) as kyc_completion_rate
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Check deposit success rate:**

```sql
-- Monitor deposit attempts and success
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_deposits,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as success_rate
FROM wallet_transactions
WHERE transaction_type = 'deposit'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ⚠️ Important Notes

1. **Cannot Auto-Migrate**: No way to automatically retrieve existing Rukisha IDs
2. **User Action Required**: All affected users must complete KYC again
3. **No Data Loss**: Transaction history and balances are preserved
4. **One-Time Process**: Once fixed, future users won't have this issue
5. **Rukisha Contact**: For bulk migration, contact Rukisha support directly

---

## 🎯 Recommended Implementation Order

1. ✅ **Update register-customer function** (handle existing customers)
2. ✅ **Add KYC validation to deposit function** (prevent invalid attempts)
3. ✅ **Add user notices in UI** (inform users about KYC requirement)
4. ✅ **Run database cleanup** (clear fake customer_ids)
5. ✅ **Send notification emails** (inform affected users)
6. ✅ **Monitor metrics** (track KYC completion and deposit success)
7. ✅ **Provide support** (help users who have issues)

---

## 📞 Rukisha Support Contact

**For bulk customer ID retrieval:**

Contact: support@rukisha.com
Request: "Bulk customer ID lookup by phone numbers"
Provide: List of phone numbers from your users
Format: CSV with columns: `phone, email, name`

They may be able to provide a spreadsheet with:
```csv
phone,customer_id
+254712345678,7892
+254723456789,7893
```

Then you can bulk update:

```sql
-- Create temp table
CREATE TEMP TABLE rukisha_ids (
  phone TEXT,
  customer_id TEXT
);

-- Load CSV data (use Supabase dashboard or psql)
-- Then update profiles
UPDATE profiles p
SET customer_id = r.customer_id
FROM rukisha_ids r
WHERE p.phone = r.phone;
```

---

## ✅ Success Criteria

- [ ] All fake customer_ids cleared from database
- [ ] Register-customer function handles existing users
- [ ] Deposit function validates customer_id before API call
- [ ] UI shows clear KYC prompts for users without customer_id
- [ ] 90%+ of active users complete KYC re-registration
- [ ] Deposit success rate returns to normal levels
- [ ] No more "invalid client ID" errors in logs

---

## 📝 Related Files

- `supabase/functions/register-customer/index.ts` - KYC registration
- `supabase/functions/deposit-funds/index.ts` - Deposit validation
- `src/contexts/AuthContext.tsx` - Profile creation (already fixed)
- `fix-customer-id-format.sql` - Database cleanup script
- `CUSTOMER_ID_FIX.md` - Technical fix documentation
