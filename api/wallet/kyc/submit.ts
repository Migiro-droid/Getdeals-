import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';
import { WalletKycSubmission } from '../../../src/types/wallet-kyc';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, idNumber, phoneNumber, email, kraPin, idType }: WalletKycSubmission = req.body;

    // Validate required fields
    if (!fullName || !idNumber || !phoneNumber || !email || !kraPin || !idType) {
      return res.status(400).json({ 
        error: 'All fields are required',
        required: ['fullName', 'idNumber', 'phoneNumber', 'email', 'kraPin', 'idType']
      });
    }

    // Validate KRA PIN format (personal PINs start with 'A')
    const kraPinRegex = /^A\d{9}[A-Z]$/i;
    if (!kraPinRegex.test(kraPin)) {
      return res.status(400).json({ 
        error: 'Invalid KRA PIN format. Personal KRA PINs should start with A followed by 9 digits and a letter' 
      });
    }

    // Validate ID type
    if (!['national_id', 'passport'].includes(idType)) {
      return res.status(400).json({ 
        error: 'Invalid ID type. Must be either national_id or passport' 
      });
    }

    // Validate National ID format (8 digits) or passport format
    if (idType === 'national_id' && !/^\d{8}$/.test(idNumber)) {
      return res.status(400).json({ 
        error: 'Invalid National ID format. Must be 8 digits' 
      });
    }

    // Validate phone number format
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Must be a valid Kenyan phone number' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Get user ID from auth header (you'll need to implement auth middleware)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    // Check if user already has KYC data
    const { data: existingKyc, error: checkError } = await supabase
      .from('wallet_kyc')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing KYC:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingKyc) {
      if (existingKyc.status === 'verified') {
        return res.status(400).json({ 
          error: 'KYC already verified for this user' 
        });
      } else if (existingKyc.status === 'pending_verification') {
        return res.status(400).json({ 
          error: 'KYC submission already pending verification' 
        });
      }
    }

    // Insert or update KYC data
    const kycData = {
      user_id: user.id,
      full_name: fullName,
      id_number: idNumber,
      phone_number: phoneNumber,
      email: email,
      kra_pin: kraPin.toUpperCase(),
      id_type: idType,
      status: 'pending_verification'
    };

    const { data, error } = existingKyc
      ? await supabase
          .from('wallet_kyc')
          .update(kycData)
          .eq('user_id', user.id)
          .select()
          .single()
      : await supabase
          .from('wallet_kyc')
          .insert(kycData)
          .select()
          .single();

    if (error) {
      console.error('Error saving KYC data:', error);
      return res.status(500).json({ error: 'Failed to save KYC data' });
    }

    // Log the KYC submission for audit purposes
    console.log(`KYC submitted for user ${user.id}:`, {
      fullName,
      idType,
      email,
      phoneNumber,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to:
    // 1. Send notification to admin for manual verification
    // 2. Integrate with automated KYC verification service
    // 3. Send confirmation email/SMS to user

    return res.status(201).json({
      success: true,
      message: 'KYC data submitted successfully',
      data: {
        id: data.id,
        status: data.status,
        submittedAt: data.created_at
      }
    });

  } catch (error) {
    console.error('Error in KYC submission:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}