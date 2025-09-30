import BrevoService from '../../src/services/brevo-service-fetch.js';

const brevoService = new BrevoService();

interface AddContactRequestBody {
    email: string;
    firstName?: string;
    lastName?: string;
    attributes?: Record<string, unknown>;
}

interface AddContactResult {
    success: boolean;
    [key: string]: unknown;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const { email, firstName, lastName, attributes = {} }: AddContactRequestBody = await request.json();

        if (!email) {
            return new Response(
                JSON.stringify({ success: false, error: 'Email is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const listId: number = parseInt(process.env.BREVO_CUSTOMERS_LIST_ID ?? '1');
        
        const result: AddContactResult = await brevoService.addContactToList(
            email,
            firstName || '',
            lastName || '',
            listId,
            {
                SIGNUP_DATE: new Date().toISOString(),
                ...attributes
            }
        );

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Add contact API error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Failed to add contact' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}