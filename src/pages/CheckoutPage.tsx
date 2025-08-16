import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useOrders } from "@/contexts/OrdersContext";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const { balance, withdraw } = useWallet();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // If paying with wallet, ensure sufficient funds and deduct
    if (paymentMethod === "wallet") {
      const res = withdraw(finalTotal, "Checkout payment", "payment");
      if (!res.ok) {
        toast({
          title: "Wallet payment failed",
          description: res.error || "Insufficient wallet balance",
        });
        setIsLoading(false);
        return;
      }
    }

    // Create order record
    const order = createOrder({
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
      subtotal: total,
      deliveryFee,
      total: finalTotal,
      deliveryMethod: deliveryMethod as any,
      paymentMethod: paymentMethod as any,
      customer: { firstName, lastName, phone, email, address: deliveryMethod === "speedy" ? address : undefined, pickupLocation: deliveryMethod === "pickup" ? pickupLocation : undefined },
    });

    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 800));

    toast({
      title: "Order placed successfully!",
      description: "You will receive an SMS confirmation shortly.",
    });

    clearCart();
    setIsLoading(false);
    // Jump to account orders tab and highlight the new order
    navigate(`/account?tab=orders`, { state: { tab: "orders", orderId: order.id } });
  };

  const deliveryFee = deliveryMethod === "speedy" ? 200 : 0;
  const finalTotal = total + deliveryFee;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+254 7XX XXX XXX" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1">
                      <div className="font-medium">Pickup Point - Free</div>
                      <div className="text-sm text-muted-foreground">
                        Collect from your nearest Quickmart at your convenience
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="speedy" id="speedy" />
                    <Label htmlFor="speedy" className="flex-1">
                      <div className="font-medium">Speedy Drop - KES 200</div>
                      <div className="text-sm text-muted-foreground">
                        Fast delivery to your doorstep within 2 hours
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryMethod === "pickup" && (
                  <div>
                    <Label htmlFor="quickmart">Select Quickmart Location</Label>
                    <Select required value={pickupLocation} onValueChange={setPickupLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your pickup location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="westlands">Westlands Quickmart</SelectItem>
                        <SelectItem value="karen">Karen Quickmart</SelectItem>
                        <SelectItem value="kiambu">Kiambu Quickmart</SelectItem>
                        <SelectItem value="thika">Thika Quickmart</SelectItem>
                        <SelectItem value="nakuru">Nakuru Quickmart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {deliveryMethod === "speedy" && (
                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input id="address" placeholder="Enter your full address" required value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label htmlFor="mpesa" className="flex-1">
                      <div className="font-medium">M-Pesa</div>
                      <div className="text-sm text-muted-foreground">
                        Pay instantly with M-Pesa
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1">
                      <div className="font-medium">Card Payment</div>
                      <div className="text-sm text-muted-foreground">
                        Visa, Mastercard accepted
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1">
                      <div className="font-medium">GetDeals Wallet</div>
                      <div className="text-sm text-muted-foreground">
                        Current balance: KES {balance.toLocaleString()}
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1">
                      <div className="font-medium">Cash Payment</div>
                      <div className="text-sm text-muted-foreground">
                        Pay cash on delivery/pickup
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "wallet" && (
                  <div className={`text-sm ${balance < finalTotal ? "text-red-600" : "text-muted-foreground"}`}>
                    {balance < finalTotal
                      ? "Insufficient wallet balance for this order. Please deposit or choose another method."
                      : "This order will be paid from your GetDeals Wallet."}
                  </div>
                )}

                {paymentMethod === "mpesa" && (
                  <div>
                    <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                    <Input id="mpesaPhone" type="tel" placeholder="+254 7XX XXX XXX" required />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>KES {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>KES {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>KES {deliveryFee.toLocaleString()}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">KES {finalTotal.toLocaleString()}</span>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={
                    isLoading ||
                    items.length === 0 ||
                    (paymentMethod === "wallet" && balance < finalTotal)
                  }
                >
                  {isLoading ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}