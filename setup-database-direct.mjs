import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Read the schema file
    const schemaSQL = fs.readFileSync('./supabase-schema.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`Statement ${i + 1} error (may be expected):`, error.message);
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`Statement ${i + 1} error (may be expected):`, err.message);
        }
      }
    }
    
    console.log('Database schema setup completed');
    
    // Test that we can access the users table
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('Users table test error:', testError.message);
    } else {
      console.log('Users table is accessible');
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
