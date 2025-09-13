import { useParams, Link } from "react-router-dom";
import { useProducts } from "@/contexts/ProductsContext";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { all } = useProducts();

  const categories = [
    { name: 'Essential Baskets', slug: 'essential', icon: '🛒' },
    { name: 'Family Baskets', slug: 'family', icon: '👨‍👩‍👧‍👦' },
    { name: 'Custom Baskets', slug: 'basket', icon: '🎁' },
    { name: 'Holiday Specials', slug: 'holiday', icon: '🎄' },
    { name: 'School Essentials', slug: 'school', icon: '🎓' }
  ];

  const category = categories.find(cat => cat.slug === slug);

  // Use the slug directly to match product categories
  const categoryProducts = all.filter(p => p.category === slug);

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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/baskets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Baskets
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{category.icon}</span>
            <h1 className="text-3xl lg:text-4xl font-bold">{category.name}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover our {category.name.toLowerCase()} collection.
          </p>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">
              There are currently no products in this category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Showing {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
