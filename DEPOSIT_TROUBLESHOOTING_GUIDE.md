# 🚨 DEPOSIT FAILURE TROUBLESHOOTING GUIDE

## Quick Fix Checklist

If you're getting "Deposit Failed" errors, follow these steps in order:

### 1. ⚡ MOST LIKELY ISSUE: Database Schema Error

**Problem:** The organization column error (PGRST204) is probably blocking deposits.

**Fix:** Apply the database migration immediately:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to: **SQL Editor**
3. Create a new query and paste the entire contents of: `BULLETPROOF_ORGANIZATION_FIX.sql`
4. Click **RUN** to execute the migration
5. Refresh your application and try deposit again

### 2. 🔍 DIAGNOSIS: Use Browser Console

1. Open your wallet page in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Copy and paste the entire contents of `DEPOSIT_ERROR_DIAGNOSIS.js`
5. Press **Enter** to run the diagnosis
6. Follow the specific fix instructions shown

### 3. 📱 MANUAL DEPOSIT TEST

Try a small test deposit (KES 100) and check browser console for errors:

**Common Error Messages:**
- `"organization column not found"` → **Apply database migration**
- `"customer_id missing"` → **Complete KYC verification**
- `"unauthorized"` → **Log out and back in**
- `"network error"` → **Check internet connection**

### 4. 👤 USER PROFILE ISSUES

If diagnosis shows missing `customer_id`:

**Option A: Complete KYC Again**
1. Go to wallet page
2. Click "Start KYC Verification" if shown
3. Fill out all fields completely
4. Submit and try deposit

**Option B: Admin Setup (if you have admin access)**
1. Run: `node create-admin-profile.mjs`
2. Follow prompts to create admin account
3. Try deposit again

### 5. 🔧 EDGE FUNCTION ISSUES

If deposit function itself fails:

1. Check Supabase Dashboard → **Edge Functions**
2. Verify `deposit-funds` function is deployed
3. Check function logs for errors
4. Ensure environment variables are set:
   - `RUKISHA_API_TOKEN` (can be empty for dev mode)
   - `RUKISHA_API_URL`

## 🎯 Expected Behavior

**Successful Deposit Flow:**
1. Enter amount (minimum KES 100)
2. Enter phone number (Kenyan format)
3. Click "Deposit Funds"
4. See "STK Push Sent!" success message
5. Check phone for M-Pesa prompt

**Failure Indicators:**
- "Deposit Failed" toast notification
- Console errors mentioning "organization", "customer_id", or "auth"
- No STK push received on phone

## 🆘 If Nothing Works

1. **Check Network:** Ensure stable internet connection
2. **Clear Browser Cache:** Hard refresh with Ctrl+F5
3. **Try Different Browser:** Test in incognito/private mode
4. **Database Status:** Verify Supabase project is running
5. **Contact Support:** Provide browser console error logs

## 📊 Quick Status Check

Run in browser console on wallet page:
```javascript
// Quick status check
console.log('Auth:', await supabase.auth.getSession());
console.log('Profile:', await supabase.from('profiles').select('*').eq('user_id', (await supabase.auth.getUser()).data.user.id).single());
```

Most deposit failures are caused by the **organization column database error**. Apply the migration first!