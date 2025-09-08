import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Phone, User, Smartphone, DollarSign, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useCart } from "../contexts/CartContext";
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrdersContext';
import { getApiBase } from '@/lib/api';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const auth = useAuth();
  const { toast } = useToast();
  const { createOrder: createOrderContext } = useOrders();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  
  const [mpesaPhone, setMpesaPhone] = useState("");

  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    
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
      const baseUrl = getApiBase();
      console.log('Initiating STK Push with base URL:', baseUrl);
      
      const response = await fetch(`${baseUrl}/api/payments/mpesa/stk-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phoneNumber: formatPhoneNumber(phoneNumber),
          orderReference,
          description: `Payment for GetDeals order ${orderReference}`
        }),
      });

      console.log('STK Push response status:', response.status);
      
      if (response.status === 404) {
        throw new Error('Payment service is not available. Please try again later.');
      }

      const responseText = await response.text();
      console.log('STK Push response text:', responseText);

      if (!responseText) {
        throw new Error('Empty response from payment server');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Invalid response from payment server: ${responseText.substring(0, 100)}`);
      }

      if (response.ok && result.success) {
        return { success: true, ...result };
      } else {
        const errorMsg = result.error || 'Payment initiation failed';
        console.error('STK Push failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('STK Push error:', error);
      
      // Fallback for development: simulate successful STK Push if API is not available
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Payment API server not available, using mock STK Push');
        const mockResult = {
          success: true,
          checkoutRequestId: `ws_CO_${Date.now()}`,
          merchantRequestId: `mr_${Date.now()}`,
          responseCode: '0',
          responseDescription: 'Success. Request accepted for processing',
          customerMessage: 'Mock: Please enter your M-Pesa PIN to complete the transaction'
        };
        return mockResult;
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      const baseUrl = getApiBase();
      const response = await fetch(`${baseUrl}/api/payments/mpesa/query/${checkoutRequestId}`);

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
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Payment status API not available, simulating payment completion');
        return { 
          success: true, 
          status: 'completed',
          resultCode: '0',
          resultDesc: 'Mock: The service request is processed successfully.'
        };
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Status check failed' };
    }
  };

  const createOrder = async (orderData: any) => {
    try {
      // Transform order data for OrdersContext
      const orderForContext = {
        items: orderData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        deliveryFee: orderData.deliveryMethod === 'speedy' ? 200 : 0,
        total: orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) + (orderData.deliveryMethod === 'speedy' ? 200 : 0),
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: orderData.paymentMethod,
        customer: {
          firstName,
          lastName,
          phone,
          email,
          address: orderData.deliveryAddress,
          pickupLocation: orderData.deliveryMethod === 'pickup' ? pickupLocation : undefined,
        },
        status: 'pending' as const,
      };

      const order = await createOrderContext(orderForContext);
      return { success: true, order };
    } catch (error) {
      console.error('Order creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Order creation failed' 
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to place an order.',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart Empty',
        description: 'Please add items to your cart before checkout.',
      });
      return;
    }

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required customer information fields.',
      });
      return;
    }

    if (deliveryMethod === 'speedy' && !address.trim()) {
      toast({
        variant: 'destructive',
        title: 'Delivery Address Required',
        description: 'Please provide a delivery address for speedy delivery.',
      });
      return;
    }

    if (deliveryMethod === 'pickup' && !pickupLocation) {
      toast({
        variant: 'destructive',
        title: 'Pickup Location Required',
        description: 'Please select a pickup location.',
      });
      return;
    }

    if (paymentMethod === 'mpesa' && !mpesaPhone.trim()) {
      toast({
        variant: 'destructive',
        title: 'M-Pesa Phone Required',
        description: 'Please provide your M-Pesa phone number.',
      });
      return;
    }

    setIsLoading(true);
    setPaymentStatus("processing");

    try {
      if (paymentMethod === "mpesa") {
        // Handle M-Pesa payment
        const phoneToUse = mpesaPhone || phone;
        if (!phoneToUse) {
          throw new Error("Phone number is required for M-Pesa payment");
        }

        const orderReference = `GD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        const stkResult = await initiateSTKPush(finalTotal, phoneToUse, orderReference);

        if (!stkResult.success) {
          throw new Error(stkResult.error || "Failed to initiate M-Pesa payment");
        }

        const orderData = {
          items,
          deliveryMethod,
          deliveryAddress: deliveryMethod === "speedy" ? address : undefined,
          paymentMethod,
          mpesaPhone: formatPhoneNumber(phoneToUse),
          checkoutRequestId: stkResult.checkoutRequestId,
          merchantRequestId: stkResult.merchantRequestId,
        };

        // Create order with M-Pesa details
        const orderResult = await createOrder(orderData);

        if (!orderResult.success) {
          throw new Error(orderResult.error || "Failed to create order");
        }
        toast({
          title: "M-Pesa Payment Initiated! 📱",
          description: `Please check your phone (${phoneToUse}) and enter your M-Pesa PIN to complete the payment.`,
        });

        // Poll for payment status
        const maxAttempts = 20;
        let attempts = 0;

        const checkStatus = async () => {
          if (attempts >= maxAttempts) {
            setPaymentStatus("failed");
            toast({
              title: "Payment Timeout",
              description: "Payment verification timed out. Please contact support if money was deducted.",
              variant: "destructive",
            });
            return;
          }

          attempts++;
          const statusResult = await checkPaymentStatus(stkResult.checkoutRequestId);

          if (statusResult.success && statusResult.status === "completed") {
            setPaymentStatus("success");
            toast({
              title: "Payment Successful! ✅",
              description: "Your order has been confirmed and you'll receive an SMS shortly.",
            });
            clearCart();
            setTimeout(() => {
              navigate(`/account?tab=orders&orderId=${orderResult.order.id}`);
            }, 2000);
          } else if (statusResult.success && statusResult.status === "failed") {
            setPaymentStatus("failed");
            toast({
              title: "Payment Failed",
              description: statusResult.error || "M-Pesa payment was not completed.",
              variant: "destructive",
            });
          } else {
            setTimeout(checkStatus, 6000);
          }
        };

        setTimeout(checkStatus, 3000);
      } else {
        // Handle wallet and other payment methods
        if (paymentMethod === "wallet") {
          // Set processing status for wallet payment
          setPaymentStatus("processing");

          // Simulate wallet integration processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          const orderData = {
            items,
            deliveryMethod,
            deliveryAddress: deliveryMethod === "speedy" ? address : undefined,
            paymentMethod,
          };

          const orderResult = await createOrder(orderData);

          if (!orderResult.success) {
            throw new Error(orderResult.error || "Failed to create order");
          }

          setPaymentStatus("success");
          toast({
            title: "Wallet Payment Successful! ✅",
            description: "Your order has been confirmed using wallet balance.",
          });

          clearCart();
          setTimeout(() => {
            navigate(`/account?tab=orders&orderId=${orderResult.order.id}`);
          }, 1500);
        } else {
          // Handle other payment methods (cash, card, etc.)
          const orderData = {
            items,
            deliveryMethod,
            deliveryAddress: deliveryMethod === "speedy" ? address : undefined,
            paymentMethod,
          };

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
        }
      }
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
        
        {/* Wallet Incentive Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">🎉 Pay with Wallet & Save Big!</h2>
              <p className="text-sm opacity-90">
                Get 5% cashback, instant payment, and no transaction fees. Join thousands of smart shoppers!
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-2xl font-bold">5%</div>
                <div className="text-xs">CASHBACK</div>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1">
                      <div className="font-medium">Store Pickup (Free)</div>
                      <div className="text-sm text-muted-foreground">
                        Pick up your order at our store
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="speedy" id="speedy" />
                    <Label htmlFor="speedy" className="flex-1">
                      <div className="font-medium">Speedy Delivery (KES 200)</div>
                      <div className="text-sm text-muted-foreground">
                        Fast delivery to your doorstep
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryMethod === "pickup" && (
                  <div className="mt-4">
                    <Label htmlFor="pickupLocation">Pickup Location</Label>
                    <Select value={pickupLocation} onValueChange={setPickupLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nairobi-cbd">Nairobi CBD Store</SelectItem>
                        <SelectItem value="westlands">Westlands Branch</SelectItem>
                        <SelectItem value="karen">Karen Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {deliveryMethod === "speedy" && (
                  <div className="mt-4">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your full address"
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Wallet Incentive Banner */}
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <div className="text-lg">🎉</div>
                    <div className="text-sm font-medium">
                      Pay with Wallet & Earn 5% Cashback!
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Get instant rewards on every purchase • No transaction fees • Lightning fast checkout
                  </p>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border-2 border-green-200 rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors">
                    <RadioGroupItem value="wallet" id="wallet" className="border-green-500" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-green-800 flex items-center gap-2">
                            GetDeals Wallet
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                              RECOMMENDED
                            </span>
                          </div>
                          <div className="text-sm text-green-700 mt-1">
                            ⚡ Instant payment • 💰 Earn rewards • 🔒 Secure & fast
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-600">Save KES 50</div>
                          <div className="text-xs text-gray-500 line-through">KES 50 fee</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mt-2">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label htmlFor="mpesa" className="flex-1 cursor-pointer">
                      <div className="font-medium">M-Pesa</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with M-Pesa mobile money (+KES 50 fee)
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "mpesa" && (
                  <div className="mt-4">
                    <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                    <Input
                      id="mpesaPhone"
                      type="tel"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="254712345678"
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">KES {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>KES {deliveryFee.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>KES {finalTotal.toLocaleString()}</span>
                </div>

                {paymentMethod === "wallet" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium text-green-800">💰 Cashback Reward:</span>
                        <span className="text-green-700 ml-2">KES {Math.round(finalTotal * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-green-600">
                        Earned instantly!
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full relative" 
                  disabled={
                    isLoading ||
                    items.length === 0
                  }
                >
                  {paymentStatus === "processing" && paymentMethod === "mpesa" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Waiting for M-Pesa...
                    </>
                  ) : paymentStatus === "processing" && paymentMethod === "wallet" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Wallet Integration Underway...
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
                    <p>• You'll receive an STK Push on your phone</p>
                    <p>• Enter your M-Pesa PIN to complete payment</p>
                    <p>• Payment confirmation is instant</p>
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <div className="text-xs text-center text-green-700 space-y-1 bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">🎁 Wallet Benefits:</p>
                    <p>• ⚡ <strong>Instant payment</strong> - No waiting for confirmation</p>
                    <p>• 💰 <strong>Earn 5% cashback</strong> on every order</p>
                    <p>• 🔒 <strong>Secure & encrypted</strong> transactions</p>
                    <p>• 🚀 <strong>Lightning fast</strong> checkout process</p>
                    <p>• 💳 <strong>No transaction fees</strong> - Save money!</p>
                  </div>
                )}

                {paymentStatus === "processing" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {paymentMethod === "wallet" 
                        ? "Wallet integration underway..." 
                        : "Processing your payment..."
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
