// api/products.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json({ data: products, error: null });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ 
        data: null, 
        error: { message: 'Failed to fetch products' } 
      });
    }
  } 
  else if (req.method === 'POST') {
    try {
      const productData = req.body;
      
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          price: parseInt(productData.price),
          originalPrice: productData.originalPrice ? parseInt(productData.originalPrice) : null,
          image: productData.imageUrl || productData.image,
          category: productData.category,
          description: productData.description || null,
          featured: productData.featured || false,
          items: productData.items || [],
          discount: productData.discount || null
        }
      });
      
      res.status(201).json({ data: product, error: null });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ 
        data: null, 
        error: { message: 'Failed to create product' } 
      });
    }
  }
  else if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.price && { price: parseInt(updates.price) }),
          ...(updates.originalPrice && { originalPrice: parseInt(updates.originalPrice) }),
          ...(updates.imageUrl && { image: updates.imageUrl }),
          ...(updates.category && { category: updates.category }),
          ...(updates.description && { description: updates.description }),
          ...(updates.featured !== undefined && { featured: updates.featured }),
          ...(updates.items && { items: updates.items }),
          ...(updates.discount && { discount: updates.discount })
        }
      });
      
      res.status(200).json({ data: product, error: null });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ 
        data: null, 
        error: { message: 'Failed to update product' } 
      });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.product.delete({
        where: { id: id as string }
      });
      
      res.status(200).json({ error: null });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ 
        error: { message: 'Failed to delete product' } 
      });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
