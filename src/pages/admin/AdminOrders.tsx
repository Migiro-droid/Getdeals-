import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminOrders() {
  const { orders, updateStatus } = useOrders();
  const statuses: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Orders</h1>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">No orders yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{o.id}</span>
                    <Badge>{o.status.replace(/_/g, " ")}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div><span className="text-muted-foreground">Customer:</span> {o.customer.firstName} {o.customer.lastName}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {o.customer.phone}</div>
                    <div><span className="text-muted-foreground">Payment:</span> {o.paymentMethod}</div>
                    <div><span className="text-muted-foreground">When:</span> {new Date(o.date).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Total:</span> KES {o.total.toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{o.items.length} item(s)</div>
                  <div className="flex items-center gap-3">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                      <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (<SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
