import { PrismaClient } from '@prisma/client';
import { products } from '../src/data/products';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed products
  console.log('📦 Seeding products...');
  for (const product of products.slice(0, 10)) { // Seed first 10 products to mark some as featured
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        discount: product.discount,
        items: product.items || [],
        itemsDetail: product.itemsDetail || [],
        category: product.category,
        description: product.description,
        featured: products.indexOf(product) < 3, // Mark first 3 as featured
      },
      create: {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        discount: product.discount,
        items: product.items || [],
        itemsDetail: product.itemsDetail || [],
        category: product.category,
        description: product.description,
        featured: products.indexOf(product) < 3, // Mark first 3 as featured
      },
    });
  }

  // Seed remaining products without featured flag
  for (const product of products.slice(10)) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        discount: product.discount,
        items: product.items || [],
        itemsDetail: product.itemsDetail || [],
        category: product.category,
        description: product.description,
        featured: false,
      },
      create: {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        discount: product.discount,
        items: product.items || [],
        itemsDetail: product.itemsDetail || [],
        category: product.category,
        description: product.description,
        featured: false,
      },
    });
  }

  // Create sample categories
  console.log('📂 Seeding categories...');
  const categories = [
    { name: 'Essential Baskets', slug: 'essential', description: 'Daily essentials for every family' },
    { name: 'Family Baskets', slug: 'family', description: 'Complete family shopping solutions' },
    { name: 'Custom Baskets', slug: 'basket', description: 'Curated baskets for special occasions' },
    { name: 'Holiday Specials', slug: 'holiday', description: 'Festive season deals and bundles' },
    { name: 'School Essentials', slug: 'school', description: 'Back to school and student essentials' },
    { name: 'Beverages', slug: 'alcohol', description: 'Premium beverages and spirits' },
    { name: 'Special Deals', slug: 'blackfriday', description: 'Limited time special offers' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: {
        ...category,
        isActive: true,
        sortOrder: categories.indexOf(category),
      },
    });
  }

  // Create sample admin user
  console.log('👤 Creating admin user...');
  
  // Simple password hashing (use bcrypt in production)
  const defaultPassword = 'admin123';
  const passwordHash = Buffer.from(defaultPassword + 'salt123').toString('base64');
  
  await prisma.user.upsert({
    where: { email: 'info@getdeals.co.ke' },
    update: {},
    create: {
      name: 'GetDeals Admin',
      email: 'info@getdeals.co.ke',
      phone: '+254700000000',
      passwordHash: passwordHash,
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create sample customer user
  console.log('👤 Creating sample customer...');
  const customerPasswordHash = Buffer.from('customer123' + 'salt123').toString('base64');
  
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer@example.com',
      phone: '+254711111111',
      passwordHash: customerPasswordHash,
      role: 'customer',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create sample settings
  console.log('⚙️ Setting up configuration...');
  const settings = [
    { key: 'site_name', value: 'GetDeals Kenya', type: 'string' },
    { key: 'site_description', value: 'Best deals on essential products in Kenya', type: 'string' },
    { key: 'delivery_fee', value: '200', type: 'number' },
    { key: 'free_delivery_threshold', value: '5000', type: 'number' },
    { key: 'mpesa_enabled', value: 'true', type: 'boolean' },
    { key: 'email_notifications', value: 'true', type: 'boolean' },
    { key: 'sms_notifications', value: 'true', type: 'boolean' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📦 Created ${products.length} products`);
  console.log(`📂 Created ${categories.length} categories`);
  console.log(`👤 Created admin user (info@getdeals.co.ke / admin123)`);
  console.log(`👤 Created sample customer (customer@example.com / customer123)`);
  console.log(`⚙️ Created ${settings.length} settings`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
