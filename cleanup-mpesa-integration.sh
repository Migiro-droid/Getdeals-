#!/bin/bash

# M-Pesa Integration Cleanup Script for GetDeals Kenya
# This script removes redundant M-Pesa implementations to consolidate to Vercel Edge Functions

echo "🧹 Starting M-Pesa integration cleanup..."

# 1. Remove the mpesa-service microservice directory
echo "📁 Removing mpesa-service microservice..."
if [ -d "mpesa-service" ]; then
    rm -rf mpesa-service
    echo "✅ mpesa-service directory removed"
else
    echo "ℹ️  mpesa-service directory not found"
fi

# 2. Remove M-Pesa endpoints from server/index.js (will need manual editing)
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Remove the following M-Pesa endpoints from server/index.js:"
echo "   - POST /api/payments/mpesa/initiate"
echo "   - POST /api/payments/mpesa/stk-push"  
echo "   - POST /api/payments/mpesa/callback"
echo "   - GET /api/payments/mpesa/status/:checkoutRequestId"

# 3. Remove M-Pesa service files from server/lib
echo "📁 Removing server/lib/mpesa.js..."
if [ -f "server/lib/mpesa.js" ]; then
    rm server/lib/mpesa.js
    echo "✅ server/lib/mpesa.js removed"
else
    echo "ℹ️  server/lib/mpesa.js not found"
fi

# 4. Clean up old environment files
echo "🔧 Cleaning up environment configurations..."
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Move the following environment variables to Vercel Environment Variables:"
echo "   - MPESA_CONSUMER_KEY"
echo "   - MPESA_CONSUMER_SECRET"
echo "   - MPESA_PASSKEY"
echo "   - MPESA_SHORTCODE"
echo "   - MPESA_ENVIRONMENT"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"

# 5. Update frontend to use new API endpoints
echo "🔧 Frontend updates needed:"
echo "   Update frontend code to use:"
echo "   - POST /api/payments/mpesa/stk-push (instead of :3001 microservice)"
echo "   - Remove references to VITE_MPESA_SERVICE_URL"

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy to Vercel with environment variables configured"
echo "2. Update Safaricom Developer Portal with new callback URL:"
echo "   https://getdeals.co.ke/api/payments/mpesa/callback"
echo "3. Test the integration end-to-end"
echo "4. Remove the manual M-Pesa code from server/index.js"
echo ""
echo "🔗 New M-Pesa Endpoints:"
echo "   STK Push: https://getdeals.co.ke/api/payments/mpesa/stk-push"
echo "   Callback: https://getdeals.co.ke/api/payments/mpesa/callback"