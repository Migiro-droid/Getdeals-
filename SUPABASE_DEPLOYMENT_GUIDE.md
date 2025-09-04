# Supabase "Red Umbrella" Project Setup for Vercel Deployment

This guide will help you connect your GetDeals Kenya project to the Supabase "red-umbrella" project and deploy it on Vercel.

## 🎯 Project Configuration Summary

- **Supabase Project ID**: `fxyifnckgllxqbggegtw`
- **Supabase URL**: `https://fxyifnckgllxqbggegtw.supabase.co`
- **Project Name**: red-umbrella
- **Database Password**: `qTlMZykc5pvN1MKR`

## ✅ Step 1: Environment Variables Verification

Your `.env` file has been updated with the correct red-umbrella project credentials:

```bash
# Supabase red-umbrella project connection pooling
DATABASE_URL="postgres://postgres.fxyifnckgllxqbggegtw:qTlMZykc5pvN1MKR@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgres://postgres.fxyifnckgllxqbggegtw:qTlMZykc5pvN1MKR@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase red-umbrella project configuration
SUPABASE_URL="https://fxyifnckgllxqbggegtw.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU"

# Frontend environment variables
NEXT_PUBLIC_SUPABASE_URL="https://fxyifnckgllxqbggegtw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE"
```

## 🗄️ Step 2: Database Schema Setup

**IMPORTANT**: The database schema needs to be created manually in Supabase.

### Manual Schema Creation:

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw
   - Navigate to **SQL Editor**

2. **Execute the Schema Script**:
   - Copy the entire content from `scripts/supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify Schema Creation**:
   - Check that tables are created in the **Database** → **Tables** section
   - You should see: `products`, `users`, `orders`, `order_items`, `addresses`, `payments`, `categories`

## 📊 Step 3: Data Seeding

After the schema is created, seed the product data:

```bash
npm run tsx scripts/setup-red-umbrella.ts
```

This will:
- Verify the database connection
- Seed 49 products from your local data
- Confirm the setup

## 🚀 Step 4: Vercel Deployment Setup

### 4.1 Environment Variables for Vercel

Set these environment variables in your Vercel project dashboard:

```bash
# Database connections
DATABASE_URL=postgres://postgres.fxyifnckgllxqbggegtw:qTlMZykc5pvN1MKR@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.fxyifnckgllxqbggegtw:qTlMZykc5pvN1MKR@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require

# Supabase configuration
SUPABASE_URL=https://fxyifnckgllxqbggegtw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE

# Frontend environment variables
NEXT_PUBLIC_SUPABASE_URL=https://fxyifnckgllxqbggegtw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE
```

### 4.2 Vercel Configuration

Your `vercel.json` is already configured correctly:

```json
{
  "version": 2,
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.2.26"
    }
  },
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🧪 Step 5: Testing the Setup

### 5.1 Local Testing

Test the API endpoints locally:

```bash
npm run dev
```

Test these endpoints:
- `GET /api/health` - Health check
- `GET /api/products` - Get all products
- `GET /api/users` - Get all users
- `GET /api/orders` - Get all orders

### 5.2 Production Testing

After deploying to Vercel, test:
- `https://your-vercel-app.vercel.app/api/health`
- `https://your-vercel-app.vercel.app/api/products`

## 🔧 Troubleshooting

### Common Issues:

1. **"Could not find the table 'public.products'"**
   - Solution: Execute the schema SQL script in Supabase SQL Editor

2. **"Connection failed"**
   - Verify environment variables are correctly set
   - Check Supabase project status

3. **"Permission denied"**
   - Verify RLS policies are correctly configured
   - Check that service role key has proper permissions

### Verification Scripts:

Run these to verify your setup:

```bash
# Verify connection
npx tsx scripts/verify-supabase-connection.ts

# Check database status
npx tsx scripts/setup-red-umbrella.ts
```

## 📋 Deployment Checklist

- [ ] Environment variables updated in `.env`
- [ ] Supabase config.toml updated to red-umbrella project
- [ ] Database schema created via SQL Editor
- [ ] Product data seeded successfully
- [ ] Vercel environment variables configured
- [ ] API endpoints tested locally
- [ ] Production deployment verified

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Connection Test**: ✅ Successfully connected to Supabase
2. **Schema Verification**: ✅ All required tables exist
3. **Data Seeding**: ✅ 49 products seeded successfully
4. **API Health Check**: ✅ Returns database: 'supabase'
5. **Products API**: ✅ Returns product list from Supabase

## 🔐 Security Notes

- Service role key is used for server-side operations only
- Anon key is safe for client-side use
- RLS policies protect user data
- All passwords and keys are securely stored in environment variables

## 📞 Support

If you encounter any issues:

1. Check the Supabase Dashboard for error logs
2. Verify all environment variables are correctly set
3. Ensure the schema was properly created
4. Test the connection using the verification scripts

Project is now ready for production deployment on Vercel with Supabase "red-umbrella" backend! 🚀
