import { CheckCircle, Users, Award, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">About GetDeals Kenya</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to revolutionize grocery shopping in Kenya by making it smarter, 
            more convenient, and affordable for every family.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                GetDeals Kenya was born from a simple observation: grocery shopping in Kenya 
                was time-consuming, often expensive, and sometimes unpredictable. Families 
                were spending hours in traffic, long queues, and dealing with inconsistent 
                product availability.
              </p>
              <p>
                We decided to change that. By partnering with trusted retailers like Quickmart 
                and leveraging technology, we created a solution that brings convenience, 
                savings, and reliability to grocery shopping for Kenyan families.
              </p>
              <p>
                Today, we're proud to serve thousands of families across Kenya, helping them 
                save time and money while ensuring they have access to quality products when 
                they need them.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 text-center">
              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-primary">10,000+</div>
                  <div className="text-muted-foreground">Happy Customers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">50+</div>
                  <div className="text-muted-foreground">Pickup Locations</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">99.5%</div>
                  <div className="text-muted-foreground">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our customers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-primary">Our Mission</h3>
              <p className="text-muted-foreground">
                To make grocery shopping smart, convenient, and affordable for every Kenyan 
                family by providing curated bundles, reliable delivery, and exceptional service.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-primary">Our Vision</h3>
              <p className="text-muted-foreground">
                To become Kenya's leading smart shopping platform, transforming how families 
                access and purchase essential goods while supporting local communities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            We're a passionate team dedicated to making your shopping experience exceptional.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Experience Smart Shopping?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of satisfied customers who have made the switch to convenient, affordable grocery shopping.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
              Start Shopping
            </button>
            <button className="px-6 py-3 border border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}