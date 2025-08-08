import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      title: "Getting Started",
      faqs: [
        {
          question: "How do I create an account?",
          answer: "You can create an account by clicking the 'Sign Up' button and providing your phone number, name, and nearest Quickmart location. The process takes less than 2 minutes."
        },
        {
          question: "Do I need to download an app?",
          answer: "No, GetDeals works directly through your web browser on any device. Simply visit our website and start shopping immediately."
        },
        {
          question: "Is there a minimum order amount?",
          answer: "No, there's no minimum order amount. However, our baskets are pre-configured with specific items and quantities to maximize your savings."
        }
      ]
    },
    {
      title: "Orders & Products",
      faqs: [
        {
          question: "How do I track my order?",
          answer: "You'll receive SMS updates on your order status from confirmation to pickup/delivery. You can also check your order status in your account dashboard."
        },
        {
          question: "Can I customize my basket?",
          answer: "Currently we offer pre-curated baskets to ensure maximum savings. However, you can add items to your wishlist and contact us for custom basket requests."
        },
        {
          question: "What if an item is out of stock?",
          answer: "We'll immediately notify you via SMS and offer suitable substitutions or a partial refund for the unavailable items."
        },
        {
          question: "How fresh are the products?",
          answer: "All our products are sourced directly from Quickmart's fresh inventory. We guarantee quality and freshness for all items in our baskets."
        }
      ]
    },
    {
      title: "Delivery & Pickup",
      faqs: [
        {
          question: "What are the delivery options?",
          answer: "We offer two options: 1) Speedy Drop - 2-hour delivery to your doorstep for KES 200, and 2) Free pickup at any Quickmart location at your convenience."
        },
        {
          question: "How long does delivery take?",
          answer: "Speedy Drop delivery takes 1-2 hours from order confirmation. Pickup orders are ready within 1 hour at your selected Quickmart location."
        },
        {
          question: "Can I change my delivery address?",
          answer: "Yes, you can change your delivery address up to 30 minutes after placing your order by contacting our support team."
        },
        {
          question: "What if I'm not home during delivery?",
          answer: "Our delivery team will call you before arrival. If you're unavailable, we can leave the order with a trusted neighbor or reschedule delivery."
        }
      ]
    },
    {
      title: "Payment & Pricing",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept M-Pesa, Visa/Mastercard, Rukisha Wallet, and cash payments for both delivery and pickup orders."
        },
        {
          question: "How much do I save with basket bundles?",
          answer: "Our baskets offer 15-30% savings compared to buying items individually. The larger the basket, the greater the savings."
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees. The only additional cost is the KES 200 delivery fee for Speedy Drop. Pickup is completely free."
        },
        {
          question: "Can I get a refund?",
          answer: "Yes, we offer full refunds for damaged or incorrect items within 24 hours of delivery/pickup. Contact our support team for assistance."
        }
      ]
    },
    {
      title: "Account & Support",
      faqs: [
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page and enter your phone number. You'll receive an SMS with instructions to reset your password."
        },
        {
          question: "Can I cancel my order?",
          answer: "Orders can be cancelled within 15 minutes of placement. After this time, the order goes into processing and cannot be cancelled."
        },
        {
          question: "How do I contact customer support?",
          answer: "You can reach us at +254 700 123 456, email support@getdeals.co.ke, or use the contact form on our website. We're available Mon-Sat, 8AM-8PM."
        },
        {
          question: "Do you offer wholesale pricing?",
          answer: "Yes, we offer seasonal wholesale packages for businesses and large families. Contact us for custom wholesale pricing and terms."
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions about GetDeals Kenya. Can't find what you're looking for? Contact our support team.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length > 0 ? (
            <div className="space-y-8">
              {filteredFAQs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.faqs.map((faq, faqIndex) => (
                        <AccordionItem 
                          key={faqIndex} 
                          value={`${categoryIndex}-${faqIndex}`}
                          className="border border-border rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-left hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any FAQs matching your search. Try different keywords or contact our support team.
              </p>
              <Button onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
              <p className="text-muted-foreground mb-6">
                Our customer support team is here to help you. Get in touch and we'll respond as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Contact Support
                </Button>
                <Button variant="outline" size="lg">
                  Call +254 700 123 456
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}