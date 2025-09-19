# 📦 QuickMart Bulk Upload Guide

## 🎯 **Overview**
The QuickMart dashboard now includes bulk upload functionality, allowing you to add multiple products at once using a CSV file.

## 📁 **CSV Format Requirements**

### **Required Columns:**
- `name` - Product name (required)
- `price` - Current selling price in KES (required)
- `category` - Must be "quickmart" for QuickMart products (required)
- `image` - Product image URL or path (required)

### **Optional Columns:**
- `originalPrice` - Original price (for showing discounts)
- `description` - Product description
- `items` - Tags/keywords (comma-separated)

### **Example CSV:**
```csv
name,price,originalPrice,category,description,items,image
Coca Cola 500ml,80,100,quickmart,"Refreshing Coca Cola drink","Cold Drink, Soda","/assets/products/coca-cola.jpg"
Bread White,90,110,quickmart,"Fresh white bread loaf","Bakery, Fresh","/assets/products/bread-white.jpg"
Milk 1L,120,140,quickmart,"Fresh whole milk","Dairy, Fresh","/assets/products/milk-1l.jpg"
```

## 🚀 **How to Use Bulk Upload**

### **Step 1: Prepare Your CSV**
1. Download the sample: `quickmart-products-sample.csv`
2. Edit the file with your product data
3. Ensure all required fields are filled
4. Save as CSV format

### **Step 2: Upload in Dashboard**
1. Go to **QuickMart Dashboard**
2. Click **"Bulk Upload"** button
3. Select your CSV file
4. Preview and validate data
5. Click **"Upload Products"**

### **Step 3: Review Results**
- ✅ **Success count** - Products added successfully
- ❌ **Failed count** - Products with errors
- 📋 **Error details** - Specific issues to fix

## ⚠️ **Validation Rules**

### **Product Name:**
- Must not be empty
- Should be descriptive and unique

### **Price:**
- Must be greater than 0
- Enter amount in KES (no currency symbol)
- Example: `120` for KES 120

### **Category:**
- Must be exactly `quickmart` (lowercase)
- Case sensitive

### **Image:**
- Must be a valid URL or file path
- Examples:
  - `/assets/products/image.jpg`
  - `https://example.com/image.jpg`

### **Original Price (Optional):**
- If provided, must be greater than current price
- Used to show discount percentage

## 📝 **Tips for Success**

### **Data Preparation:**
- **Use proper encoding** - Save CSV as UTF-8
- **Check for duplicates** - Avoid duplicate product names
- **Validate images** - Ensure image URLs are accessible
- **Test small batches** - Start with 10-20 products

### **Common Mistakes:**
- ❌ Empty required fields
- ❌ Invalid price formats (using text like "KES 100")
- ❌ Wrong category name (not "quickmart")
- ❌ Broken image URLs
- ❌ Original price lower than current price

### **Best Practices:**
- ✅ **Consistent naming** - Use clear, descriptive names
- ✅ **Competitive pricing** - Research market prices
- ✅ **Quality images** - Use high-resolution product photos
- ✅ **Relevant tags** - Add searchable keywords in items field
- ✅ **Backup data** - Keep a copy of your CSV file

## 🛠️ **Troubleshooting**

### **Upload Failed:**
1. Check file format (must be .csv)
2. Verify required columns exist
3. Ensure no empty required fields
4. Check for special characters in product names

### **Some Products Failed:**
1. Review error details in upload results
2. Fix issues in CSV file
3. Re-upload only failed products

### **Images Not Showing:**
1. Verify image URLs are accessible
2. Check image file extensions (.jpg, .png, .webp)
3. Ensure images are publicly accessible

## 📊 **Sample Template**

Download and use: **`quickmart-products-sample.csv`**

This template includes:
- 10 sample QuickMart products
- All required and optional fields
- Proper formatting examples
- Various product categories (drinks, bakery, dairy, etc.)

---

## 🎯 **Quick Start:**
1. Download `quickmart-products-sample.csv`
2. Edit with your products
3. Click **Bulk Upload** in dashboard
4. Upload and review results
5. Start selling! 🚀