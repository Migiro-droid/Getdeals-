import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" className="mb-8" asChild>
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Return Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-600 mt-4">
            We stand behind the quality of our products and want you to be completely satisfied.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            
            {/* Quick Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Quick Summary
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">30-Day Return Window</p>
                    <p className="text-sm text-gray-700">Return items within 30 days of delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Original Condition</p>
                    <p className="text-sm text-gray-700">Items must be unopened or unused where applicable</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Full Refund</p>
                    <p className="text-sm text-gray-700">Receive a full refund to your original payment method</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">1. Return Eligibility</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-700 mb-2">✓ Returnable Items</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    The following items can be returned within 30 days of delivery:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Non-perishable goods in unopened, original packaging</li>
                    <li>Defective or damaged items</li>
                    <li>Items that don't match the product description</li>
                    <li>Items received in wrong quantity or order</li>
                    <li>Items with quality issues or manufacturing defects</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-blue-700 mb-2">✗ Non-Returnable Items</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    The following items cannot be returned:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Perishable items (fresh produce, dairy, meat)</li>
                    <li>Items opened or partially used</li>
                    <li>Items damaged due to customer mishandling</li>
                    <li>Items purchased on final sale or clearance</li>
                    <li>Custom or personalized items</li>
                    <li>Items returned after the 30-day window</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Return Process */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">2. How to Initiate a Return</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">1</span>
                    <h3 className="text-lg font-medium text-blue-700">Contact Customer Support</h3>
                  </div>
                  <p className="text-gray-700">
                    Reach out to our customer service team within 30 days of delivery through email, phone, or WhatsApp with your order number and reason for return.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">2</span>
                    <h3 className="text-lg font-medium text-blue-700">Get Return Authorization</h3>
                  </div>
                  <p className="text-gray-700">
                    Once approved, you'll receive a return authorization number (RAN) and instructions for packing and shipping your items back to us.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">3</span>
                    <h3 className="text-lg font-medium text-blue-700">Ship the Item</h3>
                  </div>
                  <p className="text-gray-700">
                    Pack the item securely with the return authorization number visible on the outside. You can arrange pickup with our delivery partners or drop off at designated collection points.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">4</span>
                    <h3 className="text-lg font-medium text-blue-700">Receive Refund</h3>
                  </div>
                  <p className="text-gray-700">
                    Once we inspect and verify your return, your refund will be processed to your original payment method within 5-7 business days.
                  </p>
                </div>
              </div>
            </section>

            {/* Refund Processing */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">3. Refund Processing</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong>Refund Timeline:</strong> After receiving and inspecting your return, we'll process your refund within 5-7 business days. The refund will be credited to your original payment method.
                </p>
                <p className="leading-relaxed">
                  <strong>Payment Method Refunds:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Card Payments:</strong> 3-5 business days for the funds to appear in your account</li>
                  <li><strong>Mobile Money:</strong> 1-2 business days for M-Pesa or Airtel Money</li>
                  <li><strong>Rukisha Wallet:</strong> Instant credit to your wallet balance</li>
                </ul>
                <p className="leading-relaxed">
                  <strong>Partial Refunds:</strong> If an item is damaged due to your mishandling or use, we reserve the right to process a partial refund (usually 70-80% of the purchase price).
                </p>
              </div>
            </section>

            {/* Shipping & Costs */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">4. Return Shipping</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  <strong>Free Return Shipping:</strong> We provide free return shipping labels for items that are defective or don't match the product description.
                </p>
                <p className="leading-relaxed">
                  <strong>Customer-Paid Returns:</strong> For returns due to change of mind or items not meeting your expectations, you may need to cover return shipping costs (typically KES 200-500 depending on location).
                </p>
                <p className="leading-relaxed">
                  <strong>Return Methods:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Arrange pickup from your location through our delivery partners</li>
                  <li>Drop off at designated Quickmart collection points</li>
                  <li>Use our prepaid return shipping labels</li>
                </ul>
              </div>
            </section>

            {/* Damaged Items */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">5. Damaged or Defective Items</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Report Damage Immediately</p>
                  <p className="text-sm text-yellow-800">Contact us within 24 hours of delivery with photos of the damaged item and packaging</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you receive a damaged or defective item:
              </p>
              <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                <li>Take clear photos of the damage and original packaging</li>
                <li>Contact our customer service team immediately with photos and order details</li>
                <li>We'll arrange a free replacement or full refund at no cost</li>
                <li>In most cases, no return shipment is required for damaged items</li>
              </ol>
            </section>

            {/* Exceptions */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">6. Special Cases & Exceptions</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-400 pl-4">
                  <h3 className="text-lg font-medium text-blue-700 mb-2">Wrong Item Received</h3>
                  <p className="text-gray-700">
                    If you received the wrong item, we'll provide a free return shipping label and send the correct item immediately once we receive the wrong item back.
                  </p>
                </div>
                <div className="border-l-4 border-blue-400 pl-4">
                  <h3 className="text-lg font-medium text-blue-700 mb-2">Missing Items</h3>
                  <p className="text-gray-700">
                    Report missing items within 48 hours of delivery. We'll verify and either send the missing item or process a refund for that portion of your order.
                  </p>
                </div>
                <div className="border-l-4 border-blue-400 pl-4">
                  <h3 className="text-lg font-medium text-blue-700 mb-2">Basket Orders</h3>
                  <p className="text-gray-700">
                    For curated basket orders, you can return individual non-perishable items. Perishable items cannot be returned once delivered.
                  </p>
                </div>
              </div>
            </section>

            {/* Customer Support */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">7. Need Help?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our customer support team is here to help! Contact us:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                <div>
                  <p className="font-medium text-gray-900">📧 Email</p>
                  <p className="text-gray-700">info@getdeals.co.ke</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">📱 WhatsApp</p>
                  <p className="text-gray-700">+254 728 322 355</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">☎️ Phone</p>
                  <p className="text-gray-700">+254 728 322 355</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">⏰ Support Hours</p>
                  <p className="text-gray-700">Monday - Sunday: 8:00 AM - 8:00 PM</p>
                </div>
              </div>
            </section>

            {/* Terms & Conditions */}
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">8. Important Notes</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>This return policy applies to all orders placed on GetDeals Kenya</li>
                <li>We reserve the right to refuse returns that violate this policy</li>
                <li>The 30-day return window is calculated from the delivery date</li>
                <li>All returns must include the original order number and return authorization number</li>
                <li>Items must be returned in resaleable condition</li>
                <li>For bulk or wholesale orders, special terms may apply</li>
              </ul>
            </section>

            {/* Updates */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Policy Updates:</strong> We may update this return policy from time to time. The most current version will always be available on this page. Continued use of our services constitutes acceptance of the updated policy.
              </p>
            </section>

          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-700 mb-4">
            Have questions about our return policy?
          </p>
          <Button asChild>
            <Link to="/contact">
              Contact Us
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
