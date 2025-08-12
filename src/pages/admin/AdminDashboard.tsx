import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/contexts/OrdersContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { metrics } = useOrders();
  const { settings, setIsAdmin } = useAdmin();
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => setIsAdmin(false)}>Exit Admin</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-extrabold">KES {metrics.totalRevenue.toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Orders (Today)</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-extrabold">{metrics.todayCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-extrabold">{metrics.orderCount}</CardContent>
          </Card>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {Object.entries(metrics.byStatus).map(([k, v]) => (
            <Card key={k}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{k.replace(/_/g, " ")}</span>
                  <Badge variant="secondary">{v}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Orders in {k}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              <Button asChild><Link to="/admin/orders">Manage Orders</Link></Button>
              <Button variant="outline" asChild><Link to="/admin/settings">Site Settings</Link></Button>
              {!settings.blackFridayEnabled && (
                <Badge>BF disabled</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
