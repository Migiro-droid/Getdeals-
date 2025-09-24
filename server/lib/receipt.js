import EmailService from './email.js';

class ReceiptService {
  constructor() {
    this.emailService = new EmailService();
  }

  formatCurrency(amount) {
    return `KES ${amount.toLocaleString()}`;
  }

  formatDateTime(date) {
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi'
    });
  }

  generateReceiptHTML(receiptData) {
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      transactionId,
      orderDate,
      paymentDate,
      deliveryMethod,
      deliveryAddress,
      pickupLocation
    } = receiptData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #e74c3c; margin-bottom: 5px; }
            .receipt-title { font-size: 24px; color: #2c3e50; margin: 20px 0 10px 0; }
            .receipt-subtitle { color: #7f8c8d; font-size: 14px; }
            .section { margin: 25px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1; padding-bottom: 8px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
            .info-label { font-weight: bold; color: #34495e; }
            .info-value { text-align: right; }
            .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items-table th { background: #ecf0f1; padding: 12px 8px; text-align: left; font-weight: bold; color: #2c3e50; }
            .items-table td { padding: 10px 8px; border-bottom: 1px solid #ecf0f1; }
            .items-table tr:nth-child(even) { background: #f8f9fa; }
            .total-section { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: #e74c3c; border-top: 2px solid #e74c3c; padding-top: 10px; margin-top: 15px; }
            .payment-info { background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; color: #7f8c8d; font-size: 12px; }
            .footer-logo { font-size: 16px; font-weight: bold; color: #e74c3c; margin-bottom: 10px; }
            .qr-code { text-align: center; margin: 20px 0; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">GetDeals Kenya</div>
            <div style="font-size: 14px; color: #7f8c8d;">Your Trusted Online Marketplace</div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div class="receipt-subtitle">Electronic Receipt - Keep for your records</div>
        </div>

        <div class="section">
            <div class="section-title">Order Information</div>
            <div class="info-row">
                <span class="info-label">Order Number:</span>
                <span class="info-value">${orderNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span class="info-value">${this.formatDateTime(orderDate)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${this.formatDateTime(paymentDate)}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${customerName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${customerEmail}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${customerPhone}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Items Purchased</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${this.formatCurrency(item.price)}</td>
                            <td style="text-align: right;">${this.formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Delivery Information</div>
            <div class="info-row">
                <span class="info-label">Delivery Method:</span>
                <span class="info-value">${deliveryMethod === 'speedy' ? 'Speedy Delivery' : 'Pickup'}</span>
            </div>
            ${deliveryAddress ? `
            <div class="info-row">
                <span class="info-label">Delivery Address:</span>
                <span class="info-value">${deliveryAddress}</span>
            </div>
            ` : ''}
            ${pickupLocation ? `
            <div class="info-row">
                <span class="info-label">Pickup Location:</span>
                <span class="info-value">${pickupLocation}</span>
            </div>
            ` : ''}
        </div>

        <div class="total-section">
            <div class="section-title">Payment Summary</div>
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${this.formatCurrency(subtotal)}</span>
            </div>
            <div class="total-row">
                <span>Delivery Fee:</span>
                <span>${this.formatCurrency(deliveryFee)}</span>
            </div>
            <div class="total-row grand-total">
                <span>TOTAL PAID:</span>
                <span>${this.formatCurrency(total)}</span>
            </div>
        </div>

        <div class="payment-info">
            <div class="section-title" style="border: none; margin-bottom: 10px; color: #27ae60;">✅ Payment Confirmed</div>
            <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${paymentMethod.toUpperCase()}</span>
            </div>
            ${transactionId ? `
            <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${transactionId}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value" style="color: #27ae60; font-weight: bold;">PAID</span>
            </div>
        </div>

        <div class="footer">
            <div class="footer-logo">GetDeals Kenya</div>
            <div>Thank you for your business!</div>
            <div style="margin-top: 10px;">
                Email: support@getdeals.co.ke | Phone: +254 728 322 355
            </div>
            <div style="margin-top: 10px; font-size: 10px;">
                This is an electronically generated receipt. No signature required.
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendEReceipt(receiptData) {
    const { customerEmail, orderNumber } = receiptData;
    
    const receiptHTML = this.generateReceiptHTML(receiptData);
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: customerEmail,
      subject: `E-Receipt - Order #${orderNumber} - GetDeals Kenya`,
      html: receiptHTML,
    };

    try {
      const result = await this.emailService.transporter.sendMail(mailOptions);
      console.log(`✅ E-receipt sent successfully for order ${orderNumber}`);
      return { 
        success: true, 
        messageId: result.messageId,
        orderNumber 
      };
    } catch (error) {
      console.error(`❌ Failed to send e-receipt for order ${orderNumber}:`, error);
      return { 
        success: false, 
        error: error.message,
        orderNumber 
      };
    }
  }

  async generateReceiptData(order, paymentDetails = {}) {
    // Transform order data into receipt format
    const receiptData = {
      orderNumber: order.orderNumber || order.id,
      customerName: order.user?.name || `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() || 'Customer',
      customerEmail: order.user?.email || order.customer?.email,
      customerPhone: order.mpesa_phone || order.customer?.phone || order.phone,
      items: order.items.map(item => ({
        name: item.product?.name || item.name,
        quantity: item.quantity,
        price: item.price || item.product?.price || 0
      })),
      subtotal: order.total - (order.delivery_fee || 0),
      deliveryFee: order.delivery_fee || 0,
      total: order.total,
      paymentMethod: order.payment_method || 'M-Pesa',
      transactionId: paymentDetails.transactionId || paymentDetails.mpesaReceiptNumber,
      orderDate: order.created_at,
      paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
      deliveryMethod: order.delivery_method,
      deliveryAddress: order.delivery_address,
      pickupLocation: order.pickup_location
    };

    return receiptData;
  }
}

export default ReceiptService;