import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    When you use GetDeals Kenya, we may collect:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Delivery address and location data</li>
                    <li>Payment information (processed securely through third parties)</li>
                    <li>Account credentials and preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Usage Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    We automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Pages visited and time spent on our platform</li>
                    <li>Search queries and interaction patterns</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support and account management</li>
                <li>Send order confirmations and delivery updates via SMS/email</li>
                <li>Improve our services and user experience</li>
                <li>Send promotional offers and marketing communications (with consent)</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">3. SMS Communications</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By providing your phone number, you consent to receive SMS messages including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Order confirmations and delivery notifications</li>
                <li>Account verification and security alerts</li>
                <li>Welcome messages for new users</li>
                <li>Promotional offers (you can opt out at any time)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Standard messaging rates may apply. Reply STOP to opt out of promotional messages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">4. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Delivery partners, payment processors, and SMS providers</li>
                <li><strong>Business Partners:</strong> Suppliers and vendors for order fulfillment</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Secure data transmission using SSL encryption</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and employee training</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as necessary to provide our services and fulfill legal obligations. Account information is retained until you request deletion or close your account. Transaction records are kept for accounting and legal purposes as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Access:</strong> Request copies of your personal information</li>
                <li><strong>Correct:</strong> Update or correct inaccurate information</li>
                <li><strong>Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Object:</strong> Object to certain types of data processing</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, contact us using the information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Remember your preferences and login status</li>
                <li>Analyze site usage and improve performance</li>
                <li>Provide personalized content and recommendations</li>
                <li>Enable social media features and advertising</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform integrates with third-party services:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Payment Processors:</strong> M-Pesa and other payment providers</li>
                <li><strong>SMS Service:</strong> Africa's Talking for notifications</li>
                <li><strong>Authentication:</strong> Google OAuth for social login</li>
                <li><strong>Analytics:</strong> For understanding user behavior</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These services have their own privacy policies and data practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than Kenya. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Continued use of our service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">13. Contact Us</h2>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>If you have questions about this Privacy Policy or want to exercise your rights, contact us:</p>
                <div className="bg-green-50 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> privacy@getdeals.co.ke</p>
                  <p><strong>Phone:</strong> +254 700 000 000</p>
                  <p><strong>Address:</strong> Nairobi, Kenya</p>
                  <p><strong>Data Protection Officer:</strong> dpo@getdeals.co.ke</p>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-sm text-muted-foreground">
                By using GetDeals Kenya, you acknowledge that you have read, understood, and agree to this Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}