import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating comprehensive product categories...');

  // Complete list of categories based on the product data and dropdown requirements
  const categories = [
    // Main Shopping Categories (for dropdown)
    { name: 'Beverages', slug: 'beverages', description: 'Soft drinks, juices, water, and more', sortOrder: 1 },
    { name: 'Snacks', slug: 'snacks', description: 'Chips, nuts, biscuits, and quick bites', sortOrder: 2 },
    { name: 'Groceries', slug: 'groceries', description: 'Rice, sugar, oil, and cooking essentials', sortOrder: 3 },
    { name: 'Personal Care', slug: 'personal-care', description: 'Hygiene and personal care products', sortOrder: 4 },
    { name: 'Household', slug: 'household', description: 'Cleaning supplies and home essentials', sortOrder: 5 },
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, accessories, and tech items', sortOrder: 6 },
    { name: 'Appliances', slug: 'appliances', description: 'Kitchen and home appliances', sortOrder: 7 },
    { name: 'Cleaning', slug: 'cleaning', description: 'Cleaning products and supplies', sortOrder: 8 },
    { name: 'Furnishing & Furniture', slug: 'furniture', description: 'Furniture, home decor, and furnishings', sortOrder: 9 },
    { name: 'Automotive', slug: 'automotive', description: 'Car care products and accessories', sortOrder: 10 },
    { name: 'Accessories', slug: 'accessories', description: 'Fashion and lifestyle accessories', sortOrder: 11 },
    
    // Basket Categories
    { name: 'Essential Baskets', slug: 'essential', description: 'Daily essentials for every family', sortOrder: 20 },
    { name: 'Family Baskets', slug: 'family', description: 'Complete family shopping solutions', sortOrder: 21 },
    { name: 'Custom Baskets', slug: 'basket', description: 'Curated baskets for special occasions', sortOrder: 22 },
    
    // Seasonal & Special Categories
    { name: 'Holiday Specials', slug: 'holiday', description: 'Festive season deals and bundles', sortOrder: 30 },
    { name: 'School Essentials', slug: 'school', description: 'Back to school and student essentials', sortOrder: 31 },
    { name: 'Black Friday Deals', slug: 'blackfriday', description: 'Limited time special offers', sortOrder: 32 },
    { name: 'Valentine Specials', slug: 'valentine', description: 'Romantic gifts and dinner packages', sortOrder: 33 },
    { name: 'Celebration Packs', slug: 'celebration', description: 'Party and celebration essentials', sortOrder: 34 },
    
    // Alcohol & Beverages
    { name: 'Alcoholic Beverages', slug: 'alcohol', description: 'Beer, wine, spirits, and mixers', sortOrder: 40 },
    
    // Health & Lifestyle
    { name: 'Fresh Produce', slug: 'fresh', description: 'Fresh fruits, vegetables, and organic items', sortOrder: 50 },
    { name: 'Organic Products', slug: 'organic', description: 'Certified organic and natural products', sortOrder: 51 },
    
    // Family & Kids
    { name: 'Baby Care', slug: 'baby', description: 'Baby food, diapers, and care products', sortOrder: 60 },
    { name: 'Kids Products', slug: 'kids', description: 'Children snacks, toys, and essentials', sortOrder: 61 },
    
    // Office & Work
    { name: 'Office Supplies', slug: 'office', description: 'Work from home and office essentials', sortOrder: 70 },
    
    // Budget Options
    { name: 'Budget Options', slug: 'budget', description: 'Affordable essentials for tight budgets', sortOrder: 80 },
    { name: 'Single Person', slug: 'single', description: 'Perfect portions for living alone', sortOrder: 81 },
  ];

  let created = 0;
  let updated = 0;

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      },
      create: {
        ...category,
        isActive: true,
      },
    });
    
    if (result) {
      console.log(`✅ ${category.name} (${category.slug})`);
      created++;
    }
  }

  console.log('✅ Categories migration completed!');
  console.log(`📂 Processed ${categories.length} categories`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('🎉 Migration completed successfully!');
  })
  .catch(async (e) => {
    console.error('❌ Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
