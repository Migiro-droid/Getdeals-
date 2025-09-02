import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function executeSchema() {
  try {
    console.log('Executing database schema...');
    
    const { stdout, stderr } = await execAsync(`psql "${dbUrl}" -f supabase-schema.sql`);
    
    if (stderr) {
      console.error('Errors:', stderr);
    }
    
    if (stdout) {
      console.log('Output:', stdout);
    }
    
    console.log('Schema execution completed!');
  } catch (error) {
    console.error('Failed to execute schema:', error);
  }
}

executeSchema();
