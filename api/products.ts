import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const products = await sql`
        SELECT 
          id, 
          name, 
          price, 
          original_price as "originalPrice",
          image_url as image,
          category,
          description,
          items,
          items_detail as "itemsDetail",
          created_at as "createdAt"
        FROM products 
        ORDER BY created_at DESC
      `;
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { name, price, originalPrice, image, category, description, items, itemsDetail } = req.body;
      
      if (!name || !price || !category || !image) {
        return res.status(400).json({ 
          error: "Name, price, category, and image are required" 
        });
      }

      // Generate unique ID
      const productId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const [newProduct] = await sql`
        INSERT INTO products (
          id, name, price, original_price, image_url, category, 
          description, items, items_detail, created_at
        ) VALUES (
          ${productId},
          ${name},
          ${Number(price)},
          ${originalPrice ? Number(originalPrice) : Number(price)},
          ${image},
          ${category},
          ${description || ''},
          ${JSON.stringify(items || [])},
          ${JSON.stringify(itemsDetail || [])},
          NOW()
        )
        RETURNING 
          id, 
          name, 
          price, 
          original_price as "originalPrice",
          image_url as image,
          category,
          description,
          items,
          items_detail as "itemsDetail",
          created_at as "createdAt"
      `;
      
      return res.status(201).json(newProduct);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: String(err)
    });
  }
}
