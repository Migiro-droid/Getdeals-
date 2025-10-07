import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Test endpoint for Rukisha webhook validation
 * GET: Returns success message to verify endpoint is accessible
 * POST: Accepts test callback data and returns formatted response
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();
  
  // Handle GET - for URL validation
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Rukisha webhook test endpoint is active',
      timestamp,
      endpoint: '/api/webhooks/test-rukisha',
      production_endpoint: '/api/webhooks/rukisha',
      accepts: {
        methods: ['GET', 'POST', 'OPTIONS'],
        content_type: 'application/json'
      },
      expected_fields: [
        'TransactionID',
        'TransactionType',
        'Amount',
        'Phone',
        'Status',
        'ConfirmationCode',
        'Timestamp',
        'Reference (optional)',
        'Description (optional)'
      ]
    });
  }

  // Handle OPTIONS - for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      success: true,
      message: 'CORS preflight successful'
    });
  }

  // Handle POST - for testing callback data
  if (req.method === 'POST') {
    console.log('🧪 Test webhook received at:', timestamp);
    console.log('📦 Headers:', JSON.stringify(req.headers));
    console.log('📦 Body:', JSON.stringify(req.body));

    const callbackData = req.body;

    // Validate it's a proper object
    if (!callbackData || typeof callbackData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected JSON object.',
        received_type: typeof callbackData,
        timestamp
      });
    }

    // Check for required fields
    const requiredFields = ['TransactionID', 'Status'];
    const missingFields = requiredFields.filter(field => !callbackData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missing_fields: missingFields,
        received_fields: Object.keys(callbackData),
        received_data: callbackData,
        timestamp
      });
    }

    // All good! Return success
    return res.status(200).json({
      success: true,
      message: 'Test callback received and validated successfully',
      received_data: callbackData,
      validation: {
        has_transaction_id: !!callbackData.TransactionID,
        has_status: !!callbackData.Status,
        has_amount: !!callbackData.Amount,
        has_phone: !!callbackData.Phone,
        has_confirmation_code: !!callbackData.ConfirmationCode,
        status_value: callbackData.Status
      },
      timestamp,
      note: 'This is a TEST endpoint. Production endpoint is /api/webhooks/rukisha'
    });
  }

  // Other methods not allowed
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`,
    allowed_methods: ['GET', 'POST', 'OPTIONS']
  });
}
