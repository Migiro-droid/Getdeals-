import { VercelRequest, VercelResponse } from '@vercel/node';
import BrevoService from '../../src/services/brevo-service-fetch.js';

const brevoService = new BrevoService();

interface EmailData {
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    customerName?: string;
    orderNumber?: string;
    total?: number;
    items?: unknown[];
    deliveryAddress?: string;
    paymentMethod?: string;
    createdAt?: string;
    transactionId?: string;
    amount?: number;
    method?: string;
    paidAt?: string;
    email?: string;
    name?: string;
    organization?: string;
    resetLink?: string;
    expiryTime?: string;
    [key: string]: unknown; 
}

interface EmailRequestBody {
    type: 'order-confirmation' | 'payment-confirmation' | 'welcome' | 'password-reset' | 'simple';
    recipientEmail: string;
    data: EmailData;
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    details?: unknown;
    data?: unknown;
    [key: string]: unknown; 
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            message: 'Brevo Email Service',
            endpoints: {
                'POST /api/email/send': 'Send transactional emails',
                'POST /api/email/add-contact': 'Add contact to Brevo list'
            }
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { type, recipientEmail, data }: EmailRequestBody = req.body;

        console.log('📧 Email send request:', { type, recipientEmail, hasData: !!data });

        if (!type || !recipientEmail) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: type, recipientEmail' 
            });
        }

        let result: EmailResult;
        
        switch (type) {
            case 'order-confirmation':
                console.log('📦 Sending order confirmation email...');
                result = await brevoService.sendOrderConfirmation(recipientEmail, data);
                break;
            case 'payment-confirmation':
                console.log('💳 Sending payment confirmation email...');
                result = await brevoService.sendPaymentConfirmation(recipientEmail, data);
                break;
            case 'welcome':
                console.log('👋 Sending welcome email...');
                result = await brevoService.sendWelcomeEmail(recipientEmail, data);
                break;
            case 'password-reset':
                console.log('🔑 Sending password reset email...');
                result = await brevoService.sendPasswordReset(recipientEmail, data);
                break;
            case 'simple':
                console.log('📝 Sending simple email...');
                result = await brevoService.sendSimpleEmail(
                    recipientEmail,
                    data.subject!,
                    data.htmlContent!,
                    data.textContent || ''
                );
                break;
            default:
                console.error('❌ Invalid email type:', type);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid email type. Must be one of: order-confirmation, payment-confirmation, welcome, password-reset, simple' 
                });
        }

        console.log('📧 Email result:', { success: result.success, messageId: result.messageId, error: result.error });

        return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
        console.error('❌ Email API error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to send email',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}