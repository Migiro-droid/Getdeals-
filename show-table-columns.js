import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data } = await s
  .from('wallet_transactions')
  .select('*')
  .limit(1);

if (data && data.length > 0) {
  console.log('\n📋 wallet_transactions table columns:\n');
  console.log(Object.keys(data[0]).join(', '));
  console.log('\n\nSample record:');
  console.log(JSON.stringify(data[0], null, 2));
}
