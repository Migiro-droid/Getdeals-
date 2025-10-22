import { VercelRequest, VercelResponse } from '@vercel/node';
import emailDeliveryService from '../../src/services/email-delivery-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { action, trackingId } = req.query;

    if (action === 'status' && trackingId) {
      try {
        const status = await emailDeliveryService.getDeliveryStatus(String(trackingId));
        return res.status(200).json({
          success: true,
          data: status
        });
      } catch (error) {
        console.error('Error fetching status:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch delivery status'
        });
      }
    }

    if (action === 'failed') {
      try {
        const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
        const failed = await emailDeliveryService.getFailedEmails(limit);
        return res.status(200).json({
          success: true,
          data: failed,
          count: failed.length
        });
      } catch (error) {
        console.error('Error fetching failed emails:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch failed emails'
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: status (with trackingId) or failed'
    });
  }

  if (req.method === 'POST') {
    const { action, trackingId, ...body } = req.body;

    if (action === 'retry' && trackingId) {
      try {
        const result = await emailDeliveryService.retryFailedEmail(trackingId);
        return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
        console.error('Error retrying email:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to retry email'
        });
      }
    }

    if (action === 'send') {
      const { type, recipientEmail, data, priority = 'normal' } = body;

      if (!type || !recipientEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, recipientEmail'
        });
      }

      try {
        const result = await emailDeliveryService.sendWithRetry({
          type,
          recipientEmail,
          data,
          priority,
          trackDelivery: true
        });

        return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send email'
        });
      }
    }

    if (action === 'queue') {
      const { type, recipientEmail, data, priority = 'normal' } = body;

      if (!type || !recipientEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, recipientEmail'
        });
      }

      try {
        const trackingId = await emailDeliveryService.queueEmail({
          type,
          recipientEmail,
          data,
          priority,
          trackDelivery: true
        });

        return res.status(202).json({
          success: true,
          message: 'Email queued for delivery',
          trackingId
        });
      } catch (error) {
        console.error('Error queuing email:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to queue email'
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: send, queue, or retry'
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
