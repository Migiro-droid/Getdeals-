import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import riceImage from "@/assets/products/rice.jpg";
import sugarImage from "@/assets/products/sugar.jpg";
import oilImage from "@/assets/products/oil.jpg";
import breadImage from "@/assets/products/bread.jpg";
import flourImage from "@/assets/products/flour.jpg";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getProductImages = (items: string[]) => {
  return items.map(item => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('rice')) return { name: item, image: riceImage };
    if (itemLower.includes('sugar')) return { name: item, image: sugarImage };
    if (itemLower.includes('oil')) return { name: item, image: oilImage };
    if (itemLower.includes('bread')) return { name: item, image: breadImage };
    if (itemLower.includes('flour')) return { name: item, image: flourImage };
    return { name: item, image: riceImage }; // fallback
  });
};

export function ProductDetailModal({ product, open, onOpenChange }: ProductDetailModalProps) {
  const { addItem } = useCart();

  if (!product) return null;

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productItems = product.items ? getProductImages(product.items) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-80 object-cover rounded-lg"
            />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">KES {product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="text-lg line-through text-muted-foreground">
                      KES {product.originalPrice.toLocaleString()}
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

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {productItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Items Included</h3>
                <div className="grid grid-cols-2 gap-4">
                  {productItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="text-sm font-medium">{item.name}</span>
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
                  addItem(product);
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
    </Dialog>
  );
}