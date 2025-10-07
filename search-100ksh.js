import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data } = await s.from('wallet_transactions').select('*').eq('amount', 10000);
console.log('\n🔍 ALL 100 KSH (10000 cents) transactions:\n');
console.log(JSON.stringify(data, null, 2));
