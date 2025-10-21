import { useState, useEffect } from "react";
import { SortAsc, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/contexts/ProductsContext";
import { useSearchParams, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DealsPage() {
  const [sortBy, setSortBy] = useState("featured");
  const [filter, setFilter] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const { all } = useProducts();

  // Show ALL individual products (1-item products)
  // Individual items are those with 0 or 1 items in the items array
  const dealsOnly = all.filter(p => {
    const items = Array.isArray(p.items) ? p.items : [];
    // Show products that have 0 or 1 item (individual deals, not baskets)
    return items.length <= 1;
  });

  const categories = Array.from(new Set(dealsOnly.map(p => p.category))).filter(Boolean);

  // Initialize filter from URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFilter(categoryParam);
    }
  }, [searchParams]);

  // Apply filter
  const visible = dealsOnly.filter(p => filter === 'all' ? true : p.category === filter);

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
      case "newest":
        return (b.id as any) - (a.id as any);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <h1 className="text-3xl lg:text-4xl font-bold">Special Deals & Promotions</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover our best offers on individual products. Limited-time deals on items you love.
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/baskets">
              <Button variant="outline">Browse All Baskets</Button>
            </Link>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Category:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-2">
              {visible.length} {visible.length === 1 ? 'deal' : 'deals'} available
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
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="discount">Highest Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-12">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-2xl mb-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Deals Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try adjusting your filters or check back soon for new promotional offers!
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/baskets">Browse Baskets</Link>
              </Button>
              <Button variant="outline" onClick={() => {
                setFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
          <h2 className="text-2xl font-bold mb-4">Get Notified of New Deals</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribe to receive alerts when we add new deals and promotions to our catalog.
          </p>
          <Button size="lg">Subscribe to Deals</Button>
        </div>
      </div>
    </div>
  );
}
