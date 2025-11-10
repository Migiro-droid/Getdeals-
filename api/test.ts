import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const hasDbUrl = !!process.env.DATABASE_URL;
    
    return res.status(200).json({
      message: 'API test endpoint working',
      method: req.method,
      hasDbUrl: hasDbUrl,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version
    });
  } catch (error) {
    console.error('Test API Error:', error);
    return res.status(500).json({
      error: 'Test endpoint failed',
      message: String(error),
      stack: (error as Error).stack
    });
  }
}
