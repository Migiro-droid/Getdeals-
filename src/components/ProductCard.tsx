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
  itemsDetail?: { name: string; image: string }[];
  category: string;
  description?: string;
  soldOut?: boolean;
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  showSoldOut?: boolean;
}

export function ProductCard({ product, onQuickView, showSoldOut }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { version } = useProducts();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // ✅ Fixed versioning
  const withVersion = (url: string) => {
    if (!url) return "/placeholder.svg";

    // Only append version for external URLs
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return `${url}${url.includes("?") ? "&" : "?"}v=${version}`;
    }

    // Local/public assets - no ?v needed
    return url.startsWith("/") ? url : `/${url}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if product is sold out - show modal instead
    if (product.soldOut || showSoldOut) {
      setShowDetailModal(true);
      return;
    }
    
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

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} has been ${
        isWishlisted ? "removed from" : "added to"
      } your wishlist.`,
    });
  };

  const discountPercentage =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : product.discount;

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-sm cursor-pointer border border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <div className="w-full aspect-square bg-muted flex items-center justify-center">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain opacity-0 transition-opacity duration-300"
            onLoad={(e) => {
              e.currentTarget.style.opacity = "1"; // ✅ fade-in
            }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.src.includes("unsplash")) {
                img.src = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop';
                img.style.opacity = "1";
              }
            }}
          />
        </div>

        {/* Discount Badge or Sold Out Badge */}
        {(product.soldOut || showSoldOut) ? (
          <Badge className="absolute top-1 left-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs py-1.5 px-2.5 font-bold rounded-md shadow-lg hover:shadow-xl transition-all">
            Sold Out
          </Badge>
        ) : discountPercentage ? (
          <Badge className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-xs py-0.5 px-1.5">
            -{discountPercentage}%
          </Badge>
        ) : null}

        {/* Wishlist Button */}
        <Button
          aria-label="Add to wishlist"
          variant="ghost"
          size="icon"
          className={`absolute top-1 right-1 h-7 w-7 transition-all duration-300 ${
            isHovered
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          } ${isWishlisted
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive"}`}
          onClick={handleWishlist}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
        </Button>

        {/* Quick Actions Overlay */}
        {isHovered && (
          <div
            className={`absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent transition-all duration-300 opacity-100 translate-y-0`}
          >
            <div className="flex gap-1">
              <Button size="sm" className="flex-1 text-xs h-7" onClick={handleAddToCart}>
                <ShoppingCart className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button
                aria-label="Quick view"
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView ? onQuickView(product) : setShowDetailModal(true);
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-2">
        <h3 className="font-medium text-xs mb-1 line-clamp-2 h-7">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline space-x-1">
          <span className="font-bold text-sm text-primary">
            KES {product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {product.items && product.items.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            {product.items.length} items
          </p>
        )}
      </CardContent>

      <ProductDetailModal
        product={product}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        soldOut={product.soldOut || showSoldOut}
      />
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </Card>
  );
}
