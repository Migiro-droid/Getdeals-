import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

export default function ContactPage() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ 
      title: "Message sent successfully! 🎉", 
      description: "Thank you for reaching out. We'll get back to you within 2 hours during business hours." 
    });
    formRef.current?.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-sm text-muted-foreground">We typically respond within 2 hours, Mon–Sat 8AM–8PM.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Simple contact info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Get in touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2"><Phone className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <a href="tel:+254700123456" className="text-sm text-muted-foreground hover:text-primary">+254 700 123 456</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2"><MessageCircle className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">WhatsApp</div>
                  <a href="https://wa.me/254700123456" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary">Chat with us</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2"><Mail className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <a href="mailto:support@getdeals.co.ke" className="text-sm text-muted-foreground hover:text-primary">support@getdeals.co.ke</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2"><MapPin className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div className="text-sm text-muted-foreground">Karen Green, Nairobi</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2"><Clock className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">Business hours</div>
                  <div className="text-sm text-muted-foreground">Mon–Sat: 8AM–8PM</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simple form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-xs">First name</Label>
                    <Input id="firstName" required className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs">Last name</Label>
                    <Input id="lastName" required className="h-10" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input id="email" type="email" required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone (optional)</Label>
                  <Input id="phone" type="tel" className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="issueType" className="text-xs">Topic</Label>
                  <Select>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="message" className="text-xs">Message</Label>
                  <Textarea id="message" rows={5} required />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>Sending…</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
