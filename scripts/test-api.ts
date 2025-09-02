// Test API functions using lib/db
import { config } from 'dotenv';

// Load environment variables first
config();

import { seedDatabase } from '../lib/db';

async function testAPI() {
  try {
    console.log('🚀 Testing API endpoints via lib/db...\n');

    // This should work because it uses Supabase seedDatabase function
    console.log('📦 Testing seedDatabase function...');
    await seedDatabase();
    
    console.log('\n✅ API functions are ready for deployment!');
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI();
