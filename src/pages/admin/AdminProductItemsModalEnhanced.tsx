import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, ImageIcon, Save, Plus, Trash2, Eye, ExternalLink, Info } from "lucide-react";
import type { Product } from "@/data/products";

type ItemDetail = { name: string; image: string };

export function AdminProductItemsModal({
  product,
  open,
  onOpenChange,
  onSave,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (itemsDetail: ItemDetail[]) => void;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ItemDetail[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const normalizeUrl = (url: string) => {
    let v = (url || "").trim();
    if (!v) return v;
    // Convert backslashes to forward slashes (Windows copy-paste)
    v = v.replace(/\\+/g, "/");
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    // Strip leading ./ or /public or public
    v = v.replace(/^\.\//, "");
    v = v.replace(/^\/public\//, "/");
    v = v.replace(/^public\//, "");
    // Warn-ish: src/assets is not served at runtime; keep as-is but prefix slash so it's obvious 404 if used
    if (!v.startsWith("/")) v = "/" + v;
    return v; // path under public/
  };

  useEffect(() => {
    if (!product) return;
    const base: ItemDetail[] = product.itemsDetail && product.itemsDetail.length
      ? product.itemsDetail
      : (product.items || []).map((name) => ({ name, image: "" }));
    setRows(base);
    setHasChanges(false);
  }, [product]);

  const updateRow = (idx: number, field: keyof ItemDetail, value: string) => {
    setRows((r) => r.map((x, i) => i === idx ? { ...x, [field]: value } : x));
    setHasChanges(true);
  };

  const addRow = () => {
    setRows((r) => [...r, { name: "", image: "" }]);
    setHasChanges(true);
  };

  const removeRow = (idx: number) => {
    setRows((r) => r.filter((_, i) => i !== idx));
    setHasChanges(true);
  };

  const saveCurrentState = () => {
    const cleaned = rows
      .filter(r => r.name && r.name.trim())
      .map(r => ({ name: r.name.trim(), image: normalizeUrl(r.image) }));
    onSave(cleaned);
    setHasChanges(false);
    toast({ 
      title: "Items saved successfully!", 
      description: `Updated ${cleaned.length} items for ${product?.name}` 
    });
  };

  const saveAndClose = () => {
    saveCurrentState();
    onOpenChange(false);
  };

  const isBasket = product?.category === "basket";
  const validRows = rows.filter(r => r.name && r.name.trim());
  const rowsWithImages = validRows.filter(r => r.image && r.image.trim());

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && hasChanges) {
        const shouldClose = confirm("You have unsaved changes. Are you sure you want to close without saving?");
        if (!shouldClose) return;
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Manage Items: {product.name}
                <Badge variant={isBasket ? "default" : "secondary"} className="text-xs">
                  {product.category}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isBasket ? "Configure individual items within this basket with their own images" : "Manage individual items and their images"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Items:</span>
                <Badge variant="outline">{validRows.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-green-600" />
                <span className="font-medium">With Images:</span>
                <Badge variant="outline" className="text-green-700 border-green-200">
                  {rowsWithImages.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Missing Images:</span>
                <Badge variant="outline" className="text-amber-700 border-amber-200">
                  {validRows.length - rowsWithImages.length}
                </Badge>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(95vh - 200px)" }}>
          {isBasket && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Basket Management:</strong> Each item in this basket can have its own image. 
                This helps customers see exactly what's included and improves the shopping experience.
              </AlertDescription>
            </Alert>
          )}

          {rows.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="text-lg font-medium mb-2">No items configured yet</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding items to this {isBasket ? 'basket' : 'product'}
                </p>
                <Button onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          )}

          {rows.map((row, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Item #{idx + 1}
                      </Badge>
                      {row.image && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Has Image
                        </Badge>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => removeRow(idx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Item Name */}
                    <div className="lg:col-span-1">
                      <Label className="text-sm font-medium">Item Name *</Label>
                      <Input 
                        className="mt-1" 
                        placeholder="e.g., 2kg Rice, 1L Oil..."
                        value={row.name} 
                        onChange={(e) => updateRow(idx, 'name', e.target.value)}
                      />
                    </div>

                    {/* Image URL */}
                    <div className="lg:col-span-2">
                      <Label className="text-sm font-medium">Item Image URL</Label>
                      <Input 
                        className="mt-1" 
                        placeholder="/images/products/rice.jpg or https://example.com/image.jpg"
                        value={row.image} 
                        onChange={(e) => updateRow(idx, 'image', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use a full URL (https://...) or a path in public folder (e.g., /images/products/item.jpg)
                      </p>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {row.image && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={normalizeUrl(row.image)}
                            alt={row.name || 'Item preview'}
                            className="h-16 w-16 object-cover rounded-lg border bg-white shadow-sm"
                            onError={(e) => { 
                              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; 
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Image Preview</span>
                          </div>
                          <p className="text-xs text-muted-foreground break-all">
                            {normalizeUrl(row.image)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(normalizeUrl(row.image), '_blank')}
                              className="text-xs h-7"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open in New Tab
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {rows.length > 0 && (
            <div className="pt-4 border-t">
              <Button onClick={addRow} variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Another Item
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={saveCurrentState}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Items
            </Button>
            <div className="text-sm text-muted-foreground">
              {hasChanges ? "You have unsaved changes" : "All changes saved"}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              disabled={hasChanges}
            >
              {hasChanges ? "Save first" : "Cancel"}
            </Button>
            <Button 
              onClick={saveAndClose}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
