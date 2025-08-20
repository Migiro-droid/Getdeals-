import { useProducts } from "@/contexts/ProductsContext";

export default function TestProductsPage() {
  const { all } = useProducts();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Products Test</h1>
      <p className="mb-4">Total products: {all.length}</p>
      <div className="grid gap-4">
        {all.map((product) => (
          <div key={product.id} className="border p-4 rounded">
            <h3 className="font-semibold">{product.name}</h3>
            <p>Price: KES {product.price}</p>
            <p>Category: {product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
