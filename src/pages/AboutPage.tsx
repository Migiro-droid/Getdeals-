import { CheckCircle, Users, Award, Heart, Truck, ShoppingCart, ShieldCheck, Leaf, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import heroFamily from "@/assets/hero-family.jpg";

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description:
        "We put families first with friendly support and a seamless shopping experience.",
    },
    {
      icon: CheckCircle,
      title: "Quality Assured",
      description:
        "Curated baskets and products vetted for freshness, value, and consistency.",
    },
    {
      icon: Award,
      title: "Reliable Service",
      description:
        "Timely delivery and convenient pickup options you can count on, every time.",
    },
    {
      icon: Leaf,
      title: "Local Impact",
      description:
        "We support local suppliers and reduce waste with smarter procurement.",
    },
  ];

  const steps = [
    {
      icon: ShoppingCart,
      title: "Pick your basket",
      text: "Choose from essential, family, or custom add-ons to fit your week.",
    },
    {
      icon: ShieldCheck,
      title: "We prepare with care",
      text: "Our team curates quality items and keeps you updated on your order.",
    },
    {
      icon: Truck,
      title: "Deliver or pickup",
      text: "Same‑day delivery in Nairobi or quick pickup at your nearest Quickmart.",
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-16">
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Based in Karen Green, Nairobi
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Smart grocery shopping for Kenyan families
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              GetDeals makes weekly shopping simple with curated baskets, fair pricing,
              and dependable delivery or pickup.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/baskets">Browse baskets</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroFamily}
              alt="A happy family unpacking groceries at home"
              className="rounded-2xl w-full h-[360px] object-cover"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "Orders delivered", value: "50k+" },
            { label: "Happy customers", value: "10k+" },
            { label: "Avg response", value: "~2 hrs" },
            { label: "On‑time delivery", value: "98%" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Values */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">What we stand for</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Clear values guide how we source, pack, and deliver every order.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-2">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple three‑step process designed around your routine.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-2">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

  {/* Our story removed as requested */}

        <Separator className="my-6" />

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to try GetDeals?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join thousands of happy customers and make grocery day effortless.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/baskets">Start shopping</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}