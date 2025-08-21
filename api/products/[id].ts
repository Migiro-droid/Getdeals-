import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {
    switch (req.method) {
      case 'PATCH':
        // Update product
        const updates = req.body;
        const setClause = Object.keys(updates)
          .filter(key => updates[key] !== undefined)
          .map(key => {
            switch (key) {
              case 'originalPrice':
                return 'original_price = ${updates.originalPrice}';
              case 'image':
                return 'image_url = ${updates.image}';
              case 'itemsDetail':
                return 'items_detail = ${JSON.stringify(updates.itemsDetail)}';
              default:
                return `${key} = ${typeof updates[key] === 'string' ? `'${updates[key]}'` : updates[key]}`;
            }
          })
          .join(', ');

        if (!setClause) {
          return res.status(400).json({ message: 'No valid updates provided' });
        }

        const updatedProduct = await sql`
          UPDATE products 
          SET ${sql.unsafe(setClause)}, updated_at = NOW()
          WHERE id = ${id}
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

        if (updatedProduct.length === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }

        return res.json(updatedProduct[0]);

      case 'DELETE':
        // Delete product
        const deletedProduct = await sql`
          DELETE FROM products 
          WHERE id = ${id}
          RETURNING id
        `;

        if (deletedProduct.length === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(204).end();

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}
