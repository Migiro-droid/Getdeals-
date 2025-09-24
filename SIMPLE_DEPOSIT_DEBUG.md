# 🚨 SIMPLE DEPOSIT DEBUGGING GUIDE

Since you're getting "Deposit Failed" errors, let's debug this step by step using browser tools.

## 🔧 **Method 1: Browser Network Tab (Recommended)**

1. **Open your wallet page**
2. **Press F12** → **Network tab**
3. **Clear the network log** (clear button)
4. **Try to make a deposit** (any amount)
5. **Look for failed requests** (red entries)

### What to Look For:

**✅ Successful Flow:**
- `deposit-funds` request → Status 200
- Response shows `"success": true`

**❌ Failed Flow - Check These:**
- `deposit-funds` request → Status 400/500
- Response contains error message
- `profiles` request → Status 400 (organization error)
- Auth requests failing

## 🔧 **Method 2: Console Errors**

1. **Press F12** → **Console tab**
2. **Clear console**
3. **Try deposit**
4. **Check for red error messages**

### Common Error Patterns:

```
❌ "organization column not found" → Database migration needed
❌ "customer_id missing" → KYC verification incomplete  
❌ "unauthorized" → Login issue
❌ "Network error" → Connection problem
❌ "Profile lookup failed" → Database access issue
```

## 🔧 **Method 3: Manual Test (Without Diagnosis Tool)**

Since the Supabase client isn't globally accessible, try this:

1. **Go to wallet page and login**
2. **Open browser console (F12 → Console)**
3. **Run this simple test:**

```javascript
// Simple deposit test - paste this in console
console.log('🧪 Testing deposit manually...');

// Check if you can access any global objects
console.log('Available globals:', Object.keys(window).filter(k => k.includes('supabase') || k.includes('Supabase')));

// Try to trigger a deposit through the UI and watch network tab
console.log('👆 Now try clicking deposit button and watch Network tab for failed requests');
```

## 🎯 **Quick Fixes Based on Schema Info**

Since your database now has the organization column, the most likely issues are:

### **1. Missing Customer ID (Most Likely)**
**Symptoms:** Deposit fails with customer_id error
**Fix:** Complete KYC verification:
- Go to wallet page
- Look for "Start KYC Verification" button
- Fill out all fields completely
- Submit form

### **2. Session/Auth Issues**  
**Symptoms:** Unauthorized errors
**Fix:** 
- Log out completely
- Clear browser cache
- Log back in
- Try deposit again

### **3. Edge Function Not Deployed**
**Symptoms:** Function not found errors
**Fix:** Check Supabase Dashboard → Edge Functions

## 🔍 **What to Report Back**

After trying the Network tab method, tell me:

1. **What status code** does the `deposit-funds` request show? (200, 400, 500, etc.)
2. **What error message** appears in the response?
3. **Are there any red Console errors** when you try to deposit?

This will help me identify the exact issue and provide a specific fix!

## 🚀 **Expected Working Flow**

When deposits work properly:
1. Enter amount → Click deposit
2. Network shows `deposit-funds` → Status 200
3. Response: `{"success": true, "transaction_id": "..."}`
4. Toast: "STK Push Sent!"
5. M-Pesa prompt on phone