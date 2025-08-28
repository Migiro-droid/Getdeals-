import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Query the actual database schema
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Products table columns:');
    console.log(result);
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
