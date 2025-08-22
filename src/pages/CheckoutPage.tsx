import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Phone, User, Smartphone, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  
  // Customer details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  
  // Payment details
  const [mpesaPhone, setMpesaPhone] = useState("");

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.startsWith('254')) {
      return digits;
    } else if (digits.startsWith('0')) {
      return '254' + digits.substring(1);
    } else if (digits.length === 9) {
      return '254' + digits;
    }
    
    return digits;
  };

  const initiateSTKPush = async (amount: number, phoneNumber: string, orderReference: string) => {
    try {
      const response = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phoneNumber: formatPhoneNumber(phoneNumber),
          orderReference,
          description: `Payment for GetDeals order ${orderReference}`
        }),
      });

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      console.log('STK Push response text:', responseText);
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (response.ok) {
        return { success: true, ...result };
      } else {
        throw new Error(result.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('STK Push error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Payment failed' };
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      const response = await fetch(`/api/payments/mpesa/query/${checkoutRequestId}`);
      
      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      console.log('Payment status response text:', responseText);
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (response.ok) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Status check failed' };
    }
  };

  const createOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, order: result };
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Order creation failed' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check M-Pesa availability first
      if (paymentMethod === "mpesa") {
        // Show M-Pesa unavailable message
        toast({
          title: "M-Pesa Not Available 📱",
          description: "M-Pesa integration is currently underway. Please use wallet payment or contact support for assistance.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Set processing status only for available payment methods
      setPaymentStatus("processing");

      // Generate order reference
      const orderReference = `GD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Prepare order data
      const orderData = {
        orderReference,
        customerInfo: {
          firstName,
          lastName,
          phone: formatPhoneNumber(phone),
          email,
          address: deliveryMethod === "speedy" ? address : undefined,
          pickupLocation: deliveryMethod === "pickup" ? pickupLocation : undefined,
        },
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal: total,
        deliveryFee,
        total: finalTotal,
        deliveryMethod,
        paymentMethod,
        status: 'pending'
      };
  
      // Handle wallet and other payment methods
      const orderResult = await createOrder(orderData);
      
      if (!orderResult.success) {
        throw new Error(orderResult.error || "Failed to create order");
      }

      setPaymentStatus("success");
      toast({
        title: "Order Placed Successfully! 🎉",
        description: "You will receive confirmation details shortly.",
      });

      clearCart();
      setTimeout(() => {
        navigate(`/account?tab=orders&orderId=${orderResult.order.id}`);
      }, 1500);

    } catch (error) {
      setPaymentStatus("failed");
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                  <div className="flex items-center space-x-2 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label htmlFor="mpesa" className="flex-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        <span className="font-medium">M-Pesa</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Recommended</Badge>
                      </div>
                      <div className="text-sm text-green-700">
                        Pay instantly with M-Pesa STK Push - Fast & Secure
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">Card Payment</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Visa, Mastercard accepted
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Wallet Payment</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pay using your GetDeals wallet balance
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "mpesa" && (
                  <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
                    <div>
                      <Label htmlFor="mpesaPhone" className="text-sm font-medium">
                        M-Pesa Phone Number
                      </Label>
                      <Input 
                        id="mpesaPhone" 
                        type="tel" 
                        placeholder="+254 7XX XXX XXX" 
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="bg-white"
                      />
                      <p className="text-xs text-green-700 mt-1">
                        Leave empty to use your contact phone number
                      </p>
                    </div>
                    
                    {paymentStatus === "processing" && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          STK Push sent! Please check your phone and enter your M-Pesa PIN to complete payment.
                        </AlertDescription>
                      </Alert>
                    )}
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
                  className="w-full relative" 
                  disabled={
                    isLoading ||
                    items.length === 0
                  }
                >
                  {paymentStatus === "processing" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Waiting for M-Pesa...
                    </>
                  ) : isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : paymentMethod === "mpesa" ? (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Pay with M-Pesa
                    </>
                  ) : paymentMethod === "wallet" ? (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay with Wallet
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                
                {paymentMethod === "mpesa" && (
                  <div className="text-xs text-center text-muted-foreground space-y-1">
                    <p>• M-Pesa integration is currently underway</p>
                    <p>• Please use wallet payment for now</p>
                    <p>• Contact support for assistance</p>
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <div className="text-xs text-center text-muted-foreground space-y-1">
                    <p>• Payment will be deducted from your wallet balance</p>
                    <p>• Top up your wallet for seamless payments</p>
                    <p>• Instant order confirmation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}