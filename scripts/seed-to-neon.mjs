import path from 'path';
import fs from 'fs';
const { PrismaClient } = (await import(path.join(process.cwd(), 'server', 'node_modules', '@prisma', 'client', 'index.js')));

(async function main(){
  const prisma = new PrismaClient();
  try {
    const productsPath = path.join(process.cwd(), 'data', 'products.seed.json');
    if (!fs.existsSync(productsPath)) {
      console.error('products.seed.json not found at', productsPath);
      process.exit(1);
    }
    const json = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`Seeding ${json.length} products...`);
    for (const p of json) {
      const data = {
        id: p.id || undefined,
        name: p.name,
        category: p.category || 'general',
        description: p.description || null,
        image: p.image || '',
        price: Math.round(p.price || 0),
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

      if (data.id) {
        await prisma.product.upsert({
          where: { id: data.id },
          update: data,
          create: data
        }).catch(e => console.error('upsert failed for', data.id, e.message));
      } else {
        await prisma.product.create({ data }).catch(e => console.error('create failed', e.message));
      }
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
