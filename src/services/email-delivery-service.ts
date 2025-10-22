import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailDeliveryRecord {
  recipient_email: string;
  email_type: string;
  subject: string;
  attempt_count: number;
  max_retries: number;
  status: 'pending' | 'sending' | 'delivered' | 'failed' | 'bounced';
  message_id?: string;
  error_message?: string;
  last_attempt_at?: string;
  next_retry_at?: string;
  delivered_at?: string;
  metadata: Record<string, any>;
}

interface SendEmailOptions {
  type: 'order-confirmation' | 'payment-confirmation' | 'welcome' | 'password-reset' | 'simple';
  recipientEmail: string;
  data: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  maxRetries?: number;
  trackDelivery?: boolean;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  trackingId?: string;
  deliveryStatus?: string;
}

/**
 * Email Delivery Service with Retry Logic and Tracking
 * Ensures order receipts and critical emails always reach customers
 */
class EmailDeliveryService {
  private maxRetries = 5;
  private retryDelayMs = {
    first: 5000,      // 5 seconds
    second: 60000,    // 1 minute
    third: 300000,    // 5 minutes
    fourth: 1800000,  // 30 minutes
    fifth: 3600000    // 1 hour
  };

  /**
   * Send email with automatic retry logic and delivery tracking
   */
  async sendWithRetry(options: SendEmailOptions): Promise<EmailResult> {
    const {
      type,
      recipientEmail,
      data,
      priority = 'normal',
      maxRetries = this.maxRetries,
      trackDelivery = true
    } = options;

    console.log(`📧 Starting email delivery: ${type} to ${recipientEmail}`);

    // Create delivery tracking record
    let trackingId = '';
    if (trackDelivery) {
      trackingId = await this.createDeliveryRecord({
        recipient_email: recipientEmail,
        email_type: type,
        subject: data.subject || this.getSubjectForType(type),
        attempt_count: 0,
        max_retries: maxRetries,
        status: 'pending',
        metadata: { priority, originalData: data }
      });
      console.log(`📋 Delivery tracking created: ${trackingId}`);
    }

    // Attempt to send email
    let lastError: Error | null = null;
    let messageId: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Email send attempt ${attempt}/${maxRetries} for ${recipientEmail}`);

        // Call email API with retry
        const result = await this.sendEmailWithTimeout(
          type,
          recipientEmail,
          data,
          10000 // 10 second timeout
        );

        if (result.success) {
          messageId = result.messageId;
          console.log(`✅ Email delivered successfully: ${messageId}`);

          // Update tracking record
          if (trackingId) {
            await this.updateDeliveryRecord(trackingId, {
              status: 'delivered',
              message_id: messageId,
              attempt_count: attempt,
              delivered_at: new Date().toISOString()
            });
          }

          return {
            success: true,
            messageId,
            trackingId,
            deliveryStatus: 'delivered'
          };
        }

        // If send failed, prepare for retry
        lastError = new Error(result.error || 'Unknown error');
        console.log(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);

        // Calculate backoff delay
        const backoffDelay = this.calculateBackoff(attempt, priority);
        
        // Update tracking record with retry info
        if (trackingId) {
          const nextRetryAt = new Date(Date.now() + backoffDelay).toISOString();
          await this.updateDeliveryRecord(trackingId, {
            status: 'pending',
            attempt_count: attempt,
            error_message: lastError.message,
            last_attempt_at: new Date().toISOString(),
            next_retry_at: nextRetryAt
          });
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
          await this.sleep(backoffDelay);
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Error on attempt ${attempt}: ${lastError.message}`);

        if (attempt < maxRetries) {
          const backoffDelay = this.calculateBackoff(attempt, priority);
          if (trackingId) {
            const nextRetryAt = new Date(Date.now() + backoffDelay).toISOString();
            await this.updateDeliveryRecord(trackingId, {
              status: 'pending',
              attempt_count: attempt,
              error_message: lastError.message,
              last_attempt_at: new Date().toISOString(),
              next_retry_at: nextRetryAt
            });
          }
          await this.sleep(backoffDelay);
        }
      }
    }

    // All retries exhausted
    console.error(`❌ Failed to send email after ${maxRetries} attempts: ${lastError?.message}`);

    if (trackingId) {
      await this.updateDeliveryRecord(trackingId, {
        status: 'failed',
        attempt_count: maxRetries,
        error_message: lastError?.message || 'Maximum retries exceeded'
      });
    }

    return {
      success: false,
      error: `Failed to deliver email after ${maxRetries} attempts: ${lastError?.message}`,
      trackingId,
      deliveryStatus: 'failed'
    };
  }

  /**
   * Queue email for delivery (async, doesn't block)
   */
  async queueEmail(options: SendEmailOptions): Promise<string> {
    const trackingId = await this.createDeliveryRecord({
      recipient_email: options.recipientEmail,
      email_type: options.type,
      subject: options.data.subject || this.getSubjectForType(options.type),
      attempt_count: 0,
      max_retries: options.maxRetries || this.maxRetries,
      status: 'pending',
      metadata: { 
        priority: options.priority || 'normal',
        originalData: options.data,
        queued_at: new Date().toISOString()
      }
    });

    // Start async delivery in background
    this.sendWithRetry(options).catch(error => {
      console.error(`Background delivery failed for ${trackingId}:`, error);
    });

    return trackingId;
  }

  /**
   * Send email with timeout protection
   */
  private async sendEmailWithTimeout(
    type: string,
    email: string,
    data: any,
    timeoutMs: number
  ): Promise<EmailResult> {
    return new Promise((resolve) => {
      let completed = false;
      const timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          resolve({
            success: false,
            error: `Email send timeout after ${timeoutMs}ms`
          });
        }
      }, timeoutMs);

      this.callEmailAPI(type, email, data)
        .then(result => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        })
        .catch(error => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            resolve({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        });
    });
  }

  /**
   * Call the email API endpoint
   */
  private async callEmailAPI(
    type: string,
    email: string,
    data: any
  ): Promise<EmailResult> {
    const baseUrl = process.env.FRONTEND_URL || 'https://getdeals.co.ke';
    
    try {
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          recipientEmail: email,
          data
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API returned ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.success 
        ? { success: true, messageId: result.messageId }
        : { success: false, error: result.error };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create delivery tracking record in Supabase
   */
  private async createDeliveryRecord(record: EmailDeliveryRecord): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('email_delivery_tracking')
        .insert([{
          ...record,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error creating delivery record:', error);
        return 'tracking-' + Date.now();
      }

      return data?.id || 'tracking-' + Date.now();
    } catch (error) {
      console.error('Exception creating delivery record:', error);
      return 'tracking-' + Date.now();
    }
  }

  /**
   * Update delivery tracking record
   */
  private async updateDeliveryRecord(
    trackingId: string,
    updates: Partial<EmailDeliveryRecord>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_delivery_tracking')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', trackingId);

      if (error) {
        console.error('Error updating delivery record:', error);
      }
    } catch (error) {
      console.error('Exception updating delivery record:', error);
    }
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private calculateBackoff(attempt: number, priority: string): number {
    const baseDelays: Record<number, number> = {
      1: this.retryDelayMs.first,
      2: this.retryDelayMs.second,
      3: this.retryDelayMs.third,
      4: this.retryDelayMs.fourth,
      5: this.retryDelayMs.fifth
    };

    let delay = baseDelays[attempt] || this.retryDelayMs.fifth;

    // Priority adjustments
    if (priority === 'high') {
      delay *= 0.5; // High priority: half the delay
    } else if (priority === 'low') {
      delay *= 2; // Low priority: double the delay
    }

    // Add random jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.max(1000, delay + jitter); // Minimum 1 second
  }

  /**
   * Get subject line for email type
   */
  private getSubjectForType(type: string): string {
    const subjects: Record<string, string> = {
      'order-confirmation': 'Your Order Has Been Confirmed - GetDeals',
      'payment-confirmation': 'Payment Received - GetDeals',
      'welcome': 'Welcome to GetDeals Kenya',
      'password-reset': 'Reset Your GetDeals Password',
      'simple': 'Message from GetDeals'
    };
    return subjects[type] || 'Message from GetDeals';
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get delivery status for tracking ID
   */
  async getDeliveryStatus(trackingId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('email_delivery_tracking')
        .select('*')
        .eq('id', trackingId)
        .single();

      if (error) {
        return { error: 'Tracking record not found' };
      }

      return data;
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      return { error: 'Failed to fetch status' };
    }
  }

  /**
   * Get failed emails for retry
   */
  async getFailedEmails(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_delivery_tracking')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching failed emails:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching failed emails:', error);
      return [];
    }
  }

  /**
   * Retry failed email
   */
  async retryFailedEmail(trackingId: string): Promise<EmailResult> {
    try {
      const record = await this.getDeliveryStatus(trackingId);
      
      if (!record || record.error) {
        return { success: false, error: 'Tracking record not found' };
      }

      return await this.sendWithRetry({
        type: record.email_type,
        recipientEmail: record.recipient_email,
        data: record.metadata?.originalData || {},
        priority: record.metadata?.priority || 'normal',
        maxRetries: 3, // Fewer retries for manual retry
        trackDelivery: false
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export default new EmailDeliveryService();
