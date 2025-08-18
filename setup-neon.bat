@echo off
echo ================================================================
echo GetDeals Kenya - Neon Database Configuration Helper
echo ================================================================
echo.
echo 1. Copy your DATABASE_URL from the Neon dashboard
echo 2. Open the .env file in this folder
echo 3. Replace the placeholder with your actual connection string
echo.
echo Example:
echo DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
echo.
echo ================================================================
echo After updating .env, run these commands:
echo ================================================================
echo.
echo npm run db:generate    (Generate Prisma client)
echo npm run db:push       (Create database tables)
echo npm run db:seed       (Load GetDeals products)
echo npm run dev           (Start development server)
echo.
echo ================================================================
echo Your GetDeals Kenya platform will be ready! 🚀
echo ================================================================
pause
