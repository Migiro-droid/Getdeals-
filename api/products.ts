// src/data/products.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  discount?: number;
  items?: string[];
  category: string;
  description?: string;
}

const withImage = (path?: string) => {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

export const products: Product[] = [
  {
    id: "essential-basket",
    name: "Essential Basket",
    price: 2500,
    originalPrice: 3000,
    image: withImage("essential-basket.jpg"),
    category: "Bundles",
    description: "A selection of daily essentials for your household.",
    items: ["Rice", "Sugar", "Cooking Oil", "Flour"],
  },
  {
    id: "family-basket",
    name: "Family Basket",
    price: 4500,
    originalPrice: 5200,
    image: withImage("family-basket.jpg"),
    category: "Bundles",
    description: "Perfect for family needs with more savings.",
    items: ["Milk", "Bread", "Eggs", "Snacks"],
  },
  {
    id: "detergent",
    name: "Detergent 1kg",
    price: 450,
    image: withImage("https://examplecdn.com/products/detergent.jpg"),
    category: "Cleaning",
    description: "High-quality detergent for bright clothes.",
  },
  {
    id: "placeholder-sample",
    name: "Coming Soon Product",
    price: 999,
    image: withImage(""), // intentionally blank → uses placeholder.svg
    category: "Upcoming",
  },
];
