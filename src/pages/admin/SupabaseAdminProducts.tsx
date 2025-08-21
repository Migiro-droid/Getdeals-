import React, { useState, useRef } from "react";
import * as Papa from "papaparse";
import { useSupabaseProducts } from "@/contexts/SupabaseProductsContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image as ImageIcon, Plus, Trash2, Edit } from "lucide-react";

export default function SupabaseAdminProducts() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const { all, loading, add, update, remove, refresh } = useSupabaseProducts();
  const { isAdmin } = useSupabaseAuth();
  const { toast } = useToast();
  
  const emptyDraft = { 
    name: "", 
    price: "", 
    original_price: "", 
    image_url: "", 
    category: "basket", 
    description: "", 
    itemsText: "",
    is_basket: false,
    stock_quantity: "0"
  };
  
  const [draft, setDraft] = useState<typeof emptyDraft>(emptyDraft);
  const [filter, setFilter] = useState<string>("all");

  // Image upload handler
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setImageUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  // CSV upload handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let added = 0, failed = 0;
        
        for (const row of rows) {
          if (!row.name || !row.price || !row.category) {
            failed++;
            continue;
          }
          
          try {
            const items = row.items ? String(row.items).split(/[,;]+/).map((s) => s.trim()).filter(Boolean) : undefined;
            
            await add({
              name: row.name,
              price: Number(row.price),
              original_price: row.original_price ? Number(row.original_price) : undefined,
              image_url: row.image_url || "/placeholder.svg",
              category: row.category,
              description: row.description || undefined,
              items,
              is_basket: Boolean(row.is_basket),
              stock_quantity: Number(row.stock_quantity) || 0,
            });
            added++;
          } catch (error) {
            failed++;
          }
        }
        
        setUploading(false);
        toast({ 
          title: "CSV Upload Complete", 
          description: `${added} products added, ${failed} failed.` 
        });
        
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: () => {
        setUploading(false);
        toast({ 
          title: "CSV Upload Failed", 
          description: "Could not parse file." 
        });
      }
    });
  };

  const onImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      setDraft(d => ({ ...d, image_url: imageUrl }));
      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully",
      });
    }
  };

  const onAdd = async () => {
    const safeDraft = draft || emptyDraft;
    if (!safeDraft.name || !safeDraft.price || !safeDraft.image_url) {
      toast({
        title: "Validation Error",
        description: "Name, price and image are required",
        variant: "destructive",
      });
      return;
    }
    
    const items = safeDraft.itemsText
      ? safeDraft.itemsText.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    
    try {
      // Use API endpoint instead of Supabase client to bypass RLS
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: safeDraft.name,
          price: Number(safeDraft.price),
          originalPrice: safeDraft.original_price ? Number(safeDraft.original_price) : undefined,
          image: safeDraft.image_url,
          category: safeDraft.category,
          description: safeDraft.description || undefined,
          items,
          itemsDetail: undefined, // Can be added later if needed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newProduct = await response.json();
      
      setDraft(emptyDraft);
      toast({ 
        title: "Product added", 
        description: "Product was added successfully" 
      });
      
      // Refresh the products list
      refresh();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || String(err);
      toast({ 
        title: "Failed", 
        description: `Could not add product: ${msg}`,
        variant: "destructive"
      });
    }
  };

  const onImageUploadForProduct = async (productId: string, file: File) => {
    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      await update(productId, { image_url: imageUrl });
    }
  };

  const visible = all.filter(p => filter === "all" ? true : p.category === filter);
  const categories = Array.from(new Set(all.map(p => p.category))).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Products & Baskets Manager</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh}>
              Refresh
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Product
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CSV Upload */}
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center p-4 bg-muted/50 rounded-lg">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleCSVUpload}
                disabled={uploading}
                className="block"
              />
              <span className="text-xs text-muted-foreground">
                Upload CSV to bulk add products (columns: name, price, category, description, items, original_price, image_url, is_basket, stock_quantity)
              </span>
              {uploading && <Badge variant="secondary">Uploading...</Badge>}
            </div>

            <Separator />

            {/* Individual Product Form */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input 
                    value={draft.name} 
                    onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} 
                    placeholder="Enter product name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Price (KES) *</Label>
                    <Input 
                      type="number" 
                      value={draft.price} 
                      onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))} 
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Original Price</Label>
                    <Input 
                      type="number" 
                      value={draft.original_price} 
                      onChange={(e) => setDraft(d => ({ ...d, original_price: e.target.value }))} 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category *</Label>
                    <Select value={draft.category} onValueChange={(v) => setDraft(d => ({ ...d, category: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basket">Basket</SelectItem>
                        <SelectItem value="essential">Essential</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="alcohol">Alcohol</SelectItem>
                        <SelectItem value="blackfriday">Black Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input 
                      type="number" 
                      value={draft.stock_quantity} 
                      onChange={(e) => setDraft(d => ({ ...d, stock_quantity: e.target.value }))} 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={draft.description} 
                    onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))} 
                    placeholder="Product description"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Items (comma-separated)</Label>
                  <Input 
                    value={draft.itemsText} 
                    onChange={(e) => setDraft(d => ({ ...d, itemsText: e.target.value }))} 
                    placeholder="e.g. 2kg Rice, 1kg Sugar, 500ml Oil"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Product Image *</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        value={draft.image_url} 
                        onChange={(e) => setDraft(d => ({ ...d, image_url: e.target.value }))} 
                        placeholder="Image URL or upload below"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={imageUploading}
                      >
                        {imageUploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onImageSelect}
                      className="hidden"
                    />
                    {draft.image_url && (
                      <div className="border rounded-lg p-2">
                        <img 
                          src={draft.image_url} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_basket"
                    checked={draft.is_basket}
                    onChange={(e) => setDraft(d => ({ ...d, is_basket: e.target.checked }))}
                  />
                  <Label htmlFor="is_basket">Is this a basket/bundle?</Label>
                </div>

                <Button onClick={onAdd} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter and Products List */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary">{visible.length} products</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {visible.map(p => (
                <div key={p.id} className="grid md:grid-cols-6 gap-4 p-4 items-center">
                  {/* Product Image & Name */}
                  <div className="md:col-span-2 flex items-center gap-3">
                    <div className="relative">
                      <div className="h-16 w-16 rounded bg-muted overflow-hidden flex items-center justify-center">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="max-w-full max-h-full object-contain" 
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} 
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-1 -right-1 h-6 w-6 p-0"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) onImageUploadForProduct(p.id, file);
                          };
                          input.click();
                        }}
                      >
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input 
                        defaultValue={p.name} 
                        onBlur={(e) => update(p.id, { name: e.target.value })} 
                        className="font-medium"
                      />
                      <Badge variant="outline" className="mt-1 text-xs">
                        {p.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Price</Label>
                    <Input 
                      type="number" 
                      defaultValue={p.price} 
                      onBlur={(e) => update(p.id, { price: Number(e.target.value) })} 
                    />
                  </div>

                  {/* Original Price */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Original</Label>
                    <Input 
                      type="number" 
                      defaultValue={p.original_price ?? ""} 
                      onBlur={(e) => update(p.id, { original_price: e.target.value ? Number(e.target.value) : undefined })} 
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Stock</Label>
                    <Input 
                      type="number" 
                      defaultValue={p.stock_quantity ?? 0} 
                      onBlur={(e) => update(p.id, { stock_quantity: Number(e.target.value) })} 
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {visible.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No products found. Add some products to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}