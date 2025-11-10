import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface SiteSettings {
  blackFridayCountdownDate?: string;
  blackFridayEnabled: boolean;
  maintenanceMode: boolean;
  supportPhone: string;
  supportEmail: string;
  location: string;
  shopByBrandEnabled: boolean;
  brands: Array<{
    id: string;
    name: string;
    image: string;
    category: string;
  }>;
  flashSaleEnabled: boolean;
  flashSaleStartDate?: string;
  flashSaleEndDate?: string;
  flashSaleDiscount: number;
}

const defaultSettings: SiteSettings = {
  blackFridayEnabled: true,
  blackFridayCountdownDate: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString(),
  maintenanceMode: false,
  supportPhone: '+254 700 123 456',
  supportEmail: 'info@getdeals.co.ke',
  location: 'Karen Green, Nairobi, Kenya',
  shopByBrandEnabled: true,
  flashSaleEnabled: true,
  flashSaleStartDate: new Date().toISOString(),
  flashSaleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  flashSaleDiscount: 50,
  brands: [
    { id: '1', name: 'Brookside', image: 'https://www.brookside.co.ke/wp-content/uploads/2022/03/Brookside-Logo.png', category: 'Dairy' },
    { id: '2', name: 'Tusker', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/48/Tusker_Logo.svg/1200px-Tusker_Logo.svg.png', category: 'Beverages' },
    { id: '3', name: 'Kenya Cane', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=400&h=400&fit=crop', category: 'Sugar' },
    { id: '4', name: 'Pembe', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', category: 'Flour' },
    { id: '5', name: 'Elianto', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', category: 'Cooking Oil' },
    { id: '6', name: 'Ketepa', image: 'https://www.ketepa.co.ke/wp-content/uploads/2020/01/Ketepa-Logo.png', category: 'Tea' },
    { id: '7', name: 'KCC', image: 'https://upload.wikimedia.org/wikipedia/en/8/84/New_KCC_Logo.png', category: 'Dairy' },
    { id: '8', name: 'Mumias Sugar', image: 'https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=400&h=400&fit=crop', category: 'Sugar' },
    { id: '9', name: 'Omo', image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop', category: 'Detergent' },
    { id: '10', name: 'Soko', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', category: 'Maize Meal' },
    { id: '11', name: 'Fresh Fri', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', category: 'Cooking Oil' },
    { id: '12', name: 'Safaricom', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Safaricom_Logo.svg/2560px-Safaricom_Logo.svg.png', category: 'Airtime' },
  ],
};

async function getSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single();

    if (error) {
      console.warn('Failed to fetch settings from database, using defaults:', error);
      return defaultSettings;
    }

    if (data && data.settings) {
      return { ...defaultSettings, ...data.settings };
    }

    return defaultSettings;
  } catch (err) {
    console.error('Error fetching settings:', err);
    return defaultSettings;
  }
}


async function updateSettings(
  req: VercelRequest,
  res: VercelResponse,
  updates: Partial<SiteSettings>
): Promise<SiteSettings> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization');
    }

    const adminPin = process.env.VITE_ADMIN_PIN || '1234';
    const token = authHeader.substring(7);

    if (token !== `admin_${adminPin}`) {
      throw new Error('Invalid admin credentials');
    }

    const current = await getSettings();

    const updated = { ...current, ...updates };

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          id: 1,
          settings: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    return updated;
  } catch (err) {
    console.error('Error updating settings:', err);
    throw err;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const settings = await getSettings();
      res.status(200).json({ data: settings, error: null });
    } else if (req.method === 'POST' || req.method === 'PUT') {
      const updates = req.body as Partial<SiteSettings>;
      const updated = await updateSettings(req, res, updates);
      res.status(200).json({ data: updated, error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Settings endpoint error:', error);
    res.status(400).json({
      data: null,
      error: { message: error?.message || 'Failed to process request' },
    });
  }
}
