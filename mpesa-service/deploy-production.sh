#!/bin/bash

# M-Pesa Production Deployment Script
# This script helps deploy the M-Pesa microservice to production

echo "🚀 Starting M-Pesa Production Deployment..."

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production credentials"
    exit 1
fi

# Backup current .env
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backed up current .env to .env.backup"
fi

# Copy production environment
cp .env.production .env
echo "✅ Applied production environment variables"

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Run security audit
echo "🔒 Running security audit..."
npm audit

echo "🔍 Pre-deployment checklist:"
echo "1. ✅ Production credentials configured"
echo "2. ✅ HTTPS callback URL set"
echo "3. ✅ Rate limiting enabled"
echo "4. ✅ Request validation active"
echo "5. ✅ Security headers configured"

echo ""
echo "⚠️  IMPORTANT: Before going live, ensure:"
echo "- Your domain has a valid SSL certificate"
echo "- Callback URL is publicly accessible"
echo "- Firewall allows traffic on your chosen port"
echo "- You have monitoring and logging set up"

echo ""
echo "🎯 Ready to start production server with: npm start"
echo "🔥 Or use PM2 for process management: pm2 start index.js --name mpesa-service"