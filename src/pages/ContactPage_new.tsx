import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Star, CheckCircle, ArrowRight, Users, Headphones, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

export default function ContactPage() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ 
      title: "Message sent successfully! 🎉", 
      description: "Thank you for reaching out. We'll get back to you within 2 hours during business hours." 
    });
    formRef.current?.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Headphones className="h-4 w-4 mr-2" />
              24/7 Support Available
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              We're Here to Help
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Have questions about your order, need product recommendations, or want to give feedback? 
              Our friendly team is ready to assist you every step of the way.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2hrs</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Get in Touch</h2>
            
            {/* Phone */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Call Us Now</h3>
                    <a href="tel:+254728322355" className="text-muted-foreground hover:text-primary transition-colors text-lg">
                      +254 728 322 355
                    </a>
                    <p className="text-sm text-muted-foreground">Available 8AM - 8PM</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">WhatsApp Chat</h3>
                    <a href="https://wa.me/254728322355" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      Chat with us instantly
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-muted-foreground">Usually replies instantly</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Email Support</h3>
                    <a href="mailto:info@getdeals.co.ke" className="text-muted-foreground hover:text-primary transition-colors">
                      info@getdeals.co.ke
                    </a>
                    <p className="text-sm text-muted-foreground">We reply within 2 hours</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            {/* Office Location */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="h-7 w-7 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Visit Our Office</h3>
                    <a
                      href="https://maps.google.com/?q=Karen%20Green%2C%20Nairobi%2C%20Kenya"
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Karen Green, Nairobi
                    </a>
                    <p className="text-sm text-muted-foreground">Mon-Sat, 8AM-8PM</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            {/* Customer Testimonial */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  "GetDeals customer support is amazing! They helped me track my order and even gave me recipe suggestions for my weekly basket."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sarah M.</p>
                    <p className="text-xs text-muted-foreground">Verified Customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-2 border-primary/10 bg-gradient-to-br from-background via-background to-muted/20">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Send us a Message
                </CardTitle>
                <p className="text-muted-foreground">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              </CardHeader>
              <CardContent className="p-8">
                <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-semibold">First Name *</Label>
                      <Input 
                        id="firstName" 
                        required 
                        className="h-12 border-2 focus:border-primary/50 transition-all rounded-xl" 
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-semibold">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        required 
                        className="h-12 border-2 focus:border-primary/50 transition-all rounded-xl" 
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email Address *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        className="h-12 border-2 focus:border-primary/50 transition-all rounded-xl" 
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        className="h-12 border-2 focus:border-primary/50 transition-all rounded-xl" 
                        placeholder="+254 728 322 355"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueType" className="text-sm font-semibold">How can we help you? *</Label>
                    <Select required>
                      <SelectTrigger className="h-12 border-2 focus:border-primary/50 transition-all rounded-xl">
                        <SelectValue placeholder="Select the type of inquiry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">🛒 Order Support & Tracking</SelectItem>
                        <SelectItem value="payment">💳 Payment & Billing Issues</SelectItem>
                        <SelectItem value="delivery">🚚 Delivery & Shipping</SelectItem>
                        <SelectItem value="account">👤 Account & Profile Help</SelectItem>
                        <SelectItem value="products">🥬 Product Questions</SelectItem>
                        <SelectItem value="feedback">💭 Feedback & Suggestions</SelectItem>
                        <SelectItem value="partnership">🤝 Business Partnership</SelectItem>
                        <SelectItem value="other">❓ Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-semibold">Your Message *</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us how we can help you. Be as detailed as possible so we can provide the best assistance..."
                      rows={6}
                      required 
                      className="border-2 focus:border-primary/50 transition-all rounded-xl resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    By submitting this form, you agree to our privacy policy and terms of service.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Map Section */}
            <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/10">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Find Us Here
                </h3>
                <p className="text-sm text-muted-foreground">Visit our office in Karen, Nairobi</p>
              </div>
              <iframe
                title="GetDeals Location - Karen Green, Nairobi"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.031234567!2d36.8219466!3d-1.2920659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d6e7e7e7e7%3A0x7e7e7e7e7e7e7e7e!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2ske!4v1680000000000!5m2!1sen!2ske"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Enhanced FAQ Section */}
        <div className="mt-24 mb-16">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Quick Answers
            </Badge>
            <h2 className="text-3xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find quick answers to common questions. Can't find what you're looking for? Contact us directly!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🚚",
                question: "How do I track my order?",
                answer: "You'll receive SMS updates with tracking information once your order is confirmed. You can also check your order status in your account dashboard."
              },
              {
                icon: "🛒",
                question: "Can I customize my basket?",
                answer: "While we offer carefully curated baskets, you can add individual items to create your perfect order. Custom baskets coming soon!"
              },
              {
                icon: "↩️",
                question: "What's your return policy?",
                answer: "We offer full refunds for damaged or incorrect items within 24 hours of delivery. Quality guarantee on all fresh products."
              },
              {
                icon: "💳",
                question: "What payment methods do you accept?",
                answer: "We accept M-Pesa, Visa/Mastercard, and GetDeals Wallet for your convenience."
              },
              {
                icon: "⏰",
                question: "What are your delivery hours?",
                answer: "We deliver Monday-Saturday from 8AM-8PM. Same-day delivery available for orders placed before 2PM."
              },
              {
                icon: "🔒",
                question: "Is my personal information secure?",
                answer: "Yes! We use bank-level encryption to protect your data and never share your information with third parties."
              }
            ].map((faq, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary flex items-center gap-3">
                    <span className="text-2xl">{faq.icon}</span>
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Card className="inline-block bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Still need help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is available 6 days a week to assist you
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild variant="default">
                    <a href="tel:+254728322355">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="https://wa.me/254728322355" target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp Chat
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
