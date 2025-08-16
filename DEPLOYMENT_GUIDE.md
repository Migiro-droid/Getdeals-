# GetDeals Kenya - Database Migration & Deployment Guide

This guide will help you migrate from the current file-based storage to PostgreSQL and deploy the complete platform with all new features.

## 🚀 Quick Start (Production Ready)

### 1. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not already installed)
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows: Download from https://www.postgresql.org/download/windows/

# Create database
sudo -u postgres createdb getdeals_kenya

# Run migration script
sudo -u postgres psql getdeals_kenya < server/database/setup_postgres.sql
```

**Option B: Cloud PostgreSQL (Recommended for Production)**
```bash
# Use services like:
# - Supabase (https://supabase.com/) - Free tier available
# - Railway (https://railway.app/) - Easy deployment
# - Digital Ocean Managed Databases
# - AWS RDS
# - Google Cloud SQL

# After creating your database, run:
psql "postgresql://username:password@host:port/dbname" < server/database/setup_postgres.sql
```

### 2. Environment Configuration

Create/update your `.env` file in the `server` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/getdeals_kenya"

# M-Pesa Configuration (Get from Safaricom Developer Portal)
MPESA_CONSUMER_KEY="your_consumer_key"
MPESA_CONSUMER_SECRET="your_consumer_secret"
MPESA_SHORTCODE="174379"  # Use your actual shortcode
MPESA_PASSKEY="your_passkey"
MPESA_ENVIRONMENT="sandbox"  # Change to "production" for live

# SMS Configuration (Africa's Talking)
AT_API_KEY="your_africas_talking_api_key"
AT_USERNAME="your_africas_talking_username"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"  # Use app password for Gmail

# Security
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
BCRYPT_ROUNDS="12"

# Server Configuration
PORT="3001"
NODE_ENV="production"

# Client URL (for CORS and callbacks)
CLIENT_URL="https://yourdomain.com"
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install additional packages for new features
npm install prisma @prisma/client bcryptjs jsonwebtoken cors helmet express-rate-limit

# Install client dependencies (if not already done)
cd ../
npm install
```

### 4. Database Migration (Prisma Setup)

```bash
cd server

# Initialize Prisma (if not already done)
npx prisma init

# Generate Prisma client
npx prisma generate

# Sync with existing database
npx prisma db pull

# Optional: Create and run additional migrations
npx prisma migrate dev --name init
```

### 5. Start the Application

**Development:**
```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend
cd ..
npm run dev
```

**Production:**
```bash
# Build the frontend
npm run build

# Start the backend (serves both API and static files)
cd server
npm start
```

## 🔧 Feature Configuration

### M-Pesa Payment Integration

1. **Get Safaricom Developer Account:**
   - Visit https://developer.safaricom.co.ke/
   - Create an account and new app
   - Get your Consumer Key, Consumer Secret, and Passkey

2. **Configure M-Pesa Settings:**
   ```javascript
   // In your environment variables
   MPESA_CONSUMER_KEY="your_key"
   MPESA_CONSUMER_SECRET="your_secret"
   MPESA_SHORTCODE="174379"  // Your business shortcode
   MPESA_PASSKEY="your_passkey"
   MPESA_ENVIRONMENT="sandbox"  // or "production"
   ```

3. **Test M-Pesa Integration:**
   - Use test phone numbers in sandbox: 254708374149, 254711XXXXXX
   - Default PIN for sandbox: 1234

### SMS Notifications (Africa's Talking)

1. **Setup Africa's Talking:**
   - Visit https://africastalking.com/
   - Create account and get API credentials
   - Add your API key and username to environment variables

2. **SMS Configuration:**
   ```javascript
   AT_API_KEY="your_api_key"
   AT_USERNAME="your_username"
   ```

### Email Notifications

1. **Gmail Configuration:**
   ```javascript
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT="587"
   EMAIL_USER="your-business-email@gmail.com"
   EMAIL_PASS="your-app-password"  // Generate in Google Account settings
   ```

2. **Other Email Providers:**
   - Outlook: smtp-mail.outlook.com:587
   - SendGrid: smtp.sendgrid.net:587
   - Mailgun: smtp.mailgun.org:587

## 📊 Admin Dashboard Features

### User Management Dashboard

Access at `/admin/users` after logging in as admin:

- **Customer Analytics:** View customer behavior, order history, spending patterns
- **Bulk Messaging:** Send SMS/Email to customers (all or selected)
- **Admin User Management:** Add staff, managers with different permissions
- **Customer Status Control:** Activate, deactivate, or block customers

### Enhanced Product Management

Access at `/admin/products`:

- **Basket Item Images:** Each item in a basket can have its own image
- **Enhanced Item Editor:** Drag-and-drop interface for managing basket contents
- **Inventory Integration:** Real-time stock levels and reorder alerts
- **Category Management:** Organize products by categories

### Payment & Order Management

- **M-Pesa Integration:** Real-time payment status tracking
- **Order Pipeline:** Visual order status progression
- **Customer Communication:** Automated SMS/Email notifications
- **Delivery Management:** Pickup points and speedy delivery tracking

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Prepare for deployment:**
   ```bash
   # Add railway.json to your project root
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "cd server && npm start",
       "healthcheckPath": "/api/health"
     }
   }
   ```

2. **Deploy:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway add --database postgresql
   railway deploy
   ```

### Option 2: Vercel + Supabase

1. **Frontend (Vercel):**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy frontend
   vercel --prod
   ```

2. **Backend (Vercel Functions) + Database (Supabase):**
   - Create Supabase project and get connection string
   - Deploy API routes as Vercel functions
   - Configure environment variables in Vercel dashboard

### Option 3: Traditional VPS (DigitalOcean, Linode, etc.)

1. **Server Setup:**
   ```bash
   # Update server
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib

   # Install PM2 for process management
   sudo npm install -g pm2

   # Setup firewall
   sudo ufw allow 22 80 443 5432
   sudo ufw enable
   ```

2. **Application Deployment:**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/getdeals-kenya-showcase.git
   cd getdeals-kenya-showcase

   # Install dependencies
   npm install
   cd server && npm install && cd ..

   # Build frontend
   npm run build

   # Setup database
   sudo -u postgres psql < server/database/setup_postgres.sql

   # Start with PM2
   cd server
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret in production
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Regular database backups
- [ ] Monitor API usage
- [ ] Keep dependencies updated

## 🛠 Troubleshooting

### Common Issues:

1. **Database Connection Errors:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Restart if needed
   sudo systemctl restart postgresql
   ```

2. **M-Pesa Integration Issues:**
   - Verify credentials in Safaricom developer portal
   - Check callback URL configuration
   - Ensure callback endpoint is publicly accessible

3. **Build Errors:**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear build cache
   npm run clean && npm run build
   ```

## 📞 Support

For additional support:
- Check the GitHub repository for issues and discussions
- Review the API documentation in `/server/docs`
- Test all features in the development environment first

## 🎉 Success Checklist

After deployment, verify:
- [ ] Admin dashboard accessible
- [ ] M-Pesa test payment works
- [ ] SMS notifications sent
- [ ] Email notifications sent
- [ ] Product management functional
- [ ] Order tracking working
- [ ] Database queries optimized
- [ ] All API endpoints responding
- [ ] Frontend properly serving static files
- [ ] SSL certificate installed (production)

Your GetDeals Kenya platform is now ready for production with full database integration, M-Pesa payments, user management, and all requested features!
