// Production M-Pesa Service Configuration
export const MPESA_CONFIG = {
  // Use environment variable or fallback to local development URL
  SERVICE_URL: import.meta.env.VITE_MPESA_SERVICE_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    STK_PUSH: '/api/payments/mpesa/stk-push',
    STATUS_CHECK: '/api/payments/mpesa/query',
    HEALTH: '/health'
  },

  // Configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Enhanced M-Pesa service with retry logic
export class MpesaPaymentService {
  static async initiatePayment(paymentData) {
    const { phoneNumber, amount, orderReference, description } = paymentData;
    
    for (let attempt = 1; attempt <= MPESA_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(
          `${MPESA_CONFIG.SERVICE_URL}${MPESA_CONFIG.ENDPOINTS.STK_PUSH}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber,
              amount,
              orderReference,
              description: description || `Payment for GetDeals order ${orderReference}`,
            }),
            // Note: Fetch doesn't support timeout, use AbortController in production
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          return { success: true, data: result };
        } else {
          throw new Error(result.error || 'Payment initiation failed');
        }
      } catch (error) {
        console.error(`Payment attempt ${attempt} failed:`, error.message);
        
        if (attempt === MPESA_CONFIG.RETRY_ATTEMPTS) {
          return { 
            success: false, 
            error: `Payment failed after ${attempt} attempts: ${error.message}` 
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, MPESA_CONFIG.RETRY_DELAY * attempt));
      }
    }
  }

  static async checkPaymentStatus(checkoutRequestId) {
    try {
      const response = await fetch(
        `${MPESA_CONFIG.SERVICE_URL}${MPESA_CONFIG.ENDPOINTS.STATUS_CHECK}/${checkoutRequestId}`,
        {
          method: 'GET',
          // Note: Fetch doesn't support timeout, use AbortController in production
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Payment status check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  static async healthCheck() {
    try {
      const response = await fetch(
        `${MPESA_CONFIG.SERVICE_URL}${MPESA_CONFIG.ENDPOINTS.HEALTH}`,
        { method: 'GET' }
      );
      
      return response.ok;
    } catch (error) {
      console.error('M-Pesa service health check failed:', error.message);
      return false;
    }
  }
}