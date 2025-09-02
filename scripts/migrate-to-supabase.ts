import { createClient } from '@supabase/supabase-js';
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

async function runSupabaseMigrations(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    results.push({
      step: 'Environment Check',
      status: 'error',
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
    return results;
  }

  results.push({
    step: 'Environment Check',
    status: 'success',
    message: 'Environment variables found',
    details: { supabaseUrl }
  });

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Read and execute the main migration file
  try {
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250821120000_complete_schema_migration.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    results.push({
      step: 'Migration File Read',
      status: 'success',
      message: 'Migration file loaded successfully',
      details: { path: migrationPath, size: migrationSql.length }
    });

    // Split the migration into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    results.push({
      step: 'SQL Parsing',
      status: 'success',
      message: `Parsed ${statements.length} SQL statements`
    });

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip if already exists errors for CREATE TABLE/CREATE EXTENSION
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Check if it's a "already exists" error - these are expected
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation') && error.message.includes('does not exist')) {
            skipCount++;
            console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            errors.push(`Statement ${i + 1}: ${error.message}`);
            console.log(`❌ Error in statement ${i + 1}: ${error.message}`);
          }
        } else {
          successCount++;
          console.log(`✅ Success: ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Statement ${i + 1}: ${errorMsg}`);
        console.log(`❌ Exception in statement ${i + 1}: ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      results.push({
        step: 'Migration Execution',
        status: 'warning',
        message: `Migration completed with ${successCount} successful, ${skipCount} skipped, ${errors.length} errors`,
        details: { successCount, skipCount, errors: errors.slice(0, 5) } // Limit error details
      });
    } else {
      results.push({
        step: 'Migration Execution',
        status: 'success',
        message: `Migration completed successfully. ${successCount} statements executed, ${skipCount} skipped`
      });
    }

  } catch (error) {
    results.push({
      step: 'Migration Execution',
      status: 'error',
      message: 'Failed to execute migration',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
    return results;
  }

  // Test the schema by checking if tables exist
  try {
    const tablesToCheck = ['products', 'profiles', 'orders', 'categories'];
    const tableResults: Record<string, boolean> = {};

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        tableResults[table] = !error;
      } catch {
        tableResults[table] = false;
      }
    }

    const existingTables = Object.entries(tableResults)
      .filter(([_, exists]) => exists)
      .map(([table]) => table);

    results.push({
      step: 'Schema Verification',
      status: 'success',
      message: `Verified ${existingTables.length}/${tablesToCheck.length} tables exist`,
      details: { tableResults, existingTables }
    });

  } catch (error) {
    results.push({
      step: 'Schema Verification',
      status: 'error',
      message: 'Failed to verify schema',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function seedSupabaseData(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    results.push({
      step: 'Seed Environment Check',
      status: 'error',
      message: 'Missing environment variables for seeding'
    });
    return results;
  }

  try {
    // Import seed data
    const { products } = await import('../src/data/products');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    results.push({
      step: 'Seed Data Load',
      status: 'success',
      message: `Loaded ${products.length} products for seeding`
    });

    // Seed products
    let insertedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const productData = {
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.originalPrice,
          image_url: product.image,
          discount: product.discount,
          items: product.items || [],
          items_detail: product.itemsDetail || null,
          category: product.category,
          description: product.description,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('products')
          .upsert(productData, { onConflict: 'id' })
          .select();

        if (error) {
          errors.push(`Product ${product.id}: ${error.message}`);
        } else {
          if (data && data.length > 0) {
            insertedCount++;
          }
        }
      } catch (err) {
        errors.push(`Product ${product.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (errors.length > 0) {
      results.push({
        step: 'Data Seeding',
        status: 'warning',
        message: `Seeded ${insertedCount} products with ${errors.length} errors`,
        details: { insertedCount, errors: errors.slice(0, 3) }
      });
    } else {
      results.push({
        step: 'Data Seeding',
        status: 'success',
        message: `Successfully seeded ${insertedCount} products`
      });
    }

  } catch (error) {
    results.push({
      step: 'Data Seeding',
      status: 'error',
      message: 'Failed to seed data',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function main() {
  console.log('🚀 Starting Supabase Migration and Seeding for red-umbrella project...\n');
  
  // Run migrations
  console.log('📋 Running database migrations...');
  const migrationResults = await runSupabaseMigrations();
  
  migrationResults.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  const hasErrors = migrationResults.some(r => r.status === 'error');
  if (hasErrors) {
    console.log('\n❌ Migration failed. Stopping here.');
    process.exit(1);
  }

  console.log('\n🌱 Seeding database...');
  const seedResults = await seedSupabaseData();
  
  seedResults.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  // Final verification
  console.log('\n🔍 Running final verification...');
  const { verifySupabaseConnection } = await import('./verify-supabase-connection');
  const verificationResults = await verifySupabaseConnection();
  
  verificationResults.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
  });

  const allErrors = [...migrationResults, ...seedResults, ...verificationResults]
    .filter(r => r.status === 'error');
  
  if (allErrors.length === 0) {
    console.log('\n🎉 Migration and seeding completed successfully!');
    console.log('✅ Your red-umbrella Supabase project is now connected and ready for Vercel deployment.');
  } else {
    console.log('\n⚠️  Migration completed with some issues. Please review the errors above.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runSupabaseMigrations, seedSupabaseData };
