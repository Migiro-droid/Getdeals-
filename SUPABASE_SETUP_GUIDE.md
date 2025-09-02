# Supabase Red Umbrella Project Setup Guide

## ✅ Current Status
- Environment variables are configured for the red-umbrella project (fxyifnckgllxqbggegtw)
- Supabase connection credentials are valid
- Schema SQL script is ready to execute

## 🚀 Next Steps to Complete Setup

### Step 1: Execute the Schema in Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects
2. Select the **red-umbrella** project (fxyifnckgllxqbggegtw)
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query and copy the entire contents of `scripts/supabase-schema.sql`
5. Click **Run** to execute the schema

The script will:
- ✅ Create all required tables (products, users, orders, etc.)
- ✅ Set up Row Level Security policies
- ✅ Create default categories
- ✅ Insert a test product to verify the setup

### Step 2: Verify Schema Creation

After running the schema script, you should see:
```
Schema created successfully! | product_count: 1
```

### Step 3: Seed Products Data

Run this command to populate your database with sample products:

```bash
npx tsx scripts/seed-products.ts
```

### Step 4: Test the Connection

Run the verification script to confirm everything is working:

```bash
npx tsx scripts/verify-supabase-connection.ts
```

You should see all green checkmarks! ✅

### Step 5: Deploy to Vercel

1. Go to your Vercel dashboard
2. Import your GitHub repository
3. Add these environment variables in Vercel:

```env
SUPABASE_URL=https://fxyifnckgllxqbggegtw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU
NEXT_PUBLIC_SUPABASE_URL=https://fxyifnckgllxqbggegtw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE
```

4. Deploy the project

### Step 6: Test Your Live API

Once deployed, test your API endpoints:

- **Health Check**: `https://your-vercel-app.vercel.app/api/health`
- **Products**: `https://your-vercel-app.vercel.app/api/products`
- **Seed Database**: `https://your-vercel-app.vercel.app/api/seed`

## 🔧 Troubleshooting

### If you get "table does not exist" errors:
- Make sure you executed the schema script in Supabase SQL Editor
- Check that all tables were created in the `public` schema

### If you get authentication errors:
- Verify your environment variables match exactly
- Make sure you're using the service role key (not anon key) for server-side operations

### If products aren't showing:
- Run the seed script: `npx tsx scripts/seed-products.ts`
- Check the products table in Supabase Table Editor

## 📊 Database Tables Created

1. **products** - Product catalog
2. **users** - User profiles  
3. **orders** - Customer orders
4. **order_items** - Order line items
5. **addresses** - Delivery addresses
6. **payments** - Payment records
7. **categories** - Product categories

## 🎯 Expected Results

After completing all steps:
- ✅ Database schema fully migrated to Supabase
- ✅ Sample products loaded
- ✅ API endpoints working on Vercel
- ✅ Frontend can connect to Supabase
- ✅ Orders and payments can be processed

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase logs in your dashboard
2. Verify environment variables are set correctly
3. Test the connection script again
4. Review this guide and ensure all steps were completed

---

**Ready to proceed? Start with Step 1: Execute the schema in Supabase SQL Editor!** 🚀
