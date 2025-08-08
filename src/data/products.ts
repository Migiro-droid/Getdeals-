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
    category: "basket",
    description: "Perfect for small families with daily essentials"
  },
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
    category: "basket",
    description: "Complete family shopping solution"
  },
  {
    id: "premium-basket",
    name: "Premium Basket",
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
    category: "basket",
    description: "Premium products for discerning families"
  },
  {
    id: "luxury-basket",
    name: "Luxury Basket",
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
    category: "basket", 
    description: "Ultimate luxury shopping experience"
  }
];

export const featuredProducts = products.slice(0, 3);
export const basketProducts = products.filter(p => p.category === "basket");