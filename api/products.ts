import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const products = await sql`SELECT * FROM products ORDER BY id DESC`;
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { name, price, category, image, description, originalPrice, items, itemsDetail } = req.body;
      
      if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
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
          ${image || 'https://via.placeholder.com/300'},
          ${category || 'general'},
          ${description || ''},
          ${JSON.stringify(items || [])},
          ${JSON.stringify(itemsDetail || [])},
          NOW()
        )
        RETURNING *
      `;
      
      return res.status(201).json(newProduct);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
