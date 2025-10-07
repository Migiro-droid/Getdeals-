# 🚀 Vercel Environment Variables Setup - Phase 2

**Status**: ⚠️ ACTION REQUIRED  
**Issue**: Missing Supabase credentials in Vercel  
**Error**: `Server configuration error: Missing Supabase credentials`

---

## ⚠️ Current Problem

The admin user creation API is now accessible (404 fixed! ✅), but it's missing required environment variables in Vercel:

```json
{
  "success": false,
  "error": "Server configuration error: Missing Supabase credentials"
}
```

---

## 📋 Required Environment Variables

You need to add these 2 **critical** environment variables to Vercel:

### 1. VITE_SUPABASE_URL
```
The URL of your Supabase project
Example: https://fxyifnckgllxqbggegtw.supabase.co
```

### 2. VITE_SUPABASE_SERVICE_ROLE_KEY
```
The service role key from Supabase (has admin privileges)
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. SMTP Variables (Already set, but verify)
```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=96f049001@smtp-brevo.com
SMTP_PASS=1pSFOdRY5VIA9H8N
SMTP_FROM=GetDeals Admin <info@getdeals.co.ke>
```

---

## 🔍 Where to Find These Values

### Option 1: From Your Local .env File

Check your local `.env` file in the project root:

```bash
# Look for these lines in your .env file:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Copy the values** (everything after the `=` sign)

### Option 2: From Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: **getdeals** or **getdeals-kenya**
3. Click: **Settings** (left sidebar, gear icon)
4. Click: **API**
5. Find these values:

```
Project URL:      VITE_SUPABASE_URL
                  (Copy the full URL)

anon public:      (Not needed for this fix)

service_role:     VITE_SUPABASE_SERVICE_ROLE_KEY
                  (Click "Reveal" then copy)
                  ⚠️ Keep this SECRET - has admin access!
```

---

## 🛠️ How to Add to Vercel

### Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Your Project**
   - Click on: **getdeals-kenya-showcase**

3. **Open Settings**
   - Click: **Settings** tab (top navigation)

4. **Go to Environment Variables**
   - Click: **Environment Variables** (left sidebar)

5. **Add First Variable: VITE_SUPABASE_URL**
   - Click: **Add New** button
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Paste your Supabase URL (e.g., `https://fxyifnckgllxqbggegtw.supabase.co`)
   - **Environments**: Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click: **Save**

6. **Add Second Variable: VITE_SUPABASE_SERVICE_ROLE_KEY**
   - Click: **Add New** button again
   - **Key**: `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Paste your service role key (starts with `eyJhbGc...`)
   - **Environments**: Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click: **Save**

7. **Verify SMTP Variables (Should already exist)**
   - Scroll through the list
   - Check these exist:
     - `SMTP_HOST`
     - `SMTP_PORT`
     - `SMTP_USER`
     - `SMTP_PASS`
     - `SMTP_FROM`
   - If missing, add them using values from earlier in this document

---

## 🔄 Redeploy After Adding Variables

**Important**: Environment variables only take effect after redeployment!

### Option 1: Automatic (Recommended)
Wait 2-3 minutes - Vercel will auto-deploy when it detects the changes.

### Option 2: Manual Redeploy
1. Go to: **Deployments** tab
2. Find the latest deployment
3. Click: **...** (three dots menu)
4. Click: **Redeploy**
5. Confirm: Click **Redeploy** in the modal

---

## ✅ How to Verify It Works

### Step 1: Wait for Deployment
Check Vercel deployments page - wait until status shows **"Ready"** (green checkmark)

### Step 2: Test Admin User Creation
1. Go to: https://getdeals.co.ke/admin/users
2. Click: **"Add Admin User"** button
3. Fill in:
   - Name: Test Admin
   - Email: your-test-email@example.com
   - Role: Staff
4. Click: **"Create"**

### Step 3: Expected Results ✅
- ✅ Success toast: "Admin user created! Credentials sent to..."
- ✅ Email delivered to the address you entered
- ✅ User appears in the admin users table
- ✅ No errors in browser console

### Step 4: If Still Not Working
Check browser console (F12) for errors. Should see:
```
✅ Creating admin user with authentication...
✅ Admin user created: { userId: "...", ... }
✅ Sending credentials email...
```

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials" (still appearing)

**Cause**: Environment variables not loaded yet

**Solution**:
1. Verify variables are added in Vercel (Settings → Environment Variables)
2. Check they're applied to **Production** environment
3. Wait for redeployment to complete
4. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
5. Try creating user again

### Error: "Invalid Supabase URL"

**Cause**: Wrong URL format

**Solution**:
- URL must start with `https://`
- URL must end with `.supabase.co`
- Example: `https://fxyifnckgllxqbggegtw.supabase.co`
- NO trailing slash

### Error: "Authentication failed"

**Cause**: Wrong service role key

**Solution**:
1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (click "Reveal")
3. Update in Vercel (Settings → Environment Variables)
4. Click the variable → Edit → Update value → Save
5. Redeploy

### Error: "User already exists"

**Cause**: Email already registered

**Solution**:
- Use a different email address, OR
- Delete existing user from Supabase Dashboard → Authentication → Users

---

## 🔒 Security Notes

### ⚠️ Service Role Key is POWERFUL
- Has **full admin access** to your database
- Can bypass Row Level Security (RLS)
- Can create/read/update/delete any data
- **NEVER** commit to Git
- **NEVER** share publicly
- Only use in secure server environments (like Vercel)

### ✅ Safe Usage
- ✅ Store in Vercel environment variables
- ✅ Use only in API routes (server-side)
- ✅ Never send to browser/client
- ✅ Rotate if accidentally exposed

---

## 📊 Environment Variables Checklist

After setup, you should have these in Vercel:

### Supabase (NEW - Required for Phase 2)
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)

### SMTP (Already configured)
- [ ] `SMTP_HOST` - smtp-relay.brevo.com
- [ ] `SMTP_PORT` - 587
- [ ] `SMTP_USER` - Your Brevo username
- [ ] `SMTP_PASS` - Your Brevo password
- [ ] `SMTP_FROM` - GetDeals Admin <info@getdeals.co.ke>

### Optional (May already exist)
- [ ] `VITE_SUPABASE_ANON_KEY` - Public anon key (for client-side)
- [ ] Other project-specific variables

---

## 🎯 Quick Reference

### Environment Variable Format
```bash
# Correct format in Vercel:
Key:   VITE_SUPABASE_URL
Value: https://fxyifnckgllxqbggegtw.supabase.co

Key:   VITE_SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
```

### Where Each Variable is Used
```typescript
// api/admin/create-admin-user.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;           // ← ADD THIS
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // ← ADD THIS

// api/admin/send-credentials.ts
const smtpHost = process.env.SMTP_HOST;     // ← Already set
const smtpPort = process.env.SMTP_PORT;     // ← Already set
// ... etc
```

---

## 📞 Need Help?

### Check These First
1. **Vercel Deployment Logs**
   - Dashboard → Deployments → Latest → View Function Logs
   - Look for errors in `create-admin-user` function

2. **Browser Console**
   - F12 → Console tab
   - Look for API request/response details
   - Check Network tab for HTTP status codes

3. **Supabase Dashboard**
   - Authentication → Users (verify user creation)
   - API Settings (verify keys are correct)

### Common Issues
- ❌ Variables not applied to Production environment
- ❌ Typo in variable key name (must match exactly)
- ❌ Trailing spaces in variable values
- ❌ Wrong Supabase project selected
- ❌ Deployment not completed yet

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ No "Missing Supabase credentials" error
2. ✅ Admin user creation succeeds
3. ✅ User appears in Supabase Auth
4. ✅ User profile created in database
5. ✅ Email sent with credentials
6. ✅ User can login with credentials
7. ✅ No console errors

---

## 🎊 Final Steps

After adding environment variables:

1. **Add Variables to Vercel** ← YOU ARE HERE
2. **Wait for Redeployment** (2-3 minutes)
3. **Test Admin User Creation**
4. **Verify Email Delivery**
5. **Test User Login**
6. **Celebrate** 🎉

---

**Next Step**: Add the 2 Supabase environment variables to Vercel now!  
**Time Required**: 5 minutes  
**Priority**: 🔴 CRITICAL - Required for Phase 2 to work

Once variables are added, the admin user creation system will work perfectly! 🚀
