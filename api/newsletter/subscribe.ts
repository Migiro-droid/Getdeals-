import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role (for server-side operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Supabase Service Key:', supabaseServiceKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    console.log('Newsletter subscription request received for:', email);

    // Validate email
    if (!email || typeof email !== 'string') {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes("@")) {
      console.log('Email missing @ symbol:', trimmedEmail);
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log('Email regex validation failed:', trimmedEmail);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Checking if subscriber already exists...');

    // Check if email already exists in newsletter_subscribers
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', trimmedEmail.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking subscriber:', checkError);
      return res.status(500).json({ error: 'Database error: ' + checkError.message });
    }

    // If subscriber already exists, return success (avoid duplicates)
    if (existingSubscriber) {
      console.log('Email already subscribed:', trimmedEmail);
      return res.status(200).json({ 
        success: true, 
        message: 'Email already subscribed',
        isNewSubscriber: false 
      });
    }

    console.log('Inserting new subscriber...');

    // Insert new subscriber
    const { error: insertError, data } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email: trimmedEmail.toLowerCase(),
          subscribed_at: new Date().toISOString(),
          status: 'active',
        }
      ])
      .select();

    if (insertError) {
      console.error('Error subscribing to newsletter:', insertError);
      return res.status(500).json({ error: 'Failed to subscribe: ' + insertError.message });
    }

    console.log('New newsletter subscriber added:', trimmedEmail);

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      isNewSubscriber: true,
    });

  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    });
  }
}
