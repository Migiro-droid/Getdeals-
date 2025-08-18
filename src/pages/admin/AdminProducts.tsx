import React, { useState, useRef } from "react";
import * as Papa from "papaparse";
import { useProducts } from "@/contexts/ProductsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AdminProductItemsModal } from "./AdminProductItemsModalEnhanced";

export default function AdminProducts() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // CSV upload handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        let added = 0, failed = 0;
        // Use a helper to sequentially add products
        const addNext = async (i: number) => {
          if (i >= rows.length) {
            setUploading(false);
            toast({ title: "CSV Upload Complete", description: `${added} added, ${failed} failed. Edit image URLs as needed.` });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          const row = rows[i];
          if (!row.name || !row.price || !row.category) { failed++; return addNext(i+1); }
          const items = row.items ? String(row.items).split(",").map((s) => s.trim()).filter(Boolean) : undefined;
          add({
            name: row.name,
            price: Number(row.price),
            originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
            image: "", // admin will edit after upload
            category: row.category,
            description: row.description || undefined,
            items,
          }).then(() => { added++; addNext(i+1); })
            .catch(() => { failed++; addNext(i+1); });
        };
        addNext(0);
      },
      error: () => {
        setUploading(false);
        toast({ title: "CSV Upload Failed", description: "Could not parse file." });
      }
    });
  };

  const { all, add, update, remove, restoreDefaults } = useProducts();
  const { toast } = useToast();
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const emptyDraft = { name: "", price: "", originalPrice: "", image: "", category: "basket", description: "", itemsText: "" };
  const [draft, setDraft] = useState<typeof emptyDraft>(emptyDraft);
  const [filter, setFilter] = useState<string>("all");

  const normalizeUrl = (url: string) => {
    let v = (url || "").trim();
    if (!v) return v;
    v = v.replace(/\\+/g, "/");
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    v = v.replace(/^\.\//, "");
    v = v.replace(/^\/public\//, "/");
    v = v.replace(/^public\//, "");
    if (!v.startsWith("/")) v = "/" + v;
    return v;
  };

  const onAdd = async () => {
    const safeDraft = draft || emptyDraft;
    if (!safeDraft.name || !safeDraft.price || !safeDraft.image) return alert("Name, price and image are required");
    const items = safeDraft.itemsText
      ? safeDraft.itemsText.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    try {
      const payload = {
        name: safeDraft.name,
        price: Number(safeDraft.price),
        originalPrice: safeDraft.originalPrice ? Number(safeDraft.originalPrice) : undefined,
        image: normalizeUrl(safeDraft.image),
        category: safeDraft.category,
        description: safeDraft.description || undefined,
        items,
      } as any;

      await add(payload);
      setDraft(emptyDraft);
      toast({ title: "Product added", description: "Product was added successfully" });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || String(err);
      toast({ title: "Failed", description: `Could not add product: ${msg}` });
    }
  };

  const visible = all.filter(p => filter === "all" ? true : p.category === filter);
  const categories = Array.from(new Set(all.map(p => p.category))).filter(Boolean);

  // Defensive: always use a valid draft object
  const safeDraft = draft || emptyDraft;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Products & Baskets</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => restoreDefaults()}>Restore Defaults</Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-5 gap-3">
            <div className="md:col-span-5 flex flex-col md:flex-row gap-2 items-start md:items-center mb-2">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleCSVUpload}
                disabled={uploading}
                className="block"
              />
              <span className="text-xs text-muted-foreground">Upload CSV to bulk add products (columns: name, price, category, description, items, originalPrice)</span>
              {uploading && <span className="text-xs text-blue-600 ml-2">Uploading...</span>}
            </div>
            <div>
              <Label>Name</Label>
              <Input value={safeDraft.name} onChange={(e) => setDraft(d => ({ ...(d || emptyDraft), name: e.target.value }))} />
            </div>
            <div>
              <Label>Price (KES)</Label>
              <Input type="number" value={safeDraft.price} onChange={(e) => setDraft(d => ({ ...(d || emptyDraft), price: e.target.value }))} />
            </div>
            <div>
              <Label>Original Price (optional)</Label>
              <Input type="number" value={safeDraft.originalPrice} onChange={(e) => setDraft(d => ({ ...(d || emptyDraft), originalPrice: e.target.value }))} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={safeDraft.image} onChange={(e) => setDraft(d => ({ ...(d || emptyDraft), image: e.target.value }))} placeholder="/path or https://" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={safeDraft.category} onValueChange={(v) => setDraft(d => ({ ...(d || emptyDraft), category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basket">basket</SelectItem>
                  <SelectItem value="essential">essential</SelectItem>
                  <SelectItem value="family">family</SelectItem>
                  <SelectItem value="holiday">holiday</SelectItem>
                  <SelectItem value="school">school</SelectItem>
                  <SelectItem value="alcohol">alcohol</SelectItem>
                  <SelectItem value="blackfriday">blackfriday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <Label>Description</Label>
              <Textarea value={safeDraft.description} onChange={(e) => setDraft(d => ({ ...(d || emptyDraft), description: e.target.value }))} placeholder="Short description shown under price" rows={2} />
            </div>
            <div className="md:col-span-5">
              <Label>Items (comma-separated)</Label>
              <Input value={safeDraft.itemsText} onChange={(e) => setDraft(d => ({ ...(d || emptyDraft), itemsText: e.target.value }))} placeholder="e.g. 2kg Rice, 1kg Sugar, 500ml Oil" />
              <p className="text-xs text-muted-foreground mt-1">This powers the "X Items" text. "Save KES" shows when Original Price is higher than Price.</p>
            </div>
            <div className="md:col-span-5">
              <Button onClick={onAdd}>Add Item</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">{visible.length} items</div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {visible.map(p => (
                <div key={p.id} className="grid md:grid-cols-7 gap-6 p-3 items-center">
                  {/* Name with thumbnail */}
                  <div className="flex items-center gap-3 md:col-span-2">
                    <div className="h-12 w-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                      <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
                    </div>
                    <Input defaultValue={p.name} onBlur={(e) => update(p.id, { name: e.target.value })} />
                  </div>
                  {/* Price */}
                  <div>
                    <Input type="number" defaultValue={p.price} onBlur={(e) => update(p.id, { price: Number(e.target.value) })} />
                  </div>
                  {/* Original price */}
                  <div>
                    <Input type="number" defaultValue={p.originalPrice ?? ""} onBlur={(e) => update(p.id, { originalPrice: e.target.value ? Number(e.target.value) : undefined })} />
                  </div>
                  {/* Image URL editor */}
                  <div>
                    <Input
                      defaultValue={p.image}
                      placeholder="/path or https://"
                      onBlur={(e) => update(p.id, { image: normalizeUrl(e.target.value) })}
                    />
                  </div>
                  {/* Category */}
                  <div className="pr-8 lg:pr-12">
                    <Select defaultValue={p.category} onValueChange={(v) => update(p.id, { category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['basket','essential','family','holiday','school','alcohol','blackfriday'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end pl-8 lg:pl-12">
                    <Button variant="secondary" onClick={() => { setActiveProductId(p.id); setItemsModalOpen(true); }}>Manage Items</Button>
                    <Button variant="outline" onClick={() => remove(p.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <AdminProductItemsModal
          product={all.find(x => x.id === activeProductId) || null}
          open={itemsModalOpen}
          onOpenChange={setItemsModalOpen}
          onSave={(itemsDetail) => {
            if (!activeProductId) return;
            try {
              update(activeProductId, { itemsDetail });
              toast({ title: "Items updated", description: "Item pictures saved." });
            } catch (e) {
              toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" as any });
            }
          }}
        />
      </div>
    </div>
  );
}
