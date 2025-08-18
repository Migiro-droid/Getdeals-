import { products } from '../src/data/products';

// This script will run once to migrate your JSON data to Vercel Postgres
export async function migrateData() {
  try {
    // Initialize database tables first
    console.log('🚀 Starting data migration...');
    
    // Import the products data and seed the database
    const response = await fetch('/api/products/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration completed successfully:', result);
    } else {
      console.error('❌ Migration failed:', await response.text());
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Run migration if this file is executed directly
if (typeof window === 'undefined') {
  migrateData();
}
