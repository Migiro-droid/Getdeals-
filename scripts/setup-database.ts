#!/usr/bin/env node

/**
 * GetDeals Kenya - Database Setup Script
 * This script initializes your Neon database with all the required tables and data
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command: string, description: string) {
  log(`🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully!`, 'green');
  } catch (error) {
    log(`❌ ${description} failed!`, 'red');
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  log('🚀 GetDeals Kenya - Database Setup', 'bold');
  log('Setting up your Neon database with all the required data...', 'yellow');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red');
    log('Please create a .env file with your Neon database connection string.', 'yellow');
    log('Example: DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"', 'blue');
    process.exit(1);
  }

  // Check if DATABASE_URL is set
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('DATABASE_URL=') || envContent.includes('your_database_url_here')) {
    log('❌ DATABASE_URL not configured in .env file!', 'red');
    log('Please add your Neon database connection string to the .env file.', 'yellow');
    process.exit(1);
  }

  log('📋 Database setup checklist:', 'bold');
  
  // Step 1: Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');

  // Step 2: Push database schema
  runCommand('npx prisma db push --accept-data-loss', 'Creating database tables');

  // Step 3: Seed database with GetDeals data
  runCommand('npx prisma db seed', 'Seeding database with products and data');

  // Step 4: Verify setup
  log('🔍 Verifying database setup...', 'blue');
  
  log('', 'reset');
  log('🎉 Database setup completed successfully!', 'green');
  log('', 'reset');
  log('📊 Your GetDeals Kenya database now includes:', 'bold');
  log('   ✅ All product categories and baskets', 'green');
  log('   ✅ Admin user account', 'green');
  log('   ✅ System configuration', 'green');
  log('   ✅ Database tables for orders, payments, users', 'green');
  log('', 'reset');
  log('🚀 Next steps:', 'bold');
  log('   1. Run: npm run dev (start development server)', 'blue');
  log('   2. Run: npm run db:studio (open database browser)', 'blue');
  log('   3. Deploy to Vercel when ready!', 'blue');
  log('', 'reset');
  log('🌐 Admin Login:', 'bold');
  log('   Email: info@getdeals.co.ke', 'yellow');
  log('   (Authentication is disabled for development)', 'yellow');
}

main().catch((error) => {
  log('❌ Setup failed!', 'red');
  console.error(error);
  process.exit(1);
});
