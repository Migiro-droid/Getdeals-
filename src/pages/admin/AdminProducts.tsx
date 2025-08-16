import { useState } from "react";
import { useProducts } from "@/contexts/ProductsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function AdminProducts() {
  const { all, add, update, remove, restoreDefaults } = useProducts();
  const [draft, setDraft] = useState({ name: "", price: "", originalPrice: "", image: "", category: "basket" });
  const [filter, setFilter] = useState<string>("all");

  const onAdd = () => {
    if (!draft.name || !draft.price || !draft.image) return alert("Name, price and image are required");
    add({
      name: draft.name,
      price: Number(draft.price),
      originalPrice: draft.originalPrice ? Number(draft.originalPrice) : undefined,
      image: draft.image,
      category: draft.category,
      description: "",
    });
    setDraft({ name: "", price: "", originalPrice: "", image: "", category: "basket" });
  };

  const visible = all.filter(p => filter === "all" ? true : p.category === filter);
  const categories = Array.from(new Set(all.map(p => p.category))).filter(Boolean);

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
            <div>
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label>Price (KES)</Label>
              <Input type="number" value={draft.price} onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))} />
            </div>
            <div>
              <Label>Original Price (optional)</Label>
              <Input type="number" value={draft.originalPrice} onChange={(e) => setDraft(d => ({ ...d, originalPrice: e.target.value }))} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={draft.image} onChange={(e) => setDraft(d => ({ ...d, image: e.target.value }))} placeholder="/path or https://" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft(d => ({ ...d, category: v }))}>
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
                <div key={p.id} className="grid md:grid-cols-6 gap-3 p-3 items-center">
                  <div className="flex items-center gap-3 md:col-span-2">
                    <img src={p.image} alt={p.name} className="h-12 w-12 object-cover rounded" />
                    <Input defaultValue={p.name} onBlur={(e) => update(p.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <Input type="number" defaultValue={p.price} onBlur={(e) => update(p.id, { price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Input type="number" defaultValue={p.originalPrice ?? ""} onBlur={(e) => update(p.id, { originalPrice: e.target.value ? Number(e.target.value) : undefined })} />
                  </div>
                  <div>
                    <Select defaultValue={p.category} onValueChange={(v) => update(p.id, { category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['basket','essential','family','holiday','school','alcohol','blackfriday'].map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" onClick={() => remove(p.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
