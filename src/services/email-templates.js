// Fallback email templates when Brevo templates aren't configured
class EmailTemplates {
  static getWelcomeEmail(customerName, organization) {
    const subject = 'Welcome to GetDeals Kenya! 🎉';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Welcome to GetDeals Kenya</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Welcome to GetDeals Kenya!</h1>
              <p>Your premium shopping experience starts here</p>
          </div>
          <div class="content">
              <h2>Hello ${customerName}! 👋</h2>
              <p>We're thrilled to welcome you to GetDeals Kenya, where quality meets affordability!</p>
              
              <p><strong>Your Account Details:</strong></p>
              <ul>
                  <li>Organization: ${organization}</li>
                  <li>Registration Date: ${new Date().toLocaleDateString()}</li>
              </ul>
              
              <p>🛍️ <strong>What's Next?</strong></p>
              <ul>
                  <li>Browse our extensive product catalog</li>
                  <li>Enjoy seamless M-Pesa payments</li>
                  <li>Track your orders in real-time</li>
                  <li>Get exclusive deals and offers</li>
              </ul>
              
              <a href="https://getdeals.co.ke" class="button">Start Shopping Now</a>
              
              <p>Need help? Reply to this email or contact our support team.</p>
          </div>
          <div class="footer">
              <p>GetDeals Kenya - Your Trusted Shopping Partner</p>
              <p>© ${new Date().getFullYear()} GetDeals Kenya. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Welcome to GetDeals Kenya, ${customerName}!
      
      We're thrilled to have you join our community of smart shoppers.
      
      Your Account Details:
      - Organization: ${organization}
      - Registration Date: ${new Date().toLocaleDateString()}
      
      What's Next?
      - Browse our extensive product catalog
      - Enjoy seamless M-Pesa payments  
      - Track your orders in real-time
      - Get exclusive deals and offers
      
      Start shopping: https://getdeals.co.ke
      
      Need help? Reply to this email or contact our support team.
      
      GetDeals Kenya - Your Trusted Shopping Partner
    `;
    
    return { subject, htmlContent, textContent };
  }

  static getPaymentConfirmationEmail(data) {
    const subject = `Payment Confirmed - ${data.transactionId} ✅`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Payment Confirmed</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00d4aa 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
              .amount { background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; border-left: 4px solid #00d4aa; }
              .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="success-icon">✅</div>
              <h1>Payment Confirmed!</h1>
              <p>Your payment has been successfully processed</p>
          </div>
          <div class="content">
              <h2>Hello ${data.customerName}!</h2>
              <p>Great news! Your payment has been confirmed and processed successfully.</p>
              
              <div class="amount">
                  <h3>Amount Paid</h3>
                  <h2 style="color: #00a085; margin: 0;">KES ${data.amount.toLocaleString()}</h2>
              </div>
              
              <div class="details">
                  <h3>Payment Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                      <tr><td><strong>Transaction ID:</strong></td><td>${data.transactionId}</td></tr>
                      <tr><td><strong>Order Number:</strong></td><td>${data.orderNumber}</td></tr>
                      <tr><td><strong>Payment Method:</strong></td><td>${data.paymentMethod}</td></tr>
                      <tr><td><strong>Date & Time:</strong></td><td>${new Date(data.paidAt).toLocaleString()}</td></tr>
                  </table>
              </div>
              
              <p>Your order is now being processed and you'll receive another email once it's ready for delivery.</p>
              
              <p>Keep this email as your payment receipt for your records.</p>
          </div>
          <div class="footer">
              <p>Thank you for choosing GetDeals Kenya!</p>
              <p>© ${new Date().getFullYear()} GetDeals Kenya. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
    
    return { subject, htmlContent, textContent: '' };
  }

  static getOrderConfirmationEmail(data) {
    const subject = `Order Confirmed - ${data.orderNumber} 📦`;
    const itemsHtml = Array.isArray(data.items) 
      ? data.items.map((item) => `
          <tr>
              <td>${item.name || 'Product'}</td>
              <td style="text-align: center;">${item.quantity || 1}</td>
              <td style="text-align: right;">KES ${(item.price || 0).toLocaleString()}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3">Order items details not available</td></tr>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .order-summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .items-table th, .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
              .items-table th { background: #f5f5f5; }
              .total { background: white; padding: 20px; border-radius: 5px; text-align: right; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Order Confirmed! 📦</h1>
              <p>Thank you for your order</p>
          </div>
          <div class="content">
              <h2>Hello ${data.customerName}!</h2>
              <p>Your order has been confirmed and is being processed. Here are the details:</p>
              
              <div class="order-summary">
                  <h3>Order Summary</h3>
                  <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                  <p><strong>Order Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
                  <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                  <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
              </div>
              
              <table class="items-table">
                  <thead>
                      <tr>
                          <th>Item</th>
                          <th style="text-align: center;">Quantity</th>
                          <th style="text-align: right;">Price</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${itemsHtml}
                  </tbody>
              </table>
              
              <div class="total">
                  <h3>Total Amount: KES ${data.total.toLocaleString()}</h3>
              </div>
              
              <p><strong>What's Next?</strong></p>
              <ul>
                  <li>We'll process your order within 1-2 business days</li>
                  <li>You'll receive tracking information once shipped</li>
                  <li>Delivery typically takes 2-5 business days</li>
              </ul>
              
              <p>Questions about your order? Reply to this email or contact our support team.</p>
          </div>
          <div class="footer">
              <p>Thank you for choosing GetDeals Kenya!</p>
              <p>© ${new Date().getFullYear()} GetDeals Kenya. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;
    
    return { subject, htmlContent, textContent: '' };
  }
}

export { EmailTemplates };