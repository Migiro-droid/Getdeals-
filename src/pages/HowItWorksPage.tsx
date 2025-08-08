import { ArrowRight, CheckCircle, Clock, CreditCard, MapPin, Package, Phone, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
      description: "Pay securely using M-Pesa, Rukisha Wallet, Card, or Cash on delivery/pickup.",
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
    },
    {
      name: "Cash Payment",
      description: "Pay with cash on delivery or at pickup point",
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">How GetDeals Works</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Getting your groceries has never been easier. Follow these simple steps to start your smart shopping journey.
          </p>
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
        </div>

        {/* Delivery Options */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Delivery & Pickup Options</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the option that works best for your schedule and location.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {deliveryOptions.map((option, index) => (
              <Card key={index} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mr-4">
                      <option.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{option.title}</h3>
                      <p className="text-primary font-medium">{option.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">{option.description}</p>
                  
                  <ul className="space-y-2">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </CardContent>
              </Card>
            ))}
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
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Order Confirmation</h3>
                  <p className="text-muted-foreground">Instant SMS confirmation with order details</p>
                </div>
                <div className="text-sm text-muted-foreground">Immediate</div>
              </div>
              
              <Separator className="ml-4" />
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Order Processing</h3>
                  <p className="text-muted-foreground">Items are picked and packed with care</p>
                </div>
                <div className="text-sm text-muted-foreground">15-30 mins</div>
              </div>
              
              <Separator className="ml-4" />
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Ready for Pickup/Delivery</h3>
                  <p className="text-muted-foreground">SMS notification when ready</p>
                </div>
                <div className="text-sm text-muted-foreground">1-2 hours</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Smart Shopping?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of satisfied customers and experience the convenience of GetDeals Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Browse Baskets
            </Button>
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}