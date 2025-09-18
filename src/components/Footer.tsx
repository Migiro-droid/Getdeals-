import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                G
              </div>
              <span className="font-bold text-xl">GetDeals</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Smart shopping made easy. Get curated grocery baskets delivered to your doorstep or pickup at your nearest Quickmart.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link to="/baskets" className="block text-muted-foreground hover:text-primary transition-colors">
                Browse Baskets
              </Link>
              <Link to="/how-it-works" className="block text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link to="/delivery" className="block text-muted-foreground hover:text-primary transition-colors">
                Delivery Options
              </Link>
              <Link to="/payment" className="block text-muted-foreground hover:text-primary transition-colors">
                Payment Methods
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Service</h3>
            <div className="space-y-2 text-sm">
              <Link to="/faq" className="block text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Return Policy
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex space-x-2">
              <Input placeholder="Your email" className="flex-1" />
              <Button size="sm">Subscribe</Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Contact Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-3 md:gap-8 text-sm">
            <div className="flex items-center gap-2 md:whitespace-nowrap">
              <Mail className="h-4 w-4 text-primary" />
              <a
                href="mailto:info@getdeals.co.ke"
                className="hover:text-primary hover:underline underline-offset-4 transition-colors"
              >
                info@getdeals.co.ke
              </a>
            </div>
            <div className="flex items-center gap-2 md:whitespace-nowrap">
              <MapPin className="h-4 w-4 text-primary" />
              <a
                href="https://maps.google.com/?q=Karen%20Green,%20Nairobi,%20Kenya"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary hover:underline underline-offset-4 transition-colors"
              >
                Karen Green, Nairobi, Kenya
              </a>
            </div>
            <div className="flex items-center gap-2 md:whitespace-nowrap">
              <Phone className="h-4 w-4 text-primary" />
              <a
                href="tel:+254728322355"
                className="hover:text-primary hover:underline underline-offset-4 transition-colors"
              >
                +254 728 322 355
              </a>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {currentYear} GetDeals Kenya. All rights reserved.
            </p>
          </div>
          <div className="justify-self-center">
            <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/60 border border-border/60 px-3 py-1 rounded-full shadow-sm hover:bg-muted transition-colors">
              Powered by House of Procurement
            </span>
          </div>
          <div className="flex justify-center md:justify-end space-x-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}