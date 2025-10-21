# 🗄️ Implementation: Move Brands to Supabase

This guide will help you move the brands from hardcoded config to a Supabase table. This is the safest approach.

---

## Step 1: Create Brands Table in Supabase

Go to your Supabase project → **SQL Editor** → **New Query** → Copy this:

```sql
-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set table permissions
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read enabled brands
CREATE POLICY "Brands visible to all" ON public.brands
  FOR SELECT USING (enabled = true);

-- Only admins can insert/update/delete
-- (You'll add this after creating admin_users table if needed)

-- Insert your current brands
INSERT INTO public.brands (name, image, category, order_index) VALUES
('Brookside', 'https://www.brookside.co.ke/wp-content/uploads/2022/03/Brookside-Logo.png', 'Dairy', 1),
('Tusker', 'https://upload.wikimedia.org/wikipedia/en/thumb/4/48/Tusker_Logo.svg/1200px-Tusker_Logo.svg.png', 'Beverages', 2),
('Kenya Cane', 'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=400&h=400&fit=crop', 'Sugar', 3),
('Pembe', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', 'Flour', 4),
('Elianto', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', 'Cooking Oil', 5),
('Ketepa', 'https://www.ketepa.co.ke/wp-content/uploads/2020/01/Ketepa-Logo.png', 'Tea', 6),
('KCC', 'https://upload.wikimedia.org/wikipedia/en/8/84/New_KCC_Logo.png', 'Dairy', 7),
('Mumias Sugar', 'https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=400&h=400&fit=crop', 'Sugar', 8),
('Omo', 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop', 'Detergent', 9),
('Soko', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', 'Maize Meal', 10),
('Fresh Fri', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', 'Cooking Oil', 11),
('Safaricom', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Safaricom_Logo.svg/2560px-Safaricom_Logo.svg.png', 'Airtime', 12)
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
SELECT * FROM public.brands ORDER BY order_index;
```

**Run this query** ✅

---

## Step 2: Create a Brand Service

Create a new file: `src/services/SupabaseBrandService.ts`

```typescript
import { supabase } from "@/lib/supabase";

export interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  order_index?: number;
  enabled?: boolean;
}

export class SupabaseBrandService {
  static async getBrands(): Promise<Brand[]> {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, image, category, order_index, enabled")
        .eq("enabled", true)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("❌ Error fetching brands:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("❌ Exception fetching brands:", error);
      return [];
    }
  }

  static async updateBrand(
    id: string,
    updates: Partial<Brand>
  ): Promise<Brand | null> {
    try {
      const { data, error } = await supabase
        .from("brands")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating brand:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ Exception updating brand:", error);
      return null;
    }
  }

  static async addBrand(brand: Omit<Brand, "id">): Promise<Brand | null> {
    try {
      const { data, error } = await supabase
        .from("brands")
        .insert([brand])
        .select()
        .single();

      if (error) {
        console.error("❌ Error adding brand:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ Exception adding brand:", error);
      return null;
    }
  }

  static async deleteBrand(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("brands").delete().eq("id", id);

      if (error) {
        console.error("❌ Error deleting brand:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Exception deleting brand:", error);
      return false;
    }
  }
}
```

---

## Step 3: Update AdminContext to Load Brands from Supabase

Update `src/contexts/AdminContext.tsx`:

Find this section (around line 78):

```typescript
  brands: [
    { id: '1', name: 'Brookside', image: '...', category: 'Dairy' },
    // ... rest of brands
  ],
```

Replace the brands array with an empty array:

```typescript
  brands: [], // Will be loaded from Supabase
```

Then, find the `useEffect` that syncs settings and add this:

```typescript
// Add this useEffect to load brands from Supabase
useEffect(() => {
  const loadBrandsFromSupabase = async () => {
    try {
      const { SupabaseBrandService } = await import('@/services/SupabaseBrandService');
      const brands = await SupabaseBrandService.getBrands();
      
      if (brands.length > 0) {
        console.log('✅ Loaded', brands.length, 'brands from Supabase');
        setSettings(prev => ({ ...prev, brands }));
      } else {
        console.log('ℹ️ No brands in Supabase, using defaults');
      }
    } catch (error) {
      console.error('Failed to load brands from Supabase:', error);
      // Fall back to default brands
    }
  };

  loadBrandsFromSupabase();
}, []); // Run once on mount
```

---

## Step 4: Create Admin Panel for Brands (Optional but Recommended)

Create `src/components/AdminBrandManager.tsx`:

```typescript
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SupabaseBrandService, Brand } from "@/services/SupabaseBrandService";
import { Trash2, Edit2, Plus } from "lucide-react";

export function AdminBrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBrand, setNewBrand] = useState({
    name: "",
    image: "",
    category: "",
    order_index: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    const loaded = await SupabaseBrandService.getBrands();
    setBrands(loaded);
    setLoading(false);
  };

  const handleAddBrand = async () => {
    if (!newBrand.name || !newBrand.image) {
      toast({
        title: "Error",
        description: "Name and image are required",
        variant: "destructive",
      });
      return;
    }

    const result = await SupabaseBrandService.addBrand({
      ...newBrand,
      enabled: true,
    });

    if (result) {
      toast({ title: "Success", description: "Brand added!" });
      setNewBrand({ name: "", image: "", category: "", order_index: 0 });
      loadBrands();
    } else {
      toast({
        title: "Error",
        description: "Failed to add brand",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBrand = async (id: string) => {
    const success = await SupabaseBrandService.deleteBrand(id);
    if (success) {
      toast({ title: "Success", description: "Brand deleted!" });
      loadBrands();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading brands...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Brands</h2>

      {/* Add New Brand */}
      <div className="border p-4 rounded-lg space-y-3">
        <h3 className="font-bold">Add New Brand</h3>
        <div className="grid gap-3">
          <Input
            placeholder="Brand Name"
            value={newBrand.name}
            onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
          />
          <Input
            placeholder="Image URL"
            value={newBrand.image}
            onChange={(e) =>
              setNewBrand({ ...newBrand, image: e.target.value })
            }
          />
          <Input
            placeholder="Category"
            value={newBrand.category}
            onChange={(e) =>
              setNewBrand({ ...newBrand, category: e.target.value })
            }
          />
          <Button onClick={handleAddBrand} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Brands List */}
      <div className="space-y-2">
        <h3 className="font-bold">{brands.length} Brands</h3>
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="flex items-center justify-between border p-3 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              <img
                src={brand.image}
                alt={brand.name}
                className="w-12 h-12 object-contain rounded"
              />
              <div>
                <p className="font-bold">{brand.name}</p>
                <p className="text-sm text-gray-600">{brand.category}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingId(brand.id)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteBrand(brand.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Step 5: Test Before Pushing

1. **Clear localStorage** and reload your app
2. **Check browser console** - you should see: `✅ Loaded X brands from Supabase`
3. **Verify brands appear** on homepage in "Shop by Brand" section
4. **Test in admin panel** - should still display brands

---

## Step 6: Deploy with Confidence

Now you can:

```bash
# Make your code changes
git add .
git commit -m "feat: Move brands to Supabase for better production safety"
git push origin main
```

✅ **Your production brands are now protected!**

---

## Rollback Plan

If something goes wrong:

```sql
-- Verify brands are still in DB
SELECT COUNT(*) FROM public.brands WHERE enabled = true;

-- If you need to restore, this table is your backup
SELECT * FROM public.brands;
```

---

## Next Steps

- [ ] Run SQL query to create brands table
- [ ] Create `SupabaseBrandService.ts`
- [ ] Update `AdminContext.tsx` to load from Supabase
- [ ] Test locally
- [ ] (Optional) Create `AdminBrandManager.tsx` for brand management UI
- [ ] Deploy to production
- [ ] Add brand management to admin dashboard

✅ Once complete, your production brands are completely safe!
