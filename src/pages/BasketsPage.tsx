import { useState } from "react";
import { SortAsc, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/contexts/ProductsContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BasketsPage() {
  const [sortBy, setSortBy] = useState("featured");
  const [filter, setFilter] = useState<string>("all");
  const { all } = useProducts();
  const basketsOnly = all.filter(p => p.category !== 'alcohol' && p.category !== 'blackfriday');
  const categories = Array.from(new Set(basketsOnly.map(p => p.category))).filter(Boolean);
  const visible = basketsOnly.filter(p => filter === 'all' ? true : p.category === filter);

  const sortedProducts = [...visible].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "discount":
        const aDiscount = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
        const bDiscount = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
        return bDiscount - aDiscount;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Our Curated Baskets</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Choose from our carefully selected bundles designed to save you time and money on your grocery shopping.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <Alert className="mb-8 border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 p-6 rounded-lg shadow-lg flex items-start">
          <Rocket className="h-8 w-8 -mt-1 mr-4 text-blue-600 flex-shrink-0" />
          <div className="flex-grow">
            <AlertTitle className="text-2xl font-extrabold mb-1">Launching Soon!</AlertTitle>
            <AlertDescription className="text-base">
              Get ready for incredible savings! Our curated baskets below are just around the corner. Be the first to know when they drop!
            </AlertDescription>
          </div>
        </Alert>

        {}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {visible.length} baskets available
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="discount">Highest Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {}
        <div className="text-center py-12 bg-muted/30 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Basket?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Contact us to create a personalized basket that perfectly fits your family's needs.
          </p>
          <Button size="lg">Contact Us</Button>
        </div>
      </div>
    </div>
  );
}