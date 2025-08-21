export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  items?: string[];
  itemsDetail?: { name: string; image: string }[];
  category: string;
  description?: string;
}

export const products: Product[] = [
  // Essential Baskets
  {
    id: "essential-basket",
    name: "Essential Basket",
    price: 3000,
    originalPrice: 3500,
    image: "/essential-basket.jpg",
    items: [
      "2kg Rice",
      "1kg Sugar", 
      "500ml Cooking Oil",
      "1 Bread Loaf",
      "1kg Wheat Flour"
    ],
    category: "essential",
    description: "Perfect for small families with daily essentials"
  },
  {
    id: "mini-essential",
    name: "Mini Essential Basket",
    price: 1800,
    originalPrice: 2200,
    image: "https://tse1.mm.bing.net/th/id/OIP.JxE6LFyxhq7mmJIFfVMD_wHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    items: [
      "1kg Rice",
      "500g Sugar", 
      "250ml Cooking Oil",
      "1 Bread Loaf"
    ],
    category: "essential",
    description: "Compact essentials for singles or couples"
  },
  {
    id: "mega-essential",
    name: "Mega Essential Basket",
    price: 4500,
    originalPrice: 5500,
    image: "https://img.freepik.com/premium-photo/photo-grocery-shopping-cart-full-food-items-isolated-white-background_763111-73290.jpg",
    items: [
      "5kg Rice",
      "2kg Sugar", 
      "1L Cooking Oil",
      "2 Bread Loaves",
      "2kg Wheat Flour",
      "1kg Beans"
    ],
    category: "essential",
    description: "Extended essentials for larger households"
  },

  // Family Baskets
  {
    id: "family-basket",
    name: "Family Basket", 
    price: 5000,
    originalPrice: 6200,
    image: "/family-basket.jpg",
    items: [
      "5kg Rice",
      "2kg Sugar",
      "1L Cooking Oil", 
      "2 Bread Loaves",
      "2kg Wheat Flour"
    ],
    category: "family",
    description: "Complete family shopping solution"
  },
  {
    id: "premium-basket",
    name: "Premium Family Basket",
    price: 10000,
    originalPrice: 12500,
    image: "/family-basket.jpg",
    items: [
      "10kg Rice (Premium)",
      "5kg Sugar",
      "2L Premium Cooking Oil",
      "4 Bread Loaves", 
      "5kg Wheat Flour"
    ],
    category: "family",
    description: "Premium products for discerning families"
  },
  {
    id: "luxury-basket",
    name: "Luxury Family Basket",
    price: 15000,
    originalPrice: 19500,
    image: "/family-basket.jpg",
    items: [
      "15kg Premium Rice",
      "10kg Sugar",
      "3L Premium Oil",
      "6 Premium Bread",
      "10kg Wheat Flour"
    ],
    category: "family", 
    description: "Ultimate luxury shopping experience"
  },

  // Our additional curated baskets
  {
    id: "back-to-school-basket",
    name: "Back to School Basket",
    price: 4200,
    originalPrice: 5000,
    image: "/essential-basket.jpg",
    items: [
      "3kg Rice",
      "1kg Sugar",
      "1L Cooking Oil",
      "2 Bread Loaves",
      "2kg Wheat Flour"
    ],
    category: "basket",
    description: "Perfect starter pack for school season"
  },
  {
    id: "holiday-feast-basket",
    name: "Holiday Feast Basket",
    price: 8500,
    originalPrice: 10200,
    image: "/family-basket.jpg",
    items: [
      "10kg Rice",
      "3kg Sugar",
      "2L Cooking Oil",
      "3 Bread Loaves",
      "4kg Wheat Flour"
    ],
    category: "basket",
    description: "Celebrate holidays with a generous family bundle"
  },
  {
    id: "essentials-plus-basket",
    name: "Essentials Plus Basket",
    price: 3800,
    originalPrice: 4400,
    image: "/essential-basket.jpg",
    items: [
      "3kg Rice",
      "1kg Sugar",
      "1L Cooking Oil",
      "1 Bread Loaf",
      "2kg Wheat Flour"
    ],
    category: "basket",
    description: "More of the essentials you use every day"
  },
  {
    id: "essentials-max-basket",
    name: "Essentials Max Basket",
    price: 6200,
    originalPrice: 7400,
    image: "/essential-basket.jpg",
    items: [
      "5kg Rice",
      "2kg Sugar",
      "2L Cooking Oil",
      "2 Bread Loaves",
      "4kg Wheat Flour"
    ],
    category: "basket",
    description: "Bulk buy essentials for bigger savings"
  },

  // Alcohol deals (placeholder images)
  {
    id: "beer-pack",
    name: "Beer Pack (6x500ml)",
    price: 1200,
    originalPrice: 1500,
    image: "/placeholder.svg",
    category: "alcohol",
    description: "Great value 6-pack beer deal"
  },
  {
    id: "red-wine",
    name: "Red Wine 750ml",
    price: 1500,
    originalPrice: 1950,
    image: "https://www.istockphoto.com/photos/wine-bottle",
    category: "alcohol",
    description: "Bold and smooth red wine"
  },
  {
    id: "whisky",
    name: "Whisky 700ml",
    price: 2800,
    originalPrice: 3500,
    image: "/placeholder.svg",
    category: "alcohol",
    description: "Premium whisky at a discount"
  },

  // Holiday Baskets (remote additions)
  {
    id: "christmas-basket",
    name: "Christmas Special Basket",
    price: 8500,
    originalPrice: 10500,
    image: "/family-basket.jpg",
    items: [
      "5kg Premium Rice",
      "2kg Sugar",
      "1L Cooking Oil",
      "Christmas Cake Mix",
      "Festive Spices Set",
      "Holiday Treats"
    ],
    category: "holiday",
    description: "Perfect for Christmas celebrations"
  },
  {
    id: "easter-basket",
    name: "Easter Family Basket",
    price: 6500,
    originalPrice: 8000,
    image: "/family-basket.jpg",
    items: [
      "3kg Rice",
      "1kg Sugar",
      "500ml Oil",
      "Easter Bread",
      "Chocolate Treats",
      "Fresh Fruits"
    ],
    category: "holiday",
    description: "Celebrate Easter with the family"
  },

  // Back to School Baskets (remote additions)
  {
    id: "school-lunch-basket",
    name: "School Lunch Basket",
    price: 4200,
    originalPrice: 5200,
    image: "/essential-basket.jpg",
    items: [
      "2kg Rice",
      "1kg Sugar",
      "Lunch Snacks Pack",
      "Juice Boxes (12)",
      "Sandwich Bread",
      "Peanut Butter"
    ],
    category: "school",
    description: "Everything for healthy school lunches"
  },
  {
    id: "student-essential",
    name: "Student Essential Basket",
    price: 3500,
    originalPrice: 4500,
    image: "/essential-basket.jpg",
    items: [
      "2kg Rice",
      "1kg Sugar",
      "Instant Noodles (12)",
      "Cooking Oil",
      "Tea & Coffee",
      "Quick Meals Pack"
    ],
    category: "school",
    description: "Perfect for university students"
  },

  // Alcohol Deals (remote additions)
  {
    id: "weekend-spirits",
    name: "Weekend Spirits Pack",
    price: 12000,
    originalPrice: 15000,
    image: "/family-basket.jpg",
    items: [
      "Premium Whiskey (750ml)",
      "Red Wine (750ml)",
      "Beer Pack (12 bottles)",
      "Mixers Set",
      "Bar Snacks"
    ],
    category: "alcohol",
    description: "Perfect for weekend entertainment"
  },
  {
    id: "wine-collection",
    name: "Wine Collection Pack",
    price: 8500,
    originalPrice: 11000,
    image: "/family-basket.jpg",
    items: [
      "Red Wine (750ml)",
      "White Wine (750ml)",
      "Rosé Wine (750ml)",
      "Wine Glasses Set",
      "Cheese Platter"
    ],
    category: "alcohol",
    description: "Curated wine selection for connoisseurs"
  },

  // Black Friday Deals (remote additions)
  {
    id: "black-friday-mega",
    name: "Black Friday Mega Deal",
    price: 7500,
    originalPrice: 12000,
    image: "/family-basket.jpg",
    items: [
      "10kg Rice",
      "5kg Sugar",
      "2L Cooking Oil",
      "4 Bread Loaves",
      "3kg Wheat Flour",
      "Electronics Item"
    ],
    category: "blackfriday",
    description: "Unbeatable Black Friday savings!"
  },
  {
    id: "black-friday-family",
    name: "Black Friday Family Pack",
    price: 4500,
    originalPrice: 8000,
    image: "/family-basket.jpg",
    items: [
      "5kg Rice",
      "2kg Sugar",
      "1L Oil",
      "Home Appliance",
      "Snacks Pack",
      "Beverages"
    ],
    category: "blackfriday",
    description: "Amazing family deals for Black Friday"
  },
  {
    id: "black-friday-electronics-bundle",
    name: "Black Friday Electronics Bundle",
    price: 12500,
    originalPrice: 18000,
    image: "https://tse2.mm.bing.net/th/id/OIP.sPdyL3lk4NrLYJ28kf3v0wHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    items: [
      "Smartphone Accessories",
      "Bluetooth Speaker",
      "Power Bank",
      "Charging Cables",
      "Phone Case",
      "Screen Protector"
    ],
    category: "blackfriday",
    description: "Tech deals you can't miss!"
  },
  {
    id: "black-friday-kitchen",
    name: "Black Friday Kitchen Essentials",
    price: 6800,
    originalPrice: 10500,
    image: "https://www.everydaycheapskate.com/wp-content/uploads/small-appliances-collage-2-1.jpg",
    items: [
      "Non-stick Pan Set",
      "Kitchen Utensils",
      "Storage Containers",
      "Cutting Board",
      "Kitchen Towels",
      "Spice Rack"
    ],
    category: "blackfriday",
    description: "Upgrade your kitchen for less"
  },
  {
    id: "black-friday-beauty",
    name: "Black Friday Beauty Box",
    price: 3200,
    originalPrice: 5500,
    image: "https://th.bing.com/th/id/R.4d9f12b9a16f6bf981e499aa17519b03?rik=yHMWSva16e6OsA&pid=ImgRaw&r=0",
    items: [
      "Skincare Set",
      "Makeup Kit",
      "Hair Care Products",
      "Perfume Sample",
      "Beauty Tools",
      "Face Masks"
    ],
    category: "blackfriday",
    description: "Pamper yourself with amazing savings"
  },
  {
    id: "black-friday-snacks",
    name: "Black Friday Snack Attack",
    price: 1800,
    originalPrice: 2800,
    image: "https://tse3.mm.bing.net/th/id/OIP.oACVYxJVq7Qa-U40ZeNPDwHaGD?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    items: [
      "Assorted Chocolates",
      "Premium Nuts",
      "Crispy Chips",
      "Energy Bars",
      "Cookies Pack",
      "Dried Fruits"
    ],
    category: "blackfriday",
    description: "Snack your way through the savings"
  },
  {
    id: "black-friday-fitness",
    name: "Black Friday Fitness Bundle",
    price: 4200,
    originalPrice: 7000,
    image: "https://tse2.mm.bing.net/th/id/OIP.zzXRmtNKAN_hrMcOu-YGjgHaHf?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    items: [
      "Yoga Mat",
      "Resistance Bands",
      "Water Bottle",
      "Fitness Tracker",
      "Workout Towel",
      "Protein Bars"
    ],
    category: "blackfriday",
    description: "Get fit for less this Black Friday"
  },
  {
    id: "black-friday-baby",
    name: "Black Friday Baby Care",
    price: 3800,
    originalPrice: 6200,
    image: "https://i.etsystatic.com/30981954/c/2535/2015/0/379/il/2fcc58/4032943702/il_340x270.4032943702_dhu5.jpg",
    items: [
      "Baby Diapers",
      "Baby Wipes",
      "Baby Food",
      "Toys Set",
      "Baby Lotion",
      "Feeding Bottles"
    ],
    category: "blackfriday",
    description: "Everything your baby needs at amazing prices"
  },
  {
    id: "black-friday-office",
    name: "Black Friday Office Supplies",
    price: 2500,
    originalPrice: 4000,
    image: "https://acorn-paper.com/cdn/shop/collections/c179348f89aedd2960180f110dbd2add_52bd053b-b19f-4738-b575-7666cf000ade_1200x1200.jpg?v=1681355768",
    items: [
      "Notebooks",
      "Pens & Pencils",
      "Desk Organizer",
      "Sticky Notes",
      "File Folders",
      "Calculator"
    ],
    category: "blackfriday",
    description: "Organize your workspace for less"
  },
  {
    id: "black-friday-gaming",
    name: "Black Friday Gaming Pack",
    price: 8500,
    originalPrice: 12000,
    image: "https://cdn.shopify.com/s/files/1/1284/8883/products/Gamesbundle_Main_1024x1024.png?v=1577982299",
    items: [
      "Gaming Headset",
      "Gaming Mouse",
      "Keyboard",
      "Mouse Pad",
      "Game Credits",
      "Gaming Chair Cushion"
    ],
    category: "blackfriday",
    description: "Level up your gaming setup"
  },
  {
    id: "black-friday-home",
    name: "Black Friday Home Decor",
    price: 5200,
    originalPrice: 8500,
    image: "/placeholder.svg",
    items: [
      "Decorative Pillows",
      "Wall Art",
      "Scented Candles",
      "Picture Frames",
      "Table Runner",
      "Plant Pots"
    ],
    category: "blackfriday",
    description: "Transform your home with style"
  },
  {
    id: "black-friday-electronics",
    name: "Black Friday Electronics Bundle",
    price: 15000,
    originalPrice: 25000,
    image: "https://www.istockphoto.com/photos/electronics-store-sales",
    items: [
      "Smartphone Accessories",
      "Bluetooth Speaker",
      "Power Bank 10000mAh",
      "USB Cables Set",
      "Phone Stand",
      "Screen Protector"
    ],
    category: "blackfriday",
    description: "Massive 40% off electronics bundle - Limited stock!"
  },
  {
    id: "black-friday-home-essentials",
    name: "Black Friday Home Essentials",
    price: 3200,
    originalPrice: 5500,
    image: "/placeholder.svg",
    items: [
      "Bedsheets Set",
      "Towels Pack (4pc)",
      "Kitchen Utensils",
      "Storage Containers",
      "Cleaning Supplies",
      "Air Fresheners"
    ],
    category: "blackfriday",
    description: "Transform your home with 42% savings!"
  },
  {
    id: "black-friday-beauty-health",
    name: "Black Friday Beauty & Health Pack",
    price: 2800,
    originalPrice: 4200,
    image: "/placeholder.svg",
    items: [
      "Skincare Set",
      "Hair Care Products",
      "Body Lotion",
      "Face Masks (5pc)",
      "Vitamin Supplements",
      "Dental Care Kit"
    ],
    category: "blackfriday",
    description: "Premium beauty & health at 33% off!"
  },
  {
    id: "black-friday-snacks-party",
    name: "Black Friday Party & Snacks Bundle",
    price: 3500,
    originalPrice: 6000,
    image: "/placeholder.svg",
    items: [
      "Assorted Chips (10 packs)",
      "Cookies & Biscuits",
      "Soft Drinks (12 cans)",
      "Nuts & Dried Fruits",
      "Chocolate Bars",
      "Party Decorations"
    ],
    category: "blackfriday",
    description: "Perfect for celebrations - 42% off!"
  },
  {
    id: "black-friday-baby-care",
    name: "Black Friday Baby Care Pack",
    price: 4200,
    originalPrice: 7000,
    image: "/placeholder.svg",
    items: [
      "Baby Diapers (Large Pack)",
      "Baby Food Jars (12pc)",
      "Baby Wipes (6 packs)",
      "Baby Lotion & Powder",
      "Feeding Bottles",
      "Baby Clothes Set"
    ],
    category: "blackfriday",
    description: "Everything for baby at 40% savings!"
  },
  {
    id: "black-friday-fitness-sports",
    name: "Black Friday Fitness & Sports Kit",
    price: 5500,
    originalPrice: 9500,
    image: "/placeholder.svg",
    items: [
      "Yoga Mat",
      "Resistance Bands Set",
      "Water Bottle (2L)",
      "Workout Towel",
      "Protein Powder",
      "Sports Gloves"
    ],
    category: "blackfriday",
    description: "Get fit for less - 42% discount!"
  },
  {
    id: "black-friday-kitchen-pro",
    name: "Black Friday Kitchen Pro Bundle",
    price: 6800,
    originalPrice: 12000,
    image: "/placeholder.svg",
    items: [
      "Non-stick Cookware Set",
      "Kitchen Knives (5pc)",
      "Cutting Boards",
      "Measuring Cups",
      "Spice Rack with Spices",
      "Kitchen Timer"
    ],
    category: "blackfriday",
    description: "Professional kitchen setup - 43% off!"
  },

  // Fresh Produce & Healthy Options
  {
    id: "fresh-fruit-basket",
    name: "Fresh Fruit Basket",
    price: 2200,
    originalPrice: 2800,
    image: "/placeholder.svg",
    items: [
      "2kg Bananas",
      "1kg Oranges",
      "500g Grapes",
      "3 Avocados",
      "1kg Apples",
      "Fresh Pineapple"
    ],
    category: "fresh",
    description: "Farm-fresh fruits delivered to your door"
  },
  {
    id: "vegetable-bundle",
    name: "Weekly Vegetable Bundle",
    price: 1800,
    originalPrice: 2400,
    image: "/placeholder.svg",
    items: [
      "2kg Potatoes",
      "1kg Onions",
      "500g Carrots",
      "1 Cabbage",
      "500g Tomatoes",
      "Green Peppers"
    ],
    category: "fresh",
    description: "Fresh vegetables for healthy cooking"
  },
  {
    id: "organic-essentials",
    name: "Organic Essentials Pack",
    price: 3200,
    originalPrice: 4000,
    image: "/essential-basket.jpg",
    items: [
      "2kg Organic Rice",
      "1kg Organic Sugar",
      "500ml Organic Oil",
      "Organic Honey",
      "Organic Tea",
      "Natural Spices"
    ],
    category: "organic",
    description: "Premium organic products for healthy living"
  },

  // Household & Cleaning Supplies
  {
    id: "cleaning-essentials",
    name: "Household Cleaning Pack",
    price: 2500,
    originalPrice: 3200,
    image: "/placeholder.svg",
    items: [
      "Laundry Detergent (2kg)",
      "Dishwashing Liquid",
      "Toilet Cleaner",
      "Floor Cleaner",
      "All-Purpose Cleaner",
      "Cleaning Cloths"
    ],
    category: "household",
    description: "Complete cleaning solution for your home"
  },
  {
    id: "personal-care-bundle",
    name: "Personal Care Bundle",
    price: 1900,
    originalPrice: 2600,
    image: "/placeholder.svg",
    items: [
      "Body Soap (4 bars)",
      "Shampoo (500ml)",
      "Toothpaste (2 tubes)",
      "Toilet Paper (12 rolls)",
      "Hand Sanitizer",
      "Body Lotion"
    ],
    category: "personal-care",
    description: "Essential personal care items"
  },

  // Baby & Kids Products
  {
    id: "baby-care-starter",
    name: "Baby Care Starter Pack",
    price: 4500,
    originalPrice: 6000,
    image: "/placeholder.svg",
    items: [
      "Baby Diapers (Medium)",
      "Baby Wipes (5 packs)",
      "Baby Soap",
      "Baby Lotion",
      "Baby Food (6 jars)",
      "Feeding Bottles (2)"
    ],
    category: "baby",
    description: "Everything new parents need"
  },
  {
    id: "kids-snack-pack",
    name: "Kids Healthy Snack Pack",
    price: 1600,
    originalPrice: 2200,
    image: "/placeholder.svg",
    items: [
      "Fruit Juice Boxes (12)",
      "Crackers (6 packs)",
      "Granola Bars (12)",
      "Dried Fruits Mix",
      "Yogurt Cups (8)",
      "Cheese Sticks (10)"
    ],
    category: "kids",
    description: "Nutritious snacks kids love"
  },

  // Office & Work From Home
  {
    id: "office-snack-bundle",
    name: "Office Snack Bundle",
    price: 2100,
    originalPrice: 2800,
    image: "/placeholder.svg",
    items: [
      "Coffee Packets (20)",
      "Tea Bags (50)",
      "Biscuits (6 packs)",
      "Nuts Mix",
      "Energy Bars (12)",
      "Instant Soup (10)"
    ],
    category: "office",
    description: "Keep your energy up during work hours"
  },

  // Seasonal & Special Occasion
  {
    id: "valentine-romantic-dinner",
    name: "Valentine's Romantic Dinner Kit",
    price: 3800,
    originalPrice: 5000,
    image: "/family-basket.jpg",
    items: [
      "Premium Pasta (2 packs)",
      "Pasta Sauce",
      "Red Wine (750ml)",
      "Chocolate Box",
      "Candles (6)",
      "Fresh Herbs"
    ],
    category: "valentine",
    description: "Create the perfect romantic evening"
  },
  {
    id: "new-year-celebration",
    name: "New Year Celebration Pack",
    price: 6500,
    originalPrice: 8500,
    image: "/family-basket.jpg",
    items: [
      "Champagne (750ml)",
      "Party Snacks Mix",
      "Sparkling Juice",
      "Decorations Set",
      "Cake Mix",
      "Party Favors"
    ],
    category: "celebration",
    description: "Ring in the new year in style"
  },

  // Budget-Friendly Options
  {
    id: "student-budget-pack",
    name: "Student Budget Pack",
    price: 1200,
    originalPrice: 1800,
    image: "/essential-basket.jpg",
    items: [
      "1kg Rice",
      "Instant Noodles (10)",
      "Cooking Oil (250ml)",
      "Tea Bags (25)",
      "Sugar (500g)",
      "Bread (2 loaves)"
    ],
    category: "budget",
    description: "Affordable essentials for students"
  },
  {
    id: "single-person-starter",
    name: "Single Person Starter Kit",
    price: 1500,
    originalPrice: 2100,
    image: "/essential-basket.jpg",
    items: [
      "1kg Rice",
      "500g Sugar",
      "Cooking Oil (500ml)",
      "Salt & Basic Spices",
      "Instant Meals (5)",
      "Coffee/Tea Starter"
    ],
    category: "single",
    description: "Perfect for living alone"
  }];

export const featuredProducts = products.slice(0, 3);
export const basketProducts = products.filter(p => p.category === "basket");
export const essentialProducts = products.filter(p => p.category === "essential");
export const familyProducts = products.filter(p => p.category === "family");
export const holidayProducts = products.filter(p => p.category === "holiday");
export const schoolProducts = products.filter(p => p.category === "school");
export const alcoholProducts = products.filter(p => p.category === "alcohol");
export const blackFridayProducts = products.filter(p => p.category === "blackfriday");
export const freshProducts = products.filter(p => p.category === "fresh");
export const organicProducts = products.filter(p => p.category === "organic");
export const householdProducts = products.filter(p => p.category === "household");
export const personalCareProducts = products.filter(p => p.category === "personal-care");
export const babyProducts = products.filter(p => p.category === "baby");
export const kidsProducts = products.filter(p => p.category === "kids");
export const officeProducts = products.filter(p => p.category === "office");
export const valentineProducts = products.filter(p => p.category === "valentine");
export const celebrationProducts = products.filter(p => p.category === "celebration");
export const budgetProducts = products.filter(p => p.category === "budget");
export const singleProducts = products.filter(p => p.category === "single");
export const discountedProducts = products.filter(p => p.originalPrice && p.originalPrice > p.price);
