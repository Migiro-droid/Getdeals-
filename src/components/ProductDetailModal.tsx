import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, AlertCircle, Package } from "lucide-react";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/contexts/ProductsContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredDialog } from "./AuthRequiredDialog";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soldOut?: boolean;
}


export function ProductDetailModal({ product, open, onOpenChange, soldOut }: ProductDetailModalProps) {
  const { addItem } = useCart();
  const { version, all } = useProducts();
  const { isAuthenticated } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const withVersion = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const ensured = url.startsWith("/") ? url : `/${url}`;
    return `${ensured}${ensured.includes('?') ? '&' : '?'}v=${version}`;
  };

  if (!product) return null;

  const liveFromStore = all.find(p => p.id === product.id);
  const live = { ...liveFromStore, ...product } as Product;

  // Check if item is sold out
  const isSoldOut = soldOut || product.soldOut;

  const discount = live.originalPrice 
    ? Math.round(((live.originalPrice - live.price) / live.originalPrice) * 100)
    : 0;

  const itemDetails = Array.isArray(live.itemsDetail) ? live.itemsDetail : [];
  const nameOnlyItems = itemDetails.length === 0 && Array.isArray(live.items) ? live.items : [];

  // Debug log to see what items we have
  console.log('🔍 ProductDetailModal - Items Debug:', {
    productId: live.id,
    productName: live.name,
    itemsDetail: itemDetails,
    nameOnlyItems: nameOnlyItems,
    itemsLength: live.items?.length,
  });

  // SOLD OUT MODAL CONTENT
  if (isSoldOut) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-red-100 w-fit">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Temporarily Unavailable</DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              {live.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Main message */}
            <div className="text-center space-y-2">
              <p className="text-gray-700 font-medium">
                We're sorry! This item is currently sold out.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Due to high demand and customer popularity, this basket is temporarily unavailable. Don't worry – we're working hard to restock it!
              </p>
            </div>

            {/* Product info box */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Package className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">{live.name}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-gray-900">KES {live.price.toLocaleString()}</span>
                {live.originalPrice && (
                  <span className="text-sm line-through text-gray-500">
                    KES {live.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <div className="mt-2">
                  <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                    Save {discount}%
                  </Badge>
                </div>
              )}
            </div>

            {/* What to do next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What's next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Check back soon for restocking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Explore similar baskets on our Baskets page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Browse other great deals and collections</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Continue Shopping
            </Button>
            <Button 
              size="lg"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={() => {
                onOpenChange(false);
                // Optionally navigate to baskets page
                window.location.href = '/baskets';
              }}
            >
              View All Baskets
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
      <DialogTitle className="text-2xl font-bold">{live.name}</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        View product details and add to cart
      </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8">
          {}
          <div className="space-y-4">
            <div className="w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={withVersion(live.image)}
                alt={live.name}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://images.unsplash.com/photo-1542838132-92c53300491e?w=500`; }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">KES {live.price.toLocaleString()}</span>
                  {live.originalPrice && (
                    <span className="text-lg line-through text-muted-foreground">
                      KES {live.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    Save {discount}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{live.description}</p>
            </div>

            {(itemDetails.length > 0 || nameOnlyItems.length > 0) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-bold mb-3 text-gray-900">Items Included ({itemDetails.length || nameOnlyItems.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {itemDetails.length > 0
                    ? itemDetails.map((item, index) => {
                        const raw = (item.image || '').trim();
                        const src = raw ? withVersion(raw) : `/placeholder.svg?v=${version}`;
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="w-14 h-14 bg-white rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                              <img
                                src={src}
                                alt={item.name || 'Item'}
                                loading="lazy"
                                decoding="async"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://images.unsplash.com/photo-1542838132-92c53300491e?w=500`; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <span className="text-sm font-semibold text-gray-900 block">{item.name || 'Item'}</span>
                            </div>
                          </div>
                        );
                      })
                    : nameOnlyItems.map((name, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="w-14 h-14 bg-white rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Item</span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <span className="text-sm font-semibold text-gray-900 line-clamp-2">{String(name)}</span>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => {
                  if (!isAuthenticated) { setShowAuthDialog(true); return; }
                  addItem(live);
                  onOpenChange(false);
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
  <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </Dialog>
  );
}
