import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Clock, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { featuredProducts } from "@/data/products";
import heroImage from "@/assets/hero-family.jpg";
import deliveryImage from "@/assets/delivery-service.jpg";

export default function HomePage() {
  const features = [
    {
      icon: CheckCircle,
      title: "Curated Baskets",
      description: "Carefully selected products for your family's needs"
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "2-hour speedy drop or convenient pickup options"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Multiple payment options including M-Pesa and cards"
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "No more long shopping trips - we've got you covered"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Create Account",
      description: "Sign up with your phone number and basic information"
    },
    {
      number: "2", 
      title: "Choose Basket",
      description: "Browse our curated baskets and select what fits your needs"
    },
    {
      number: "3",
      title: "Select Pickup Point", 
      description: "Choose speedy drop or pickup at your nearest Quickmart"
    },
    {
      number: "4",
      title: "Make Payment",
      description: "Pay securely using M-Pesa, Rukisha Wallet, Card, or Cash"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-primary/5 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-balance">
                Smart Shopping
                <span className="text-primary block">Made Easy</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Get curated grocery baskets delivered to your doorstep or pickup at your nearest Quickmart. Save time, save money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link to="/baskets">
                    Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                  <Link to="/how-it-works">How It Works</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Happy family shopping"
                className="rounded-2xl shadow-strong w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose GetDeals?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make grocery shopping effortless with our carefully curated baskets and convenient delivery options.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Baskets */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Bundle Baskets</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Save more with our curated bundles designed for different family sizes and needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/baskets">
                View All Baskets <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting your groceries has never been easier. Follow these simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Flexible Delivery & Pickup Options
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Speedy Drop</h3>
                    <p className="text-muted-foreground">Fast delivery to your doorstep within 2 hours for just KES 200</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Pickup Point</h3>
                    <p className="text-muted-foreground">Collect from your nearest Quickmart at your convenience - completely free</p>
                  </div>
                </div>
              </div>
              <Button size="lg" asChild>
                <Link to="/delivery">Learn More About Delivery</Link>
              </Button>
            </div>
            <div className="relative">
              <img
                src={deliveryImage}
                alt="Delivery service"
                className="rounded-2xl shadow-strong w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Start Smart Shopping?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of satisfied customers who save time and money with GetDeals Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/baskets">Browse Baskets</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}