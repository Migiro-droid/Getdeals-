import { useParams, Link } from "react-router-dom";
import { useProducts } from "@/contexts/ProductsContext";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { all } = useProducts();

  const categoryName = slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: '📱' },
    { name: 'Fashion', slug: 'fashion', icon: '👕' },
    { name: 'Home & Garden', slug: 'home-garden', icon: '🏠' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽' },
    { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄' },
    { name: 'Books & Media', slug: 'books-media', icon: '📚' },
    { name: 'Toys & Games', slug: 'toys-games', icon: '🎮' },
    { name: 'Automotive', slug: 'automotive', icon: '🚗' },
    { name: 'Food & Beverages', slug: 'food-beverages', icon: '🍕' },
    { name: 'Office Supplies', slug: 'office-supplies', icon: '📎' }
  ];

  const category = categories.find(cat => cat.slug === slug);

  const categoryProducts = all.filter(p => p.category === categoryName);

  if (!category) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The category you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">{category.name}</h1>
              <p className="text-muted-foreground">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} available
              </p>
            </div>
          </div>
        </div>

        {}
        {categoryProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
              <p className="text-muted-foreground mb-6">
                There are no products in the {category.name} category yet.
              </p>
              <Button asChild>
                <Link to="/baskets">
                  Browse All Products
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
