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
  // Simple helper to check if a column exists (cannot use TypeScript types in .mjs)
  const check = async (column) => {
    const res = await executeSQL(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = '${column}'
    `);
    const rows = res?.rows || res || [];
    return rows.length > 0;
  };

  if (!(await check('twoFactorSecret'))) {
    console.log('twoFactorSecret column missing — adding it');
    await executeSQL(`ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT`);
    console.log('Column added');
  } else {
    console.log('twoFactorSecret column already exists');
  }

  if (!(await check('phoneVerified'))) {
    console.log('phoneVerified column missing — adding it');
    await executeSQL(`ALTER TABLE "users" ADD COLUMN "phoneVerified" BOOLEAN DEFAULT false`);
    console.log('phoneVerified added');
  } else {
    console.log('phoneVerified column already exists');
  }

  if (!(await check('emailVerified'))) {
    console.log('emailVerified column missing — adding it');
    await executeSQL(`ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN DEFAULT false`);
    console.log('emailVerified added');
  } else {
    console.log('emailVerified column already exists');
  }

  console.log('Done');
  process.exit(0);
} catch (err) {
  console.error('Error while checking/adding column:', err);
  process.exit(1);
}
