import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

// Validate product input
function validateProductInput(data: any) {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Name is required');
  }
  
  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('Category is required');
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Price must be a positive number');
  }
  
  if (data.originalPrice && (typeof data.originalPrice !== 'number' || data.originalPrice < data.price)) {
    errors.push('Original price must be greater than or equal to price');
  }
  
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  
  return {
    ok: true,
    value: {
      name: data.name.trim(),
      image_url: data.image || '/placeholder.svg',
      category: data.category.trim(),
      price: data.price,
      original_price: data.originalPrice || null,
      description: data.description || '',
      items: Array.isArray(data.items) ? data.items : [],
      items_detail: Array.isArray(data.itemsDetail) ? data.itemsDetail : []
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    switch (req.method) {
      case 'GET':
        // Fetch all products from Neon database
        try {
          const products = await sql`
            SELECT 
              id, 
              name, 
              price, 
              "originalPrice",
              image,
              category,
              description,
              items,
              "itemsDetail",
              "createdAt"
            FROM products 
            ORDER BY "createdAt" DESC
          `;
          return res.json(products);
        } catch (dbError) {
          console.error('Database query error:', dbError);
          // Return empty array if database fails
          return res.json([]);
        }
        
      case 'POST':
        if (req.url?.includes('/reset')) {
          // For now, just return success - implement seed data later
          return res.json({ ok: true, count: 0 });
        } else {
          // Create new product
          const check = validateProductInput(req.body);
          if (!check.ok) {
            return res.status(400).json({ message: 'Validation failed', errors: check.errors });
          }
          
          const { value } = check;
          
          try {
            const product = await sql`
              INSERT INTO products (
                id,
                name, 
                price, 
                "originalPrice", 
                image, 
                category, 
                description, 
                items, 
                "itemsDetail",
                "createdAt",
                "updatedAt"
              ) VALUES (
                ${`product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`},
                ${value.name},
                ${Math.round(value.price)},
                ${value.original_price ? Math.round(value.original_price) : null},
                ${value.image_url},
                ${value.category},
                ${value.description},
                ${JSON.stringify(value.items)},
                ${JSON.stringify(value.items_detail)},
                NOW(),
                NOW()
              )
              RETURNING 
                id, 
                name, 
                price, 
                "originalPrice",
                image,
                category,
                description,
                items,
                "itemsDetail",
                "createdAt"
            `;
            
            return res.status(201).json(product[0]);
          } catch (dbError) {
            console.error('Database insert error:', dbError);
            return res.status(500).json({ 
              message: 'Database error', 
              error: String(dbError),
              details: 'Check if products table exists and has correct schema'
            });
          }
        }
        
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: String(error),
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}
