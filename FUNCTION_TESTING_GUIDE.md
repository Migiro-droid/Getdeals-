# Test Rukisha Edge Function

## 🔧 Fix SSL/Domain Issue

The function was deployed but the URL shown in the dashboard (`auth.getdeals.co.ke`) appears to be a custom domain with SSL issues.

### ✅ **Correct Function URL:**
```
https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/register-customer
```

### ⚠️ **Problematic URL (ignore this):**
```
https://auth.getdeals.co.ke/functions/v1/register-customer
```

## 🧪 **Test the Function**

### **Step 1: Check Function Accessibility**

Open this URL in your browser to test if the function is accessible:
```
https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/register-customer
```

**Expected Response:** Should return a CORS-related error or "Unauthorized" (this is normal for GET requests)

### **Step 2: Test via Frontend**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Test the integration:**
   - Go to: http://localhost:8080/wallet
   - Click "Start KYC Verification"
   - Fill out the form
   - Submit and check browser console for any errors

### **Step 3: Set Environment Variables in Supabase**

Make sure these are set in your Supabase Dashboard → Settings → Edge Functions:

```
RUKISHA_API_URL=https://api.rukisha.com/api/tap-and-go
RUKISHA_API_TOKEN=your_actual_rukisha_token_here
RUKISHA_AGENT_ID=110
```

## 🐛 **Debugging Steps**

### **1. Check Function Logs**
- Go to: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/functions
- Click on `register-customer` function
- Check **Logs** tab for any errors

### **2. Check Frontend Integration**

I've disabled test mode (`VITE_TEST_MODE="false"`), so the app will now call the real edge function.

### **3. Verify Database Schema**

Run this SQL in Supabase SQL Editor to ensure tables exist:

```sql
-- Check if profiles table has customer_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check if wallets table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND table_schema = 'public';
```

## 🎯 **Expected Behavior**

With the edge function deployed and test mode disabled:

1. **Form Submission** → Calls real edge function
2. **Edge Function** → Calls Rukisha API (or shows config error if tokens not set)
3. **Success** → Wallet activated instantly
4. **Failure** → Clear error message

## 🔄 **Fallback: Re-enable Test Mode**

If you want to test the UI flow while fixing the edge function:

```bash
# In .env file
VITE_TEST_MODE="true"
```

This will simulate the Rukisha integration locally for testing purposes.

## 📞 **Next Actions**

1. **Test the correct URL** in browser
2. **Check Supabase function logs** for errors
3. **Set Rukisha API credentials** in Supabase
4. **Test the frontend integration**

The function is deployed correctly - we just need to ensure the right URL is being used and environment variables are configured!