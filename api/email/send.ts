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

export async function POST(request: Request): Promise<Response> {
    try {
        const { type, recipientEmail, data }: EmailRequestBody = await request.json();

        let result: EmailResult;
        
        switch (type) {
            case 'order-confirmation':
                result = await brevoService.sendOrderConfirmation(recipientEmail, data);
                break;
            case 'payment-confirmation':
                result = await brevoService.sendPaymentConfirmation(recipientEmail, data);
                break;
            case 'welcome':
                result = await brevoService.sendWelcomeEmail(recipientEmail, data);
                break;
            case 'password-reset':
                result = await brevoService.sendPasswordReset(recipientEmail, data);
                break;
            case 'simple':
                result = await brevoService.sendSimpleEmail(
                    recipientEmail,
                    data.subject!,
                    data.htmlContent!,
                    data.textContent!
                );
                break;
            default:
                return new Response(
                    JSON.stringify({ success: false, error: 'Invalid email type' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
        }

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Email API error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Failed to send email' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: 'Brevo Email Service',
      endpoints: {
        'POST /api/email/send': 'Send transactional emails',
        'POST /api/email/add-contact': 'Add contact to Brevo list'
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}