import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛠️ Testing product creation with featured field...');

  // Test creating a new product with featured field
  const testProduct = await prisma.product.create({
    data: {
      id: 'test-featured-product',
      name: 'Test Featured Product',
      price: 1500,
      originalPrice: 2000,
      image: '/placeholder.svg',
      category: 'groceries',
      description: 'A test product to verify featured field works',
      featured: true,
      items: ['Test Item 1', 'Test Item 2']
    }
  });

  console.log('✅ Successfully created featured product:', testProduct.name);
  console.log('   Featured:', testProduct.featured);

  // Now test updating an existing product
  const existingProduct = await prisma.product.findFirst();
  if (existingProduct) {
    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { featured: true }
    });
    console.log('✅ Successfully updated product:', updatedProduct.name);
    console.log('   Featured:', updatedProduct.featured);
  }

  console.log('🎉 Featured field is working correctly!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Test completed successfully!');
  })
  .catch(async (e) => {
    console.error('❌ Test failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
