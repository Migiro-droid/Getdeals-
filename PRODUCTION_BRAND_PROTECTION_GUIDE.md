# 🛡️ Production Brand Protection Guide

**Problem**: When you push code changes, the hardcoded brands in `AdminContext.tsx` may overwrite your production brand images and configurations.

**Solution**: Use a 3-tier approach to protect production data while allowing code deployment.

---

## ✅ Option 1: Load Brands from Supabase (RECOMMENDED - Best Practice)

This is the most robust solution. Brands become database-driven, not code-driven.

### Step 1: Create Brands Table in Supabase

Run this SQL in Supabase SQL Editor:

```sql
-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert your current production brands
INSERT INTO brands (name, image, category, order_index) VALUES
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

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see brands)
CREATE POLICY "Brands are viewable by everyone" ON brands
  FOR SELECT USING (enabled = true);

-- Admin only can modify brands
CREATE POLICY "Only admins can modify brands" ON brands
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM admin_users WHERE role = 'admin'
  ));
```

### Step 2: Update AdminContext to Load from Supabase

After creating the table, update the `AdminContext.tsx` to:
1. Load brands from Supabase on initialization
2. Keep hardcoded brands as fallback only
3. Cache brands locally to prevent constant queries

**Benefit**: ✅ You can now push code without touching production brands
**Benefit**: ✅ Admins can update brands via admin panel
**Benefit**: ✅ Zero downtime deployments

---

## ⚡ Option 2: Use Git Branches (Good for Now)

Until you move to Option 1, protect your production brands using git branches:

### Before Pushing to Production

1. **Check which files changed**:
   ```bash
   git diff --name-only origin/main
   ```

2. **If AdminContext.tsx is NOT in the changes**, safe to push:
   ```bash
   git push origin main
   ```

3. **If AdminContext.tsx IS in the changes**:
   - Review if brand array actually changed
   - If only other code changed, you can selectively push:
     ```bash
     git checkout origin/main -- src/contexts/AdminContext.tsx
     git add src/contexts/AdminContext.tsx
     git commit -m "revert: keep production brands from main"
     git push origin main
     ```

### Or Use a `.prodignore` File

Create a file to track which files should not overwrite production:

```bash
# .prodignore (local, don't commit)
src/contexts/AdminContext.tsx
src/config/producti brands.ts
```

---

## 🔒 Option 3: Environment-Based Defaults (Medium Term)

Use environment variables to set different defaults for production vs development:

```tsx
// AdminContext.tsx
const getBrandsDefault = () => {
  // If in production and no Supabase data, use minimal fallback
  if (import.meta.env.PROD && !import.meta.env.VITE_DEV_BRANDS) {
    return []; // Load from Supabase only
  }
  
  // Development uses hardcoded defaults
  return [
    // ... your hardcoded brands
  ];
};
```

**Env file for production**:
```
VITE_DEV_BRANDS=false
VITE_LOAD_BRANDS_FROM_DB=true
```

**Env file for development**:
```
VITE_DEV_BRANDS=true
VITE_LOAD_BRANDS_FROM_DB=false
```

---

## 📋 Immediate Action Plan (Before Next Push)

### Step 1: Backup Your Production Brands

Export current brands from admin panel or take a screenshot:

```
Current Production Brands:
1. Brookside - [image URL]
2. Tusker - [image URL]
3. Kenya Cane - [image URL]
... etc
```

### Step 2: Check What You're Pushing

Before each push:
```bash
# See if AdminContext changed
git diff src/contexts/AdminContext.tsx

# If brands array changed, decide:
# - Option A: Keep production version (revert AdminContext)
# - Option B: Update admin panel with new brands manually
```

### Step 3: Document Your Choices

Add to your `.gitignore`:
```
# Protect production configuration
src/contexts/AdminContext.tsx.prod
.env.production.local
```

---

## 🚀 Recommended Next Steps (This Week)

| Priority | Task | Time | Benefit |
|----------|------|------|---------|
| 🔴 HIGH | Create brands table in Supabase | 30 min | Protect all future brand updates |
| 🟡 MED | Update AdminContext to load from DB | 2 hours | Zero-risk deployments |
| 🟡 MED | Create admin UI for brand management | 1 hour | Non-technical staff can edit brands |
| 🟢 LOW | Remove hardcoded brands from code | 15 min | Cleanup |

---

## 💡 Why This Matters

**Current State** (Risky):
```
Code Push → Overwrite Brands → Lose Production Config → Manual Fix Needed
```

**After Option 1** (Safe):
```
Code Push → Brands Untouched → Automatic Sync from DB → Zero Issues
```

---

## ✅ Once Option 1 is Complete, You Can:

- ✅ Push code changes freely without worrying about brands
- ✅ Update brands via admin panel in production
- ✅ Have A/B test different brand sets
- ✅ Schedule brand updates to go live at specific times
- ✅ Rollback brand changes independently from code

---

## 🔍 For Right Now (Today)

### Safe to Push?

Check this before pushing:

```bash
# Only check AdminContext changes
git diff src/contexts/AdminContext.tsx | grep -A5 "^+.*brands:"

# If no changes to brands array, you're safe
git push origin main

# If brands array DID change, use Option 2 to revert:
git checkout origin/main -- src/contexts/AdminContext.tsx
git add src/contexts/AdminContext.tsx
git commit -m "Keep production brands configuration"
git push origin main
```

---

## Questions?

- **Q**: Will this break my current site?  
**A**: No, it's an enhancement. Your current hardcoded brands work fine until you migrate.

- **Q**: Can I do this gradually?  
**A**: Yes! Migrate one brand at a time if needed.

- **Q**: What if Supabase goes down?  
**A**: The app falls back to hardcoded defaults instantly.

---

## Summary

**For immediate protection**: Use Option 2 (git management)  
**For long-term solution**: Implement Option 1 (Supabase brands table)  
**For enterprise**: Combine with Option 3 (environment-based configs)

**Next push**: Check your diffs before committing! 🚀
