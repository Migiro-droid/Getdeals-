export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  items?: string[];
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "/placeholder.svg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/essential-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
    image: "src/assets/family-basket.jpg",
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
  }
];

export const featuredProducts = products.slice(0, 3);
export const basketProducts = products.filter(p => p.category === "basket");
export const essentialProducts = products.filter(p => p.category === "essential");
export const familyProducts = products.filter(p => p.category === "family");
export const holidayProducts = products.filter(p => p.category === "holiday");
export const schoolProducts = products.filter(p => p.category === "school");
export const alcoholProducts = products.filter(p => p.category === "alcohol");
export const blackFridayProducts = products.filter(p => p.category === "blackfriday");
export const discountedProducts = products.filter(p => p.originalPrice && p.originalPrice > p.price);
