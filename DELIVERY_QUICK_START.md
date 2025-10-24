# Quick Start Guide - Leta Delivery Integration

Get the delivery system up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 16+ or Bun installed
- ✅ Supabase project created
- ✅ Leta API beta credentials
- ✅ Git repository cloned

---

## Step 1: Environment Setup (2 min)

### Update your `.env` file

```env
# Leta API Configuration
VITE_LETA_API_URL=https://sandbox.integrations.leta.ai
VITE_LETA_TOKEN=your_beta_token_here

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Server Configuration
PORT=3001
VITE_API_URL=http://localhost:3001

# Frontend
VITE_FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## Step 2: Database Migration (1 min)

### Execute migration in Supabase

**Option A: Via Supabase Console**
1. Go to SQL Editor
2. Create new query
3. Copy contents of `supabase/migrations/add_leta_columns.sql`
4. Paste and execute

**Option B: Via Command Line**
```bash
# Get your database connection string from Supabase
psql $SUPABASE_CONNECTION_STRING < supabase/migrations/add_leta_columns.sql
```

✅ You should see "Migration applied successfully"

---

## Step 3: Install Dependencies (1 min)

```bash
# If using npm
npm install

# If using Bun
bun install
```

---

## Step 4: Start the Application (1 min)

### Start Backend Server
```bash
# Terminal 1
npm run dev
# or
bun run dev
```

Output should show:
```
🚀 Server running on port 3001
✅ WebSocket server ready
✅ Socket.io connected
```

### Start Frontend Development Server
```bash
# Terminal 2
npm run dev
# or
bun run dev
```

Output should show:
```
VITE v4.x.x building for development...
ready in xxx ms
```

---

## Step 5: Test the Integration (1 min)

### Test via Postman

**1. Check Shipping Cost**
```
POST http://localhost:3001/api/delivery/shipping-cost
Content-Type: application/json

{
  "latitude": -1.2860273,
  "longitude": 36.8079678
}
```

Expected: `{ "success": true, "data": { "shippingCost": 300 } }`

**2. Check Driver Availability**
```
POST http://localhost:3001/api/delivery/check-availability
Content-Type: application/json

{
  "latitude": -1.2860273,
  "longitude": 36.8079678
}
```

Expected: `{ "success": true, "data": { "driversAvailable": true } }`

### Test via Browser

1. Go to http://localhost:5173
2. Add items to cart
3. Click checkout
4. Select "Speedy Delivery"
5. Enter delivery address with coordinates:
   - Latitude: -1.2860273
   - Longitude: 36.8079678
6. Click "Check Delivery"
7. Should show shipping cost: **KES 300**

---

## Verification Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend running on port 5173
- [ ] Shipping cost endpoint returns 300 KES
- [ ] Driver availability shows available drivers
- [ ] Database migration executed without errors
- [ ] Environment variables loaded correctly
- [ ] No TypeScript errors in console
- [ ] Order creates successfully

---

## Common Issues & Solutions

### "Cannot find module 'express'"
```bash
npm install express socket.io cors body-parser
```

### "VITE_LETA_TOKEN not found"
- Add `VITE_LETA_TOKEN=your_token` to `.env`
- Restart dev server

### "Supabase connection failed"
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check internet connection
- Ensure Supabase project is active

### "WebSocket connection failed"
- Ensure backend server is running on port 3001
- Check firewall isn't blocking WebSocket
- Try hard refresh: `Ctrl+Shift+R`

### "Migration error: column already exists"
- Migration already applied (safe to ignore)
- Or manually check columns with:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

---

## Next: Deploy to Production

Once verified locally:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Leta delivery integration"
   git push origin leta-delivery
   ```

2. **Deploy Backend** (Vercel, Railway, Render)
   - Set environment variables in production
   - Deploy to your hosting platform
   - Test endpoints

3. **Deploy Frontend** (Vercel, Netlify)
   - Set production environment variables
   - Deploy to your hosting platform
   - Verify checkout flow

4. **Configure Webhook**
   - Go to Leta dashboard
   - Settings → Webhooks
   - Add: `https://your-domain.com/api/delivery/webhook`
   - Save and test

5. **Monitor & Test**
   - Place real test orders
   - Track via OrderTracking page
   - Monitor webhook logs
   - Check error logs

---

## Quick Debugging

### View logs
```bash
# Backend logs (Terminal 1)
# Should show:
# - POST /api/delivery/shipping-cost
# - WebSocket connection received
# - Webhook processed

# Frontend console (Browser F12)
# Should show:
# - WebSocket connected
# - Order status updates
```

### Check database
```sql
-- View orders with Leta details
SELECT id, order_reference, leta_order_id, leta_status, rider_name 
FROM orders 
WHERE leta_order_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- View webhook logs
SELECT order_id, event_type, status, processed 
FROM leta_webhook_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Test specific endpoint
```bash
curl -v -X POST http://localhost:3001/api/delivery/shipping-cost \
  -H "Content-Type: application/json" \
  -d '{"latitude": -1.286, "longitude": 36.808}'
```

---

## Files Created/Modified

### New Files
- ✅ `src/pages/OrderTracking.tsx` - Tracking page with WebSocket
- ✅ `src/routes/delivery.routes.ts` - API endpoints
- ✅ `supabase/migrations/add_leta_columns.sql` - Database schema
- ✅ `LETA_IMPLEMENTATION_GUIDE.md` - Complete guide
- ✅ `DELIVERY_API_INTEGRATION.md` - API docs
- ✅ `IMPLEMENTATION_COMPLETE.md` - Full summary

### Modified Files
- ✅ `src/pages/CheckoutPage.tsx` - Integration ready
- ✅ `.env` - Added Leta configuration

---

## Key Commands

```bash
# Start development
npm run dev

# Run tests (if available)
npm run test

# Build for production
npm run build

# Deploy
vercel deploy
# or
netlify deploy

# View logs
npm run logs

# Database reset (careful!)
npm run db:reset
```

---

## Next Steps

After verification:

1. **Read Full Documentation**
   - Open `IMPLEMENTATION_COMPLETE.md`
   - Read `DELIVERY_API_INTEGRATION.md`
   - Review `LETA_IMPLEMENTATION_GUIDE.md`

2. **Run Integration Tests**
   - Test full checkout flow
   - Simulate order creation
   - Test webhook processing
   - Verify real-time updates

3. **User Acceptance Testing**
   - Have team place test orders
   - Verify tracking works
   - Test driver assignment
   - Check delivery completion

4. **Production Deployment**
   - Configure production environment
   - Deploy backend server
   - Deploy frontend app
   - Setup monitoring & alerts

5. **Go Live**
   - Enable delivery option
   - Monitor orders & metrics
   - Support customer inquiries
   - Iterate based on feedback

---

## Support

- **Problems?** Check `IMPLEMENTATION_COMPLETE.md` Troubleshooting section
- **API Questions?** See `DELIVERY_API_INTEGRATION.md`
- **Setup Issues?** Review `LETA_IMPLEMENTATION_GUIDE.md`
- **Need Help?** Contact: support@getdeals.co.ke

---

**You're all set! 🚀 Your delivery system is ready to go live!**
