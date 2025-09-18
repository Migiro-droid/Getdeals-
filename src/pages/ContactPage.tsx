import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { getApiBase } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

export default function ContactPage() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('issueType'),
        message: formData.get('message'),
      };

      // Validate phone number is provided
      if (!data.phone || data.phone.toString().trim() === '') {
        toast({
          title: "Phone number required",
          description: "Please provide your phone number so we can send you updates and offers.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ 
          title: "Message sent successfully! 🎉", 
          description: "Thank you for reaching out. We'll get back to you within 2 hours during business hours. You'll also receive SMS updates on your phone." 
        });
        formRef.current?.reset();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us directly via phone.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question or need help? We're here to assist you. Get in touch and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="border-2 border-primary/10">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">Phone Support</div>
                      <a href="tel:+254728322355" className="text-muted-foreground hover:text-primary transition-colors">
                        +254 728 322 355
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">Available 8AM - 8PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">WhatsApp</div>
                      <a 
                        href="https://wa.me/254728322355" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Chat with us instantly
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">Quick responses guaranteed</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">Email</div>
                      <a 
                        href="mailto:info@getdeals.co.ke" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@getdeals.co.ke
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">We'll respond within 2 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">Visit Us</div>
                      <div className="text-muted-foreground">Karen Green, Nairobi, Kenya</div>
                      <p className="text-sm text-muted-foreground mt-1">Main distribution center</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">Business Hours</div>
                      <div className="text-muted-foreground">Monday - Saturday</div>
                      <div className="text-muted-foreground">8:00 AM - 8:00 PM</div>
                      <p className="text-sm text-muted-foreground mt-1">Sunday: Emergency support only</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="text-xl">Send us a Message</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name *
                      </Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        placeholder="Enter your first name"
                        required 
                        className="h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name *
                      </Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        placeholder="Enter your last name"
                        required 
                        className="h-11" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address *
                    </Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="your.email@example.com"
                      required 
                      className="h-11" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number *
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      type="tel" 
                      placeholder="+254 700 123 456"
                      required
                      className="h-11" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueType" className="text-sm font-medium">
                      Subject *
                    </Label>
                    <Select name="issueType" required>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose what you need help with" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Order Support">Order Support</SelectItem>
                        <SelectItem value="Payment Issues">Payment Issues</SelectItem>
                        <SelectItem value="Delivery Questions">Delivery Questions</SelectItem>
                        <SelectItem value="Account Help">Account Help</SelectItem>
                        <SelectItem value="Product Inquiry">Product Inquiry</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="General Question">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Message *
                    </Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      rows={5} 
                      placeholder="Please describe your question or issue in detail..."
                      required 
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                  >
                    {isSubmitting ? (
                      <>Sending your message...</>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting this form, you agree to our{' '}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      privacy policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/terms-of-service" className="text-primary hover:underline">
                      terms of service
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
