import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

console.log('\n🔍 Your 100 KSH deposits:\n');

const { data } = await s
  .from('wallet_transactions')
  .select('*')
  .eq('phone_number', '254717822846')
  .eq('amount', 100)
  .eq('status', 'pending')
  .order('created_at', { ascending: false });

data.forEach((tx, idx) => {
  console.log(`${idx + 1}. ID: ${tx.id}`);
  console.log(`   Amount: KES ${tx.amount}`);
  console.log(`   Status: ${tx.status}`);
  console.log(`   Created: ${tx.created_at}`);
  console.log(`   User ID: ${tx.user_id}\n`);
});

console.log(`To fix ALL your pending deposits, run:`);
console.log(`node fix-by-id.js ${data.map(tx => tx.id).join(' ')}\n`);
