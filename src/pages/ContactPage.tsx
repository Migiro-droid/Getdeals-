import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactPage() {
  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-primary">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help! Reach out for any questions, support, or feedback. Our team responds quickly!
          </p>
        </div>

  <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <Card className="shadow-lg border-0 bg-background/80">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-muted-foreground">+254 700 123 456</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-background/80">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">support@getdeals.co.ke</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-background/80">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-muted-foreground">Nairobi, Kenya</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-background/80">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Business Hours</h3>
                    <p className="text-muted-foreground">Mon-Sat: 8AM-8PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-background/90">
              <CardHeader>
                <CardTitle className="text-primary text-2xl">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" required className="rounded-lg" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" required className="rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required className="rounded-lg" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" className="rounded-lg" />
                  </div>
                  <div>
                    <Label htmlFor="issueType">Issue Type</Label>
                    <Select>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="payment">Payment Problem</SelectItem>
                        <SelectItem value="delivery">Delivery Issue</SelectItem>
                        <SelectItem value="account">Account Help</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required 
                      className="rounded-lg"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-lg text-lg font-semibold">
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
            {/* Map Section */}
            <div className="mt-8 rounded-2xl overflow-hidden shadow-lg">
              <iframe
                title="GetDeals Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.031234567!2d36.8219466!3d-1.2920659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d6e7e7e7e7%3A0x7e7e7e7e7e7e7e7e!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2ske!4v1680000000000!5m2!1sen!2ske"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-primary">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-md border-0 bg-background/80">
              <CardHeader>
                <CardTitle className="text-lg text-primary">How do I track my order?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-base">
                  You'll receive SMS updates on your order status and tracking information once your order is confirmed.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-background/80">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Can I customize my basket?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-base">
                  Currently we offer curated baskets, but you can add items to your wishlist for future consideration.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-background/80">
              <CardHeader>
                <CardTitle className="text-lg text-primary">What's the return policy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-base">
                  We offer full refunds for damaged or incorrect items within 24 hours of delivery.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-background/80">
              <CardHeader>
                <CardTitle className="text-lg text-primary">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-base">
                  We accept M-Pesa, Visa/Mastercard, Rukisha Wallet, and cash payments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}