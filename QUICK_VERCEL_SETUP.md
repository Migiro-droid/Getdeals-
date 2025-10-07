# 📋 Copy-Paste Reference for Vercel Environment Variables

**Action Required**: Add these to Vercel Dashboard  
**Location**: Vercel Dashboard → Settings → Environment Variables

---

## ✅ Copy These Exact Values

### 1. VITE_SUPABASE_URL
```
Key:   VITE_SUPABASE_URL
Value: https://fxyifnckgllxqbggegtw.supabase.co
```

### 2. VITE_SUPABASE_SERVICE_ROLE_KEY
```
Key:   VITE_SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU
```

---

## 🛠️ How to Add (Step-by-Step)

### Step 1: Open Vercel
1. Go to: https://vercel.com/dashboard
2. Click: **getdeals-kenya-showcase** project

### Step 2: Go to Environment Variables
1. Click: **Settings** (top tab)
2. Click: **Environment Variables** (left sidebar)

### Step 3: Add VITE_SUPABASE_URL
1. Click: **Add New** button
2. **Name**: `VITE_SUPABASE_URL`
3. **Value**: `https://fxyifnckgllxqbggegtw.supabase.co`
4. **Select Environments**:
   - ✅ Check **Production**
   - ✅ Check **Preview**
   - ✅ Check **Development**
5. Click: **Save**

### Step 4: Add VITE_SUPABASE_SERVICE_ROLE_KEY
1. Click: **Add New** button again
2. **Name**: `VITE_SUPABASE_SERVICE_ROLE_KEY`
3. **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU`
4. **Select Environments**:
   - ✅ Check **Production**
   - ✅ Check **Preview**
   - ✅ Check **Development**
5. Click: **Save**

### Step 5: Verify SMTP Variables (Should Already Exist)

Check these exist in the list:
- ✅ `SMTP_HOST` = smtp-relay.brevo.com
- ✅ `SMTP_PORT` = 587
- ✅ `SMTP_USER` = 96f049001@smtp-brevo.com
- ✅ `SMTP_PASS` = 1pSFOdRY5VIA9H8N
- ✅ `SMTP_FROM` = GetDeals Admin <info@getdeals.co.ke>

If any are missing, add them using the same process.

---

## 🔄 After Adding Variables

### Wait for Automatic Redeployment
- Vercel will automatically redeploy (takes 2-3 minutes)
- Watch the **Deployments** tab
- Wait until status shows: **Ready** ✅

### Or Manually Trigger Redeploy
1. Go to: **Deployments** tab
2. Click: **...** menu on latest deployment
3. Click: **Redeploy**
4. Wait until status shows: **Ready** ✅

---

## ✅ Test It Works

Once deployment is **Ready**:

1. Go to: https://getdeals.co.ke/admin/users
2. Click: **Add Admin User**
3. Fill in test details
4. Click: **Create**
5. Expected: ✅ Success! User created and email sent

---

## 🎯 Quick Checklist

- [ ] Open Vercel Dashboard
- [ ] Go to Settings → Environment Variables
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_SERVICE_ROLE_KEY`
- [ ] Verify both applied to Production
- [ ] Wait for redeployment (2-3 min)
- [ ] Test admin user creation
- [ ] Success! 🎉

---

**Time Required**: 5 minutes  
**Difficulty**: Easy (just copy-paste!)  
**Impact**: Phase 2 will work immediately after this! 🚀
