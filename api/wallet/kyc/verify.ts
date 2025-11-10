import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

interface AdminUser {
  role: string;
}

interface KYCRecord {
  id: string;
  user_id: string;
  full_name: string;
  status: string;
  verified_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  verification_notes: string | null;
  updated_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { kycId, status, verificationNotes, rejectionReason } = req.body;

    if (!kycId || !status) {
      return res.status(400).json({ 
        error: 'KYC ID and status are required' 
      });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be either verified or rejected' 
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ 
        error: 'Rejection reason is required when rejecting KYC' 
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updateData: Record<string, any> = {
      status,
      verification_notes: verificationNotes || null,
      updated_at: new Date().toISOString()
    };

    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString();
      updateData.rejected_at = null;
      updateData.rejection_reason = null;
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = rejectionReason;
      updateData.verified_at = null;
    }


    const { data, error } = await (supabase as any)
      .from('wallet_kyc')
      .update(updateData)
      .eq('id', kycId)
      .select(`
        id,
        user_id,
        full_name,
        status,
        verified_at,
        rejected_at,
        rejection_reason,
        verification_notes,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating KYC status:', error);
      return res.status(500).json({ error: 'Failed to update KYC status' });
    }

    if (!data) {
      return res.status(404).json({ error: 'KYC record not found' });
    }

    console.log(`KYC ${status} by admin ${user.id}:`, {
      kycId,
      userId: data.user_id,
      status,
      verificationNotes,
      rejectionReason,
      timestamp: new Date().toISOString()
    });



    return res.status(200).json({
      success: true,
      message: `KYC ${status} successfully`,
      data: {
        id: data.id,
        userId: data.user_id,
        fullName: data.full_name,
        status: data.status,
        verifiedAt: data.verified_at,
        rejectedAt: data.rejected_at,
        rejectionReason: data.rejection_reason,
        verificationNotes: data.verification_notes,
        updatedAt: data.updated_at
      }
    });

  } catch (error) {
    console.error('Error in KYC verification:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}