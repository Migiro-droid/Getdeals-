import { ArrowRight, CheckCircle, Clock, CreditCard, MapPin, MessageSquare, Package, Phone, Shield, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroFamily from "@/assets/hero-family.jpg";
import deliveryService from "@/assets/delivery-service.jpg";
import heroSupermarket from "@/assets/hero-supermarket.jpg";
import essentialBasket from "@/assets/essential-basket.jpg";
import familyBasket from "@/assets/family-basket.jpg";
import frankiImage from "@/assets/franki-chamaki-ivfp_yxZuYQ-unsplash.jpg";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "1",
      icon: User,
      title: "Create Account",
      description: "Sign up with your phone number and basic information to get started with GetDeals Kenya.",
      details: [
        "Quick registration process",
        "Secure account verification",
        "Profile setup with preferences"
      ]
    },
    {
      number: "2",
      icon: Package,
      title: "Choose Basket",
      description: "Browse our curated baskets and select the one that perfectly fits your family's needs.",
      details: [
        "Pre-selected quality items",
        "Different sizes for every family",
        "Significant savings on bundles"
      ]
    },
    {
      number: "3",
      icon: MapPin,
      title: "Select Pickup Point",
      description: "Choose between speedy drop delivery or pickup at your nearest Quickmart location.",
      details: [
        "50+ pickup locations available",
        "Free pickup option",
        "2-hour delivery option"
      ]
    },
    {
      number: "4",
      icon: CreditCard,
      title: "Make Payment",
      description: "Pay securely using Mobile Money, Rukisha Wallet, or Card.",
      details: [
        "Multiple payment options",
        "Secure payment processing",
        "Instant confirmation"
      ]
    }
  ];

  const deliveryOptions = [
    {
      icon: Truck,
      title: "Speedy Drop",
      subtitle: "KES 200 Delivery Fee",
      description: "Fast delivery to your doorstep within 2 hours",
      features: [
        "2-hour delivery window",
        "Real-time tracking",
        "Professional delivery team",
        "Contact-free delivery option"
      ]
    },
    {
      icon: MapPin,
      title: "Pickup Point",
      subtitle: "Free Pickup",
      description: "Collect from your nearest Quickmart at your convenience",
      features: [
        "50+ locations across Kenya",
        "Extended pickup hours",
        "Free storage for 48 hours",
        "Assistance available on request"
      ]
    }
  ];

  const paymentMethods = [
    {
      name: "Mobile Money",
      description: "Pay instantly with M-Pesa or Airtel Money - Kenya's trusted mobile money services",
      icon: Phone,
      features: ["Instant processing", "No additional fees", "Works offline"]
    },
    {
      name: "Card Payment",
      description: "Secure payments with Visa and Mastercard",
      icon: CreditCard,
      features: ["Instant processing", "SSL encrypted", "International cards"]
    },
    {
      name: "Rukisha Wallet",
      description: "Use your Rukisha balance for seamless payments",
      icon: Package,
      features: ["Instant processing", "Earn rewards", "Quick checkout"]
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section with Images */}
        <div className="text-center mb-16">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">How GetDeals Works</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Getting your groceries has never been easier. Follow these simple steps to start your smart shopping journey.
          </p>

          {/* Visual showcase */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="relative">
              <img
                src={heroFamily}
                alt="Happy family enjoying GetDeals service"
                className="rounded-2xl w-full h-48 object-cover shadow-lg"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <p className="text-xs font-medium text-gray-900">Happy Families</p>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroSupermarket}
                alt="Quality products at our facility"
                className="rounded-2xl w-full h-48 object-cover shadow-lg"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <p className="text-xs font-medium text-gray-900">Quality Products</p>
              </div>
            </div>
            <div className="relative">
              <img
                src={deliveryService}
                alt="Fast and reliable delivery"
                className="rounded-2xl w-full h-48 object-cover shadow-lg"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <p className="text-xs font-medium text-gray-900">Fast Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Steps */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground mb-4">{step.description}</p>

                <ul className="text-sm text-muted-foreground space-y-1">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>

                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-10 -right-4 h-6 w-6 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Step illustrations */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={essentialBasket}
                    alt="Curated grocery baskets"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-semibold mb-1">Curated Baskets</h3>
                    <p className="text-sm opacity-90">Choose from our selection of pre-made baskets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={familyBasket}
                    alt="Family-sized grocery baskets"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-semibold mb-1">Family Options</h3>
                    <p className="text-sm opacity-90">Perfect for families of all sizes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delivery Options */}
        <div id="delivery-pickup" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Delivery & Pickup Options</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the option that works best for your schedule and location.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {deliveryOptions.map((option, index) => (
              <Card key={index} className="hover:shadow-medium transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={index === 0 ? deliveryService : heroSupermarket}
                      alt={option.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <option.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-semibold mb-1">{option.title}</h3>
                      <p className="text-primary font-medium text-sm">{option.subtitle}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground mb-6">{option.description}</p>

                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional delivery visual */}
          <div className="text-center">
            <Card className="overflow-hidden max-w-2xl mx-auto">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={frankiImage}
                    alt="Fresh produce delivery"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Fresh & Reliable Service</h3>
                    <p className="text-lg opacity-90">Our dedicated team ensures your groceries arrive fresh and on time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Methods */}
        <div id="secure-payment" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Secure Payment Options</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Pay the way you prefer with our multiple secure payment options.
            </p>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center transition-transform duration-300 shadow-lg">
                      <method.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{method.name}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed mb-6">{method.description}</p>
                  <div className="space-y-3">
                    {method.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm font-medium text-primary">
                        <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security & Trust Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Security Badge */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 text-lg mb-2">Bank-Level Security</h4>
                    <p className="text-green-700/80">Your payments are protected with industry-leading encryption and fraud prevention systems.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badge */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-lg mb-2">Trusted by Thousands</h4>
                    <p className="text-blue-700/80">Join thousands of satisfied customers who securely process millions of transactions daily.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Trust Indicators - Redesigned */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {/* Payment Security Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
              <Card className="relative border border-emerald-200/30 bg-white hover:border-emerald-300/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-4">
                    <Shield className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-4xl font-bold text-emerald-600 mb-2">100%</p>
                  <p className="text-sm font-medium text-gray-700">Payment Security</p>
                  <p className="text-xs text-gray-500 mt-2">Bank-level encryption on all transactions</p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Support Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
              <Card className="relative border border-blue-200/30 bg-white hover:border-blue-300/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-4xl font-bold text-blue-600 mb-2">24/7</p>
                  <p className="text-sm font-medium text-gray-700">Transaction Support</p>
                  <p className="text-xs text-gray-500 mt-2">Dedicated support whenever you need help</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Confirmation Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
              <Card className="relative border border-amber-200/30 bg-white hover:border-amber-300/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-4xl font-bold text-amber-600 mb-2">Instant</p>
                  <p className="text-sm font-medium text-gray-700">Payment Confirmation</p>
                  <p className="text-xs text-gray-500 mt-2">Real-time transaction notifications</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Happens After You Order?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your order every step of the way with our transparent process.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Order Confirmation</h3>
                  </div>
                  <p className="text-muted-foreground">Instant SMS confirmation with order details</p>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Immediate</div>
              </div>

              <Separator className="ml-6" />

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Package className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Order Processing</h3>
                  </div>
                  <p className="text-muted-foreground">Items are picked and packed with care</p>
                </div>
                <div className="text-sm text-muted-foreground font-medium">15-30 mins</div>
              </div>

              <Separator className="ml-6" />

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Truck className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-semibold">Ready for Pickup/Delivery</h3>
                  </div>
                  <p className="text-muted-foreground">SMS notification when ready</p>
                </div>
                <div className="text-sm text-muted-foreground font-medium">1-2 hours</div>
              </div>
            </div>
          </div>

          {/* Timeline visual */}
          <div className="mt-12 text-center">
            <Card className="overflow-hidden max-w-md mx-auto">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={heroFamily}
                    alt="Happy family receiving groceries"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                    <p className="text-sm font-medium">Your satisfaction is our priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              src={essentialBasket}
              alt="Fresh groceries background"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Smart Shopping?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of satisfied customers and experience the convenience of GetDeals Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Browse Baskets
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Create Account
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Free delivery on orders over KSh 5,000
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                100% satisfaction guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}