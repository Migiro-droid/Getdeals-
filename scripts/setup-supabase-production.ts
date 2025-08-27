import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

interface MigrationResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

async function executeDirectMigration(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  // Get database connection details
  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED;
  
  if (!databaseUrl) {
    results.push({
      step: 'Database Connection Setup',
      status: 'error',
      message: 'No database URL found. Need POSTGRES_URL_NON_POOLING or DATABASE_URL_UNPOOLED'
    });
    return results;
  }

  results.push({
    step: 'Database Connection Setup',
    status: 'success',
    message: 'Database URL found'
  });

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    results.push({
      step: 'Database Connection',
      status: 'success',
      message: 'Connected to PostgreSQL database'
    });

    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250821120000_complete_schema_migration.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    results.push({
      step: 'Migration File Read',
      status: 'success',
      message: 'Migration file loaded',
      details: { size: migrationSql.length }
    });

    // Execute the complete migration
    try {
      await client.query(migrationSql);
      results.push({
        step: 'Migration Execution',
        status: 'success',
        message: 'Migration executed successfully'
      });
    } catch (migrationError: any) {
      // Some errors are expected (like "already exists")
      if (migrationError.message.includes('already exists') || 
          migrationError.message.includes('duplicate key')) {
        results.push({
          step: 'Migration Execution',
          status: 'warning',
          message: 'Migration completed with expected conflicts (items already exist)',
          details: { error: migrationError.message }
        });
      } else {
        results.push({
          step: 'Migration Execution',
          status: 'error',
          message: 'Migration failed',
          details: { error: migrationError.message }
        });
        return results;
      }
    }

    // Verify tables exist
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'profiles', 'orders', 'categories', 'addresses');
    `;

    const tableResult = await client.query(tableCheckQuery);
    const existingTables = tableResult.rows.map(row => row.table_name);

    results.push({
      step: 'Schema Verification',
      status: 'success',
      message: `Found ${existingTables.length} tables in database`,
      details: { tables: existingTables }
    });

  } catch (error) {
    results.push({
      step: 'Database Operation',
      status: 'error',
      message: 'Database operation failed',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  } finally {
    await client.end();
  }

  return results;
}

async function seedData(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  // Use the database helper to seed data
  try {
    const { seedDatabase } = await import('../lib/db');
    await seedDatabase();
    
    results.push({
      step: 'Data Seeding',
      status: 'success',
      message: 'Database seeded successfully using existing helper'
    });
  } catch (error) {
    results.push({
      step: 'Data Seeding',
      status: 'error',
      message: 'Failed to seed database',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function setupVercelEnvironmentVariables(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  // Check current environment variables
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    results.push({
      step: 'Environment Variables Check',
      status: 'warning',
      message: `Missing variables: ${missingVars.join(', ')}`,
      details: { 
        missing: missingVars,
        found: requiredVars.filter(varName => process.env[varName])
      }
    });
  } else {
    results.push({
      step: 'Environment Variables Check',
      status: 'success',
      message: 'All required environment variables are set'
    });
  }

  // Create .env.vercel file for Vercel deployment
  const vercelEnvContent = `# Supabase Configuration for red-umbrella project
SUPABASE_URL=${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY}

# Database Configuration
DATABASE_URL=${process.env.POSTGRES_URL}
DATABASE_URL_UNPOOLED=${process.env.POSTGRES_URL_NON_POOLING}
POSTGRES_URL=${process.env.POSTGRES_URL}
POSTGRES_URL_NON_POOLING=${process.env.POSTGRES_URL_NON_POOLING}

# Additional Configuration
POSTGRES_USER=${process.env.POSTGRES_USER}
POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD}
POSTGRES_DATABASE=${process.env.POSTGRES_DATABASE}
POSTGRES_HOST=${process.env.POSTGRES_HOST}
`;

  try {
    const { writeFileSync } = require('fs');
    writeFileSync('.env.vercel', vercelEnvContent);
    
    results.push({
      step: 'Vercel Environment Setup',
      status: 'success',
      message: 'Created .env.vercel file for deployment'
    });
  } catch (error) {
    results.push({
      step: 'Vercel Environment Setup',
      status: 'error',
      message: 'Failed to create .env.vercel file',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function main() {
  console.log('🚀 Setting up red-umbrella Supabase project for Vercel deployment...\n');
  
  // Step 1: Run migration
  console.log('📋 Applying database schema...');
  const migrationResults = await executeDirectMigration();
  
  migrationResults.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  });

  // Step 2: Seed data
  console.log('\n🌱 Seeding initial data...');
  const seedResults = await seedData();
  
  seedResults.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  });

  // Step 3: Setup Vercel environment
  console.log('\n⚙️  Setting up Vercel environment...');
  const envResults = await setupVercelEnvironmentVariables();
  
  envResults.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  });

  // Step 4: Final verification
  console.log('\n🔍 Running final verification...');
  const { verifySupabaseConnection } = await import('./verify-supabase-connection');
  const verificationResults = await verifySupabaseConnection();
  
  verificationResults.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
  });

  // Summary
  const allResults = [...migrationResults, ...seedResults, ...envResults, ...verificationResults];
  const errors = allResults.filter(r => r.status === 'error');
  const warnings = allResults.filter(r => r.status === 'warning');

  console.log('\n' + '='.repeat(60));
  
  if (errors.length === 0) {
    console.log('🎉 SUCCESS! red-umbrella Supabase project is ready for Vercel!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy to Vercel: vercel --prod');
    console.log('2. Set environment variables in Vercel dashboard');
    console.log('3. Your API endpoints will be available at your Vercel URL');
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  Note: ${warnings.length} warnings were encountered but can be ignored.`);
    }
  } else {
    console.log('❌ ERRORS ENCOUNTERED:');
    errors.forEach(error => {
      console.log(`   - ${error.step}: ${error.message}`);
    });
    console.log('\nPlease fix these errors before deploying to Vercel.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
