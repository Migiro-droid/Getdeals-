import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">Cookie Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain website functions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                GetDeals Kenya uses cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Authentication:</strong> To keep you logged in and secure your session</li>
                <li><strong>Preferences:</strong> To remember your settings and choices</li>
                <li><strong>Analytics:</strong> To understand how you use our website and improve it</li>
                <li><strong>Shopping Cart:</strong> To remember items you've added to your cart</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">3. Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Essential Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">
                    These cookies are necessary for the website to function and cannot be switched off. They include session management, authentication, and security cookies.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Performance Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">
                    These cookies help us understand how visitors interact with our website by collecting anonymous information about page visits and user behavior.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Functional Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">
                    These cookies enable enhanced functionality and personalization, such as remembering your login details and preferences.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Marketing Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">
                    These cookies track your activity across websites to deliver more relevant advertisements and measure advertising campaign effectiveness.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may use third-party services that set cookies on your device:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
                <li><strong>Google OAuth:</strong> For social login functionality</li>
                <li><strong>Payment Processors:</strong> For secure payment processing</li>
                <li><strong>Social Media:</strong> For social sharing and login features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">5. Managing Your Cookie Preferences</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Browser Settings</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can control and delete cookies through your browser settings. Each browser has different procedures for managing cookies:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mt-2">
                    <li><strong>Chrome:</strong> Settings {'->'} Privacy and Security {'->'} Cookies</li>
                    <li><strong>Firefox:</strong> Options {'->'} Privacy & Security {'->'} Cookies</li>
                    <li><strong>Safari:</strong> Preferences {'->'} Privacy {'->'} Cookies</li>
                    <li><strong>Edge:</strong> Settings {'->'} Privacy and Services {'->'} Cookies</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">Cookie Consent</h3>
                  <p className="text-gray-700 leading-relaxed">
                    When you first visit our website, you'll see a cookie consent banner. You can choose which types of cookies to accept or reject. You can change your preferences at any time.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Disabling certain cookies may affect your experience on our website:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You may need to log in repeatedly</li>
                <li>Your shopping cart may not function properly</li>
                <li>Personalized features may not work</li>
                <li>Website performance may be affected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">7. Local Storage</h2>
              <p className="text-gray-700 leading-relaxed">
                In addition to cookies, we may use local storage technologies to store information on your device. This includes session storage and local storage for improving website functionality and user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We will post the updated policy on this page with a new "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">9. Contact Us</h2>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>If you have questions about our use of cookies, please contact us:</p>
                <div className="bg-green-50 p-4 rounded-lg mt-4">
                  <p><strong>Email:</strong> privacy@getdeals.co.ke</p>
                  <p><strong>Phone:</strong> +254 700 000 000</p>
                  <p><strong>Address:</strong> Nairobi, Kenya</p>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-sm text-muted-foreground">
                By continuing to use GetDeals Kenya, you consent to our use of cookies as described in this policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}