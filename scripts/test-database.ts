import { neon } from '@neondatabase/serverless';

async function testDatabaseConnection() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully:', result[0].current_time);
    
    // Check if products table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'products'
    `;
    
    if (tables.length === 0) {
      console.log('❌ Products table does not exist!');
      console.log('📝 Creating products table...');
      
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          original_price DECIMAL(10, 2),
          image_url TEXT,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          items JSONB DEFAULT '[]',
          items_detail JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('✅ Products table created successfully!');
    } else {
      console.log('✅ Products table exists');
      
      // Check table schema
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'products' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      console.log('📋 Table schema:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Test inserting a sample product
    console.log('🧪 Testing product insert...');
    const testProduct = await sql`
      INSERT INTO products (id, name, price, category, description, image, "createdAt", "updatedAt")
      VALUES (${`test-${Date.now()}`}, 'Test Product', 100, 'test', 'This is a test product', '/placeholder.svg', NOW(), NOW())
      RETURNING id, name, price, category
    `;
    
    console.log('✅ Test product inserted:', testProduct[0]);
    
    // Clean up test product
    await sql`DELETE FROM products WHERE name = 'Test Product'`;
    console.log('🧹 Test product cleaned up');
    
    console.log('🎉 Database is ready for production!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Stack:', (error as Error).stack);
  }
}

testDatabaseConnection();
