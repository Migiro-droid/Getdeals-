import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET request.' 
    });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'local',
    tests: {}
  };

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;

    results.tests.environmentVariables = {
      SMTP_HOST: smtpHost ? 'Set' : 'Missing',
      SMTP_PORT: smtpPort ? `Set (${smtpPort})` : 'Missing',
      SMTP_USER: smtpUser ? `Set (${smtpUser.substring(0, 3)}...${smtpUser.substring(smtpUser.length - 3)})` : '❌ Missing',
      SMTP_PASS: smtpPass ? `Set (${smtpPass.length} characters)` : 'ssing',
      SMTP_FROM: smtpFrom ? `Set (${smtpFrom})` : 'Using default',
    };

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({
        success: false,
        error: 'SMTP not configured. Please set environment variables in Vercel.',
        ...results,
        recommendation: 'Go to Vercel Dashboard → Settings → Environment Variables and add SMTP_HOST, SMTP_USER, SMTP_PASS'
      });
    }

    results.tests.transporterCreation = 'Success';
    
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: false, 
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: true 
      },
      logger: false, 
    });

    
    try {
      await transporter.verify();
      results.tests.smtpConnection = ' Verified - Credentials are correct';
      results.success = true;
      results.message = 'SMTP configuration is working correctly! You can send emails.';
      
      return res.status(200).json(results);
    } catch (verifyError: any) {
      results.tests.smtpConnection = ` Failed: ${verifyError.message}`;
      results.success = false;
      
      if (verifyError.code === 'EAUTH') {
        results.error = 'SMTP Authentication Failed';
        results.reason = 'Your SMTP username or password is incorrect';
        results.recommendation = [
          'Double-check your SMTP_USER and SMTP_PASS in Vercel environment variables',
          'For Gmail: Use App Password (16 characters), not regular password',
          'For Brevo: Use SMTP Key from dashboard, not account password',
          'For SendGrid: Username must be literally "apikey"',
          'After updating, redeploy your Vercel project'
        ];
      } else if (verifyError.code === 'ECONNECTION' || verifyError.code === 'ETIMEDOUT') {
        results.error = 'SMTP Connection Failed';
        results.reason = 'Cannot connect to SMTP server';
        results.recommendation = [
          'Check if SMTP_HOST is correct',
          'Verify SMTP_PORT is correct (usually 587 or 465)',
          'Check if your SMTP provider allows connections from Vercel IPs'
        ];
      } else {
        results.error = 'SMTP Test Failed';
        results.reason = verifyError.message;
      }
      
      return res.status(500).json(results);
    }

  } catch (error: any) {
    results.success = false;
    results.error = 'Unexpected error during SMTP test';
    results.details = error.message;
    
    return res.status(500).json(results);
  }
}
