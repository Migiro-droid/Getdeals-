import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

// Validate product input
function validateProductInput(data: any) {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Product name is required and must be a non-empty string');
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Product price is required and must be a positive number');
  }
  
  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('Product category is required and must be a non-empty string');
  }
  
  if (!data.image || typeof data.image !== 'string' || !data.image.trim()) {
    errors.push('Product image URL is required and must be a non-empty string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      name: data.name?.trim(),
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : data.price,
      image: data.image?.trim(),
      category: data.category?.trim(),
      description: data.description?.trim() || '',
      items: Array.isArray(data.items) ? data.items : [],
      items_detail: Array.isArray(data.itemsDetail) ? data.itemsDetail : []
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all products
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

      case 'POST':
        // Create new product
        const { isValid, errors, sanitizedData } = validateProductInput(req.body);
        
        if (!isValid) {
          return res.status(400).json({ 
            message: 'Validation failed', 
            errors 
          });
        }

        // Generate unique ID
        const productId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert into database
        const result = await sql`
          INSERT INTO products (
            id, name, price, original_price, image_url, category, 
            description, items, items_detail, created_at
          ) VALUES (
            ${productId},
            ${sanitizedData.name},
            ${sanitizedData.price},
            ${sanitizedData.originalPrice},
            ${sanitizedData.image},
            ${sanitizedData.category},
            ${sanitizedData.description},
            ${JSON.stringify(sanitizedData.items)},
            ${JSON.stringify(sanitizedData.items_detail)},
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

        return res.status(201).json(result[0]);

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
