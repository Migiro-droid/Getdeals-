const { PrismaClient } = require('./server/node_modules/@prisma/client');
const path = require('path');
const fs = require('fs');

(async function main(){
  const prisma = new PrismaClient();
  try {
    const productsPath = path.join(__dirname, '..', 'data', 'products.seed.json');
    if (!fs.existsSync(productsPath)) {
      console.error('products.seed.json not found at', productsPath);
      process.exit(1);
    }
    const json = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`Seeding ${json.length} products...`);
    for (const p of json) {
      const id = p.id || undefined;
      // Convert prices to cents if they're numbers (assume current seed uses numbers in KES)
      const data = {
        id: id,
        name: p.name,
        category: p.category || 'general',
        description: p.description || null,
        image: p.image || '',
        price: Math.round((p.price || 0)),
        originalPrice: p.originalPrice != null ? Math.round(p.originalPrice) : undefined,
        discount: p.discount != null ? p.discount : undefined,
        items: Array.isArray(p.items) ? p.items : [],
        itemsDetail: p.itemsDetail || undefined,
        isBasket: p.isBasket || false,
        isActive: p.isActive != null ? p.isActive : true,
        stock: p.stock != null ? p.stock : 0,
        lowStockThreshold: p.lowStockThreshold != null ? p.lowStockThreshold : 5,
        supplier: p.supplier || null
      };

      await prisma.product.upsert({
        where: { id: data.id || '' },
        update: data,
        create: data
      }).catch(async (err) => {
        // If no id provided, just create
        if (data.id) {
          console.error('Upsert error for', data.id, err.message);
        } else {
          const { id, ...createData } = data;
          await prisma.product.create({ data: createData });
        }
      });
    }
    console.log('Seeding completed');
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
