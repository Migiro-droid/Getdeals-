import fs from 'fs';
import path from 'path';

// load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq === -1) return;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    process.env[key] = value;
  });
}

import { supabase, executeSQL } from '../lib/db';

try {
  // Use Postgres information_schema via executeSQL for reliable column listing
  const result = await executeSQL(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);

  // result.rows may contain the rows depending on pg client
  const rows = result?.rows || result;
  console.log('users table columns:');
  console.log((rows || []).map(r => r.column_name || r.column_name));
} catch (err) {
  console.error('Error querying columns:', err);
  process.exit(1);
}
