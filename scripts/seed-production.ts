import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const seedProducts = [
  {
    name: "Essential Basket",
    price: 3000,
    original_price: 3500,
    image_url: "/src/assets/essential-basket.jpg",
    category: "essential",
    description: "Perfect for small families with daily essentials",
    items: ["2kg Rice", "1kg Sugar", "500ml Cooking Oil", "1 Bread Loaf", "1kg Wheat Flour"]
  },
  {
    name: "Family Basket",
    price: 4500,
    original_price: 5200,
    image_url: "/src/assets/family-basket.jpg", 
    category: "basket",
    description: "Complete nutrition for the whole family",
    items: ["5kg Rice", "2kg Sugar", "1L Cooking Oil", "2 Bread Loaves", "2kg Wheat Flour", "1kg Beans"]
  },
  {
    name: "Holiday Special Basket",
    price: 8500,
    original_price: 10500,
    image_url: "/src/assets/family-basket.jpg",
    category: "holiday", 
    description: "Perfect for Christmas celebrations",
    items: ["5kg Premium Rice", "2kg Sugar", "1L Cooking Oil", "Christmas Cake Mix", "Festive Spices Set", "Holiday Treats"]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with products...');
    
    // Insert each product
    for (const product of seedProducts) {
      await sql`
        INSERT INTO products (
          name, 
          price, 
          original_price, 
          image_url, 
          category, 
          description, 
          items
        ) VALUES (
          ${product.name},
          ${product.price},
          ${product.original_price},
          ${product.image_url},
          ${product.category},
          ${product.description},
          ${JSON.stringify(product.items)}
        )
        ON CONFLICT (name) DO NOTHING
      `;
      console.log(`✅ Added: ${product.name}`);
    }
    
    // Get count of products
    const count = await sql`SELECT COUNT(*) as total FROM products`;
    console.log(`🎉 Database seeded successfully! Total products: ${count[0].total}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
