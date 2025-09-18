import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using GetDeals Kenya platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                GetDeals Kenya is an e-commerce platform that provides:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Online marketplace for grocery products and family baskets</li>
                <li>Product comparison and deal aggregation services</li>
                <li>Order management and delivery coordination</li>
                <li>Customer support and account management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When creating an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Safeguarding your password and account information</li>
                <li>All activities that occur under your account</li>
                <li>Immediately notifying us of any unauthorized use</li>
                <li>Providing accurate contact information including phone number</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">4. Orders and Payment</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Order Placement</h3>
                  <p className="text-gray-700 leading-relaxed">
                    All orders are subject to availability and confirmation of the order price. We reserve the right to refuse or cancel any order for any reason at any time.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Payment Terms</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Payment is required at the time of order placement. We accept M-Pesa and other approved payment methods. All prices are in Kenyan Shillings (KES).
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Pricing</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Prices are subject to change without notice. We strive to provide accurate pricing information but errors may occur.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">5. Delivery and Returns</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Delivery</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We aim to deliver orders within the specified timeframe. Delivery times are estimates and may vary due to circumstances beyond our control.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Returns and Refunds</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Returns are accepted for damaged or incorrect items within 24 hours of delivery. Perishable goods cannot be returned unless damaged or defective.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">6. User Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to use the service to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit any harmful or malicious content</li>
                <li>Interfere with the proper functioning of the platform</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to access or scrape our content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. We collect and use your personal information in accordance with our Privacy Policy. By using our service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">8. SMS and Communication</h2>
              <p className="text-gray-700 leading-relaxed">
                By providing your phone number, you consent to receive SMS notifications about your orders, account updates, and promotional messages. You can opt out at any time by contacting customer support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">9. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The service and its original content, features, and functionality are and will remain the exclusive property of GetDeals Kenya and its licensors. The service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                GetDeals Kenya shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">11. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the Republic of Kenya. Any disputes shall be resolved in the courts of Kenya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">13. Contact Information</h2>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>If you have any questions about these Terms of Service, please contact us:</p>
                <div className="bg-green-50 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> support@getdeals.co.ke</p>
                  <p><strong>Phone:</strong> +254 700 000 000</p>
                  <p><strong>Address:</strong> Nairobi, Kenya</p>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-sm text-muted-foreground">
                By continuing to use GetDeals Kenya, you acknowledge that you have read, understood, and agree to these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}