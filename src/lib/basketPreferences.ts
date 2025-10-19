import { supabase } from '@/integrations/supabase/client';

export interface UserBasketPreferences {
  user_id: string;
  shopping_frequency: string[];
  categories: string[];
  spending_pattern: string;
  income_range: string;
  county: string;
  town: string;
  estate: string;
  occupation: string;
  source_awareness: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save or update user basket preferences
 */
export async function saveUserBasketPreferences(
  userId: string,
  preferences: Omit<UserBasketPreferences, 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if preferences already exist
    const { data: existing } = await supabase
      .from('user_basket_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing preferences
      const { error } = await supabase
        .from('user_basket_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating preferences:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new preferences
      const { error } = await supabase
        .from('user_basket_preferences')
        .insert({
          user_id: userId,
          ...preferences,
        });

      if (error) {
        console.error('Error creating preferences:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving preferences:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get user basket preferences
 */
export async function getUserBasketPreferences(
  userId: string
): Promise<UserBasketPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_basket_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
}

/**
 * Get personalized product recommendations based on user preferences
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 10
) {
  try {
    const preferences = await getUserBasketPreferences(userId);
    
    if (!preferences) {
      return [];
    }

    // Build query based on preferences
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // Filter by user's preferred categories
    if (preferences.categories.length > 0) {
      query = query.in('category', preferences.categories.map(c => c.toLowerCase()));
    }

    // Limit results
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

/**
 * Get deals based on user's spending pattern
 */
export async function getTimedDeals(userId: string) {
  try {
    const preferences = await getUserBasketPreferences(userId);
    
    if (!preferences) {
      return [];
    }

    const now = new Date();
    const dayOfMonth = now.getDate();
    const dayOfWeek = now.getDay();

    // Determine if user should see deals based on their spending pattern
    let showDeals = false;

    switch (preferences.spending_pattern) {
      case 'end-month':
        // Show deals from 25th to end of month
        showDeals = dayOfMonth >= 25;
        break;
      case 'mid-month':
        // Show deals from 10th to 20th
        showDeals = dayOfMonth >= 10 && dayOfMonth <= 20;
        break;
      case 'weekend':
        // Show deals on Saturday (6) and Sunday (0)
        showDeals = dayOfWeek === 0 || dayOfWeek === 6;
        break;
      case 'anytime':
      default:
        showDeals = true;
        break;
    }

    if (!showDeals) {
      return [];
    }

    // Get featured deals
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('featured', true)
      .limit(8);

    if (error) {
      console.error('Error fetching timed deals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching timed deals:', error);
    return [];
  }
}
