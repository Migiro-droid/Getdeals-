import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [rows, setRows] = useState<ItemDetail[]>([]);

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
  }, [product]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="text-xl">Edit Items for: {product.name}</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 110px)" }}>
          <p className="text-xs text-muted-foreground">Tip: Click “Save Row” to persist a row without closing, or “Save & Close” to save all changes.</p>
          {rows.length === 0 && (
            <div className="text-sm text-muted-foreground">No items yet. Click "Add Item" to start.</div>
          )}
          {rows.map((row, idx) => (
            <div key={idx} className="rounded-lg border p-3">
              <div className="grid grid-cols-5 gap-3 items-end">
                <div className="col-span-2">
                  <Label className="text-xs">Item Name</Label>
                  <Input className="h-9" value={row.name} onChange={(e) => {
                    const v = e.target.value;
                    setRows((r) => r.map((x, i) => i === idx ? { ...x, name: v } : x));
                  }} />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Item Image URL</Label>
                  <Input className="h-9" placeholder="/path or https://" value={row.image} onChange={(e) => {
                    const v = e.target.value;
                    setRows((r) => r.map((x, i) => i === idx ? { ...x, image: v } : x));
                  }} />
                  <p className="text-xs text-muted-foreground mt-1">Use a full URL (https://...) or a path in public, e.g. /images/item.jpg</p>
                </div>
                <div className="col-span-5 flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
          {row.image && (
                      <img
            src={normalizeUrl(row.image)}
                        alt={row.name}
                        className="h-10 w-10 object-contain rounded border bg-muted"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                    )}
                    <span className="text-xs text-muted-foreground">Preview</span>
                    {row.image && (
                      <a
                        href={normalizeUrl(row.image)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-primary"
                        title="Open image in a new tab"
                      >
                        Open
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => {
                      // Save current rows without closing
                      const cleaned = rows
                        .filter(r => r.name && r.name.trim())
                        .map(r => ({ name: r.name.trim(), image: normalizeUrl(r.image) }));
                      onSave(cleaned);
                    }}>Save Row</Button>
                    <Button size="sm" variant="outline" onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}>Remove</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
          <Button variant="outline" onClick={() => setRows((r) => [...r, { name: "", image: "" }])}>Add Item</Button>
          <div className="space-x-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => {
              const cleaned = rows
                .filter(r => r.name && r.name.trim())
                .map(r => ({ name: r.name.trim(), image: normalizeUrl(r.image) }));
              onSave(cleaned);
              onOpenChange(false);
            }}>Save & Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
