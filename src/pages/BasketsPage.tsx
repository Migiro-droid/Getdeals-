import { useState, useEffect, useMemo } from "react";
import { SortAsc, ShoppingBag, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function BasketsPage() {
  const [sortBy, setSortBy] = useState("featured");
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchParams] = useSearchParams();
  const { all } = useProducts();


  const basketsOnly = all.filter(p => {
    const items = Array.isArray(p.items) ? p.items : [];
    return items.length >= 2;
  });

  const availableBasketNames = new Set([
    "Smart familia Saver",
    "Kikapu sawa", 
    "Wiki pack"
  ]);

  const categories = Array.from(new Set(basketsOnly.map(p => p.category))).filter(Boolean);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    if (categoryParam) {
      setFilter(categoryParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  const visible = useMemo(() => {
    let filtered = basketsOnly.filter(p => filter === 'all' ? true : p.category === filter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.items && p.items.some(item =>
          typeof item === 'string' && item.toLowerCase().includes(query)
        ))
      );
    }

    return filtered;
  }, [basketsOnly, filter, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...visible].sort((a, b) => {
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
  }, [visible, sortBy]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold">Our Curated Baskets</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Choose from our carefully selected bundles designed to save you time and money on your grocery shopping.
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/deals">
              <Button variant="outline">View All Deals</Button>
            </Link>
          </div>
        </div>

        {/* Filter and Sort */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search Bar */}
          <div className="w-full relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search baskets, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 border-0 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filter and Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Baskets</SelectItem>
                  {categories.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {visible.length} {visible.length === 1 ? 'basket' : 'baskets'} available
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
        </div>

        {/* Baskets Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-12">
          {sortedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              showSoldOut={!availableBasketNames.has(product.name)}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center border-t pt-12">
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