import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkWallet() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    console.log('Current User ID:', user.id);
    console.log('Email:', user.email);
    console.log('\n--- Checking Wallet Row ---');

    // Check wallet row
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletErr) {
      console.log('Wallet Error:', walletErr.message);
      return;
    }

    console.log('Wallet Found:');
    console.log('  user_id:', wallet.user_id);
    console.log('  balance:', wallet.balance);
    console.log('  getdeals_number:', wallet.getdeals_number);
    console.log('  is_active:', wallet.is_active);
    console.log('  created_at:', wallet.created_at);
    console.log('  updated_at:', wallet.updated_at);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkWallet();
