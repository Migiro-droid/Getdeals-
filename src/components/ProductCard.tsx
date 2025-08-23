import { useState } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { useProducts } from "@/contexts/ProductsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ProductDetailModal } from "./ProductDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredDialog } from "./AuthRequiredDialog";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  items?: string[];
  category: string;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { version } = useProducts();
  const withVersion = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const ensured = url.startsWith("/") ? url : `/${url}`;
  return `${ensured}${ensured.includes('?') ? '&' : '?'}v=${version}`;
  };
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} has been ${
        isWishlisted ? "removed from" : "added to"
      } your wishlist.`,
    });
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount;

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-medium cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center">
          <img
            src={withVersion(product.image)}
            alt={product.name}
            className="max-w-full max-h-full object-contain transition-transform duration-300"
          />
        </div>
        
        {/* Discount Badge */}
        {discountPercentage && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
            {discountPercentage}% OFF
          </Badge>
        )}

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 h-8 w-8 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${isWishlisted ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
          onClick={handleWishlist}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </Button>

        {/* Quick Actions Overlay */}
  <div
          className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDetailModal(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
        
        {product.items && (
          <p className="text-xs text-muted-foreground mb-2">
            {product.items.length} Items ΓÇó Save KES {product.originalPrice ? (product.originalPrice - product.price) : 0}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-primary">
              KES {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                KES {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {product.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>
      
      <ProductDetailModal 
        product={product}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
  <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </Card>
  );
}
