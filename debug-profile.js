import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('No authenticated user');
    return;
  }
  
  console.log('Current user ID:', user.id);
  
  // Check profile by id (primary key)
  const { data: profileById, error: errorById } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  console.log('Profile by ID:', { profileById, errorById });
  
  // Check profile by user_id
  const { data: profileByUserId, error: errorByUserId } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  console.log('Profile by user_id:', { profileByUserId, errorByUserId });
  
  // Check all profiles for this user
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('*')
    .or(`id.eq.${user.id},user_id.eq.${user.id}`);
    
  console.log('All profiles for user:', { allProfiles, allError });
  
  // Check KYC data
  const { data: kycData, error: kycError } = await supabase
    .from('wallet_kyc')
    .select('*')
    .eq('user_id', user.id);
    
  console.log('KYC data:', { kycData, kycError });
}

checkProfile().catch(console.error);