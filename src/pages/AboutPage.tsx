import { CheckCircle, Users, Award, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import heroFamily from "@/assets/hero-family.jpg";

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "We put our customers at the heart of everything we do, ensuring exceptional service and satisfaction."
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "We carefully curate our products to ensure only the highest quality items reach your family."
    },
    {
      icon: Users,
      title: "Community Focus",
      description: "We're committed to supporting local communities and making grocery shopping accessible to all."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in every aspect of our service, from product selection to delivery."
    }
  ];

  const team = [
    {
      name: "Sarah Mwangi",
      role: "CEO & Founder",
      description: "Passionate about making grocery shopping easier for Kenyan families."
    },
    {
      name: "James Kiprotich",
      role: "Head of Operations",
      description: "Ensures smooth operations and timely deliveries across all locations."
    },
    {
      name: "Grace Njeri",
      role: "Customer Experience Manager",
      description: "Dedicated to providing exceptional customer service and support."
    }
  ];

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-primary/5 to-background">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Revolutionizing Grocery Shopping in Kenya
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                GetDeals is transforming how Kenyan families shop for groceries. Located in the heart of Karen Green, we're committed to providing curated, affordable, and convenient shopping solutions that save you time and money.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <h3 className="text-2xl font-bold text-primary">10,000+</h3>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <h3 className="text-2xl font-bold text-primary">50,000+</h3>
                  <p className="text-sm text-muted-foreground">Orders Delivered</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroFamily}
                alt="Happy family with groceries"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
                <h4 className="font-semibold">Based in Karen Green</h4>
                <p className="text-sm opacity-90">Serving Nairobi & Beyond</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our customers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 bg-background/80">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">{value.title}</h3>
                  <p className="text-muted-foreground text-base">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <Card className="bg-primary/10 border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-primary">Our Mission</h3>
              <p className="text-muted-foreground text-lg">
                To make grocery shopping smart, convenient, and affordable for every Kenyan family by providing curated bundles, reliable delivery, and exceptional service.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-primary">Our Vision</h3>
              <p className="text-muted-foreground text-lg">
                To become Kenya's leading smart shopping platform, transforming how families access and purchase essential goods while supporting local communities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold mb-4 text-primary">Meet Our Team</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            We're a passionate team dedicated to making your shopping experience exceptional.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-0 bg-background/80 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-primary">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-base">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-primary">Ready to Experience Smart Shopping?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
            Join thousands of satisfied customers who have made the switch to convenient, affordable grocery shopping.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-lg shadow-md">
              Start Shopping
            </button>
            <button className="px-8 py-4 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors text-lg shadow-md">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}