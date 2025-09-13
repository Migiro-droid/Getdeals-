import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup...');

  // The 6 allowed basket categories (5 baskets + black friday)
  const allowedCategories = ['essential', 'family', 'basket', 'holiday', 'school', 'blackfriday'];

  console.log('📦 Removing products with unwanted categories...');
  
  // Delete all products that don't belong to the allowed categories
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      category: {
        notIn: allowedCategories
      }
    }
  });

  console.log(`🗑️ Deleted ${deletedProducts.count} products with unwanted categories`);

  console.log('📂 Removing unwanted categories...');
  
  // Delete all categories that are not in the allowed list
  const deletedCategories = await prisma.category.deleteMany({
    where: {
      slug: {
        notIn: allowedCategories
      }
    }
  });

  console.log(`🗑️ Deleted ${deletedCategories.count} unwanted categories`);

  console.log('📊 Updating category names to match basket types...');
  
  // Update category names to be more descriptive for baskets
  const categoryUpdates = [
    { slug: 'essential', name: 'Essential Baskets', description: 'Daily essentials for every family' },
    { slug: 'family', name: 'Family Baskets', description: 'Complete family shopping solutions' },
    { slug: 'basket', name: 'Custom Baskets', description: 'Curated baskets for special occasions' },
    { slug: 'holiday', name: 'Holiday Baskets', description: 'Festive season basket deals' },
    { slug: 'school', name: 'School Baskets', description: 'Back to school basket essentials' },
    { slug: 'blackfriday', name: 'Black Friday', description: 'Special Black Friday deals and offers' },
  ];

  for (const category of categoryUpdates) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: true,
        sortOrder: categoryUpdates.indexOf(category),
      },
    });
  }

  console.log('📊 Getting final counts...');
  
  const remainingProducts = await prisma.product.count();
  const remainingCategories = await prisma.category.count();
  
  // Show products by category
  console.log('📊 Products by category:');
  for (const category of allowedCategories) {
    const count = await prisma.product.count({
      where: { category }
    });
    console.log(`   • ${category}: ${count} products`);
  }

  console.log('✅ Database cleanup completed!');
  console.log(`📦 ${remainingProducts} products remaining (only basket categories)`);
  console.log(`📂 ${remainingCategories} categories remaining (only the 6 allowed)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Cleanup failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });