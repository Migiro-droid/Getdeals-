// api/products.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Fetch all products
      const result = await pool.query('SELECT * FROM products ORDER BY "createdAt" DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name, price, originalPrice, image, discount, items, itemsDetail, category, description } = req.body;

      if (!id || !name || !price || !image || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const query = `
        INSERT INTO products 
        (id, name, price, "originalPrice", image, discount, items, "itemsDetail", category, description, "createdAt", "updatedAt") 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
        RETURNING *;
      `;

      const values = [id, name, price, originalPrice, image, discount, items, itemsDetail, category, description];

      const result = await pool.query(query, values);

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Products API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
