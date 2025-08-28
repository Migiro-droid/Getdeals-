import { useState, useEffect } from 'react';
import { categoryAPI, Category as ApiCategory } from '../lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new Vercel API
      const { data, error: apiError } = await categoryAPI.getAll();
      
      if (apiError) {
        throw new Error(apiError.message);
      }
      
      // Convert API response to local format
      const convertedCategories: Category[] = (data || []).map((cat: ApiCategory) => ({
        ...cat,
        createdAt: cat.createdAt
      }));
      
      setCategories(convertedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to hardcoded categories
      setCategories([
        { id: '1', name: 'Beverages', slug: 'beverages', isActive: true, sortOrder: 1, createdAt: new Date() },
        { id: '2', name: 'Snacks', slug: 'snacks', isActive: true, sortOrder: 2, createdAt: new Date() },
        { id: '3', name: 'Groceries', slug: 'groceries', isActive: true, sortOrder: 3, createdAt: new Date() },
        { id: '4', name: 'Personal Care', slug: 'personal-care', isActive: true, sortOrder: 4, createdAt: new Date() },
        { id: '5', name: 'Household', slug: 'household', isActive: true, sortOrder: 5, createdAt: new Date() },
        { id: '6', name: 'Electronics', slug: 'electronics', isActive: true, sortOrder: 6, createdAt: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
}
