import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X } from "lucide-react";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/contexts/ProductsContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredDialog } from "./AuthRequiredDialog";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export function ProductDetailModal({ product, open, onOpenChange }: ProductDetailModalProps) {
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
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/placeholder.svg?v=${version}`; }}
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
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/placeholder.svg?v=${version}`; }}
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
