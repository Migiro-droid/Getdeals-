import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumns() {
  try {
    // Simple query to test the products table
    const products = await prisma.product.findFirst();
    console.log('First product:', products);
    
    // Check what columns are available by querying with SELECT *
    const rawResult = await prisma.$queryRawUnsafe(`
      SELECT * FROM products LIMIT 1;
    `);
    console.log('Raw result:', rawResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
