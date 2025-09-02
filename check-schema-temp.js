const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Checking products table schema...');

  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);

    if (error) {
      console.log('Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
      console.log('Sample data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No data found, table might be empty');
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

checkSchema();
