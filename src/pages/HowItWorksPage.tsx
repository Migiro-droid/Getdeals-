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
      description: "Pay securely using M-Pesa, Rukisha Wallet, or Card.",
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
      name: "M-Pesa",
      description: "Pay instantly with M-Pesa - Kenya's most trusted mobile money service",
      icon: Phone
    },
    {
      name: "Card Payment",
      description: "Secure payments with Visa and Mastercard",
      icon: CreditCard
    },
    {
      name: "Rukisha Wallet",
      description: "Use your Rukisha balance for seamless payments",
      icon: Package
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
        <div className="mb-20">
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
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Secure Payment Options</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pay the way you prefer with our multiple secure payment options.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-shadow group">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <method.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security badge */}
          <div className="text-center">
            <Card className="inline-block bg-green-50 border-green-200">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-green-800">Secure & Protected</h4>
                  <p className="text-sm text-green-600">Your payments are protected with bank-level security</p>
                </div>
              </CardContent>
            </Card>
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