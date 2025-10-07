import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Phone, User, Smartphone, DollarSign, Clock, Store, Navigation } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { useCart } from "../contexts/CartContext";
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrdersContext';
import { useWallet } from '../contexts/NewWalletContext';
import { getApiBase } from '@/lib/api';
import { PickupLocationService, type PickupLocation } from '../services/pickup-location';
import { WalletPaymentService } from '../services/WalletPaymentService';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const auth = useAuth();
  const { toast } = useToast();
  const { createOrder: createOrderContext } = useOrders();
  const { balance, refreshWallet } = useWallet();
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
  const [selectedPickupLocationData, setSelectedPickupLocationData] = useState<PickupLocation | null>(null);
  
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("mpesa");
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    loadPickupLocations();
  }, []);

  const loadPickupLocations = async () => {
    try {
      setLoadingLocations(true);
      
      const { data, error } = await PickupLocationService.getActiveLocations();
      
      if (data && data.length > 0) {
        setPickupLocations(data);
      } else {
        const fallbackLocations: PickupLocation[] = [
          {
            id: 'lavington',
            name: 'Quickmart Lavington',
            address: 'Lavington Green Shopping Centre, Hatheru Road, Nairobi',
            latitude: -1.2774,
            longitude: 36.7664,
            phone: '+254 20 2386000',
            status: 'active',
            capacity: 100,
            features: ['Parking Available', 'Air Conditioned', 'Security'],
            operating_hours: {
              monday: '8:00 AM - 9:00 PM',
              tuesday: '8:00 AM - 9:00 PM',
              wednesday: '8:00 AM - 9:00 PM',
              thursday: '8:00 AM - 9:00 PM',
              friday: '8:00 AM - 9:00 PM',
              saturday: '8:00 AM - 9:00 PM',
              sunday: '9:00 AM - 8:00 PM'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'roysambu',
            name: 'Quickmart Roysambu',
            address: 'Roysambu Roundabout, Thika Road, Nairobi',
            latitude: -1.2097,
            longitude: 36.8833,
            phone: '+254 20 2386001',
            status: 'active',
            capacity: 80,
            features: ['Parking Available', 'Public Transport Access'],
            operating_hours: {
              monday: '8:00 AM - 9:00 PM',
              tuesday: '8:00 AM - 9:00 PM',
              wednesday: '8:00 AM - 9:00 PM',
              thursday: '8:00 AM - 9:00 PM',
              friday: '8:00 AM - 9:00 PM',
              saturday: '8:00 AM - 9:00 PM',
              sunday: '9:00 AM - 8:00 PM'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'westlands',
            name: 'Quickmart Westlands',
            address: 'Westlands Square, Waiyaki Way, Nairobi',
            latitude: -1.2634,
            longitude: 36.8078,
            phone: '+254 20 2386002',
            status: 'active',
            capacity: 120,
            features: ['Parking Available', 'Food Court', '24/7 Security'],
            operating_hours: {
              monday: '8:00 AM - 10:00 PM',
              tuesday: '8:00 AM - 10:00 PM',
              wednesday: '8:00 AM - 10:00 PM',
              thursday: '8:00 AM - 10:00 PM',
              friday: '8:00 AM - 10:00 PM',
              saturday: '8:00 AM - 10:00 PM',
              sunday: '9:00 AM - 9:00 PM'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'thindiuga',
            name: 'Quickmart Thindiuga',
            address: 'Thindiuga Shopping Centre, Kiambu Road, Nairobi',
            latitude: -1.2303,
            longitude: 36.8647,
            phone: '+254 20 2386003',
            status: 'active',
            capacity: 60,
            features: ['Parking Available', 'Pharmacy Nearby'],
            operating_hours: {
              monday: '8:00 AM - 9:00 PM',
              tuesday: '8:00 AM - 9:00 PM',
              wednesday: '8:00 AM - 9:00 PM',
              thursday: '8:00 AM - 9:00 PM',
              friday: '8:00 AM - 9:00 PM',
              saturday: '8:00 AM - 9:00 PM',
              sunday: '9:00 AM - 8:00 PM'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mombasa-road',
            name: 'Quickmart Mombasa Road',
            address: 'Mombasa Road, Industrial Area, Nairobi',
            latitude: -1.3201,
            longitude: 36.8585,
            phone: '+254 20 2386004',
            status: 'active',
            capacity: 90,
            features: ['Ample Parking', 'Industrial Area Access'],
            operating_hours: {
              monday: '8:00 AM - 9:00 PM',
              tuesday: '8:00 AM - 9:00 PM',
              wednesday: '8:00 AM - 9:00 PM',
              thursday: '8:00 AM - 9:00 PM',
              friday: '8:00 AM - 9:00 PM',
              saturday: '8:00 AM - 9:00 PM',
              sunday: '9:00 AM - 8:00 PM'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setPickupLocations(fallbackLocations);
      }
    } catch (error) {
      console.error('Error loading pickup locations:', error);
      toast({
        title: "Info",
        description: "Using default pickup locations.",
        variant: "default",
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const handlePickupLocationChange = (locationId: string) => {
    setPickupLocation(locationId);
    const selectedLocation = pickupLocations.find(loc => loc.id === locationId);
    setSelectedPickupLocationData(selectedLocation || null);
  };

  const isLocationOpen = (location: PickupLocation) => {
    return PickupLocationService.isLocationOpen(location.operating_hours);
  };

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
      // Use M-Pesa microservice - production ready
      const mpesaServiceUrl = import.meta.env.VITE_MPESA_SERVICE_URL || 
        (import.meta.env.PROD ? 'https://getdeals.co.ke' : 'http://localhost:3001');
      console.log('Initiating STK Push with M-Pesa microservice:', mpesaServiceUrl);
      
      const response = await fetch(`${mpesaServiceUrl}/api/payments/mpesa/stk-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phoneNumber: formatPhoneNumber(phoneNumber),
          orderId: orderReference,
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
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      const mpesaServiceUrl = import.meta.env.VITE_MPESA_SERVICE_URL || 
        (import.meta.env.PROD ? 'https://getdeals.co.ke' : 'http://localhost:3001');
      const response = await fetch(`${mpesaServiceUrl}/api/payments/mpesa/status/${checkoutRequestId}`);

      const responseText = await response.text();
      console.log(' Payment status response text:', responseText);

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

      console.log(' Payment status parsed result:', result);

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
      if (!auth.user?.id) {
        throw new Error('User not authenticated');
      }

      const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const deliveryFee = orderData.deliveryMethod === 'speedy' ? 200 : 0;
      const totalAmount = subtotal + deliveryFee;

      const dbOrderData = {
        user_id: auth.user.id,
        customer_email: email,
        customer_name: `${firstName} ${lastName}`.trim(),
        customer_phone: orderData.mpesaPhone || phone,
        items: orderData.items,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        delivery_method: orderData.deliveryMethod,
        delivery_address: orderData.deliveryAddress,
        pickup_location: orderData.deliveryMethod === 'pickup' ? (selectedPickupLocationData?.name || pickupLocation) : undefined,
        payment_method: orderData.paymentMethod,
        payment_reference: orderData.paymentReference,
        payment_confirmed: orderData.paymentConfirmed || false,
        mpesa_receipt_number: orderData.mpesaReceiptNumber,
        checkout_request_id: orderData.checkoutRequestId,
        merchant_request_id: orderData.merchantRequestId
      };

      console.log(' Creating database order:', {
        user_id: dbOrderData.user_id,
        total_amount: dbOrderData.total_amount,
        payment_confirmed: dbOrderData.payment_confirmed,
        payment_reference: dbOrderData.payment_reference
      });

      // Call the database order creation API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbOrderData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error(' Order creation failed with result:', result);
        const errorDetails = result.details ? ` (${result.details})` : '';
        throw new Error(result.error + errorDetails || 'Failed to create order in database');
      }

      console.log(' Order created in database:', result.order);

      // Also update local context for immediate UI updates
      const orderForContext = {
        items: orderData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: totalAmount,
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: orderData.paymentMethod,
        customer: {
          firstName,
          lastName,
          phone: orderData.mpesaPhone || phone,
          email,
          address: orderData.deliveryAddress,
          pickupLocation: orderData.deliveryMethod === 'pickup' ? selectedPickupLocationData?.name || pickupLocation : undefined,
          pickupLocationDetails: orderData.deliveryMethod === 'pickup' ? selectedPickupLocationData : undefined,
        },
        status: 'confirmed' as const, // Orders are confirmed since payment is done
      };

      createOrderContext(orderForContext);

      return { 
        success: true, 
        order: {
          id: result.order.id,
          order_reference: result.order.order_reference,
          ...result.order
        }
      };
    } catch (error) {
      console.error(' Order creation error:', error);
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

    if (paymentMethod === 'mobile-money' && !mpesaPhone.trim()) {
      toast({
        variant: 'destructive',
        title: `${mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} Phone Required`,
        description: `Please provide your ${mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} phone number.`,
      });
      return;
    }

    setIsLoading(true);
    setPaymentStatus("processing");

    try {
      if (paymentMethod === "mobile-money") {
        // Handle Mobile Money payment (M-Pesa or Airtel Money) - PAYMENT FIRST APPROACH
        const phoneToUse = mpesaPhone || phone;
        if (!phoneToUse) {
          throw new Error(`Phone number is required for ${mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} payment`);
        }

        const orderReference = `GD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        console.log('Initiating STK Push for:', { amount: finalTotal, phone: phoneToUse, orderReference });
        
        const stkResult = await initiateSTKPush(finalTotal, phoneToUse, orderReference);

        if (!stkResult.success) {
          setPaymentStatus("failed");
          toast({
            title: "Payment Initiation Failed",
            description: stkResult.error || "Failed to initiate M-Pesa payment. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return; 
        }



        const providerName = mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money';
        toast({
          title: `${providerName} Payment Initiated!`,
          description: `Please check your phone (${phoneToUse}) and enter your ${providerName} PIN to complete the payment. DO NOT REFRESH THE PAGE.`,
        });

 
        let paymentConfirmed = false;
        let orderCreated = false;
        const maxAttempts = 30; 
        let attempts = 0;

        const checkStatus = async () => {
            if (attempts >= maxAttempts) {
              setPaymentStatus("failed");
              setIsLoading(false);
              toast({
                title: "Payment Timeout ",
                description: "Payment verification timed out. If money was deducted, please contact support with order reference: " + orderReference,
                variant: "destructive",
              });
              return;
            }          attempts++;
          console.log(`Checking payment status... Attempt ${attempts}/${maxAttempts}`);
          
          try {
            const statusResult = await checkPaymentStatus(stkResult.CheckoutRequestID);
            console.log(' Payment status result:', statusResult);

            // Payment successful - NOW create the order
            if (statusResult.success && statusResult.paymentConfirmed) {
              if (!paymentConfirmed) {
                paymentConfirmed = true;
                console.log(' Payment confirmed! Creating order...');
                
                // Step 3: Create order ONLY after payment is confirmed
                const orderData = {
                  items,
                  deliveryMethod,
                  deliveryAddress: deliveryMethod === "speedy" ? address : undefined,
                  paymentMethod,
                  mobileMoneyProvider,
                  mpesaPhone: formatPhoneNumber(phoneToUse),
                  checkoutRequestId: stkResult.CheckoutRequestID,
                  merchantRequestId: stkResult.MerchantRequestID,
                  paymentReference: orderReference,
                  paymentConfirmed: true,
                  mpesaReceiptNumber: statusResult.mpesaReceiptNumber || 'N/A',
                  paymentAmount: finalTotal,
                };

                const orderResult = await createOrder(orderData);

                if (orderResult.success) {
                  orderCreated = true;
                  setPaymentStatus("success");
                  toast({
                    title: "Payment Successful! ",
                    description: `Your order has been confirmed! Receipt: ${statusResult.mpesaReceiptNumber || 'N/A'}`,
                  });
                  clearCart();
                  setTimeout(() => {
                    navigate(`/account?tab=orders&orderId=${orderResult.order.id}`);
                  }, 2000);
                } else {
                  setPaymentStatus("failed");
                  toast({
                    title: "Order Creation Failed",
                    description: "Payment was successful but order creation failed. Please contact support with receipt: " + (statusResult.mpesaReceiptNumber || orderReference),
                    variant: "destructive",
                  });
                  setIsLoading(false);
                }
              }
              return; // Stop polling
            }
            
            // Payment explicitly failed
            else if (statusResult.success && statusResult.paymentConfirmed === false && (
              statusResult.resultCode === '1032' || // User cancelled
              statusResult.resultCode === '1037' || // Payment timeout
              statusResult.resultCode === '1' ||    // Insufficient funds
              statusResult.resultCode === '1001' || // Unable to complete
              statusResult.resultCode === '2029'    // STK push not delivered/timeout
            )) {
              setPaymentStatus("failed");
              setIsLoading(false);
              
              let errorMessage = "Payment was not completed.";
              if (statusResult.resultCode === '1032') errorMessage = "Payment was cancelled by user.";
              else if (statusResult.resultCode === '1037') errorMessage = "Payment timed out.";
              else if (statusResult.resultCode === '1') errorMessage = "Insufficient funds in M-Pesa account.";
              else if (statusResult.resultCode === '2029') {
                errorMessage = "Payment request didn't reach your phone. Please ensure you have good network coverage and try again.";
              }
              
              toast({
                title: "Payment Failed",
                description: errorMessage + " Please try again.",
                variant: "destructive",
              });
              return; // Stop polling
            }
            
            // Payment still pending - continue polling
            else {
              console.log(`Payment still pending... (${attempts}/${maxAttempts})`);
              setTimeout(checkStatus, 6000); // Check again in 6 seconds
            }
            
          } catch (error) {
            console.error('Error checking payment status:', error);
            if (attempts >= maxAttempts) {
              setPaymentStatus("failed");
              setIsLoading(false);
              toast({
                title: "Payment Verification Error",
                description: "Unable to verify payment status. Please check your M-Pesa messages or contact support.",
                variant: "destructive",
              });
            } else {
              setTimeout(checkStatus, 6000); // Try again
            }
          }
        };

        // Start checking payment status after 5 seconds
        setTimeout(checkStatus, 5000);
      } else {
        // Handle wallet and other payment methods
        if (paymentMethod === "wallet") {
          // Check wallet balance first
          if (balance < finalTotal) {
            throw new Error(`Insufficient wallet balance. You have KES ${balance.toLocaleString()} but need KES ${finalTotal.toLocaleString()}. Please add funds to your wallet.`);
          }

          // Handle GetDeals Wallet payment via Rukisha merchant payment API
          setPaymentStatus("processing");

          const orderReference = `GD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          const walletResult = await WalletPaymentService.initiatePayment({
            amount: finalTotal,
            phone: phone,
            reference: orderReference,
            description: `Order payment - ${orderReference}`
          });

          if (!walletResult.success) {
            throw new Error(walletResult.error || "Failed to process wallet payment");
          }

          // Refresh wallet balance after successful payment
          await refreshWallet();

          // Create order with wallet payment details
          const orderData = {
            items,
            deliveryMethod,
            deliveryAddress: deliveryMethod === "speedy" ? address : undefined,
            paymentMethod,
            paymentReference: orderReference,
            paymentConfirmed: true,
            phone: phone, // Keep customer's phone for order notifications
          };

          const orderResult = await createOrder(orderData);

          if (!orderResult.success) {
            throw new Error(orderResult.error || "Failed to create order");
          }

          setPaymentStatus("success");
          
          // Calculate cashback (5% of total)
          const cashback = Math.round(finalTotal * 0.05);
          
          toast({
            title: "💰 Wallet Payment Successful!",
            description: `Payment of KES ${finalTotal.toLocaleString()} processed via your wallet. Transaction ID: ${walletResult.transaction_id}. You've earned KES ${cashback} cashback!`,
            duration: 8000,
          });

          clearCart();
          setTimeout(() => {
            navigate(`/account?tab=orders&orderId=${orderResult.order.id}`);
          }, 2000);
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
            title: "Order Placed Successfully!",
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

  // Calculate delivery fee and final total based on selected delivery method
  // CRITICAL: Delivery fee (KES 200) only applies to 'speedy' delivery, NOT pickup
  const deliveryFee = deliveryMethod === "speedy" ? 200 : 0;
  const finalTotal = total + deliveryFee; // Customer pays: subtotal + delivery (if speedy)

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        {/* Wallet Incentive Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Pay with Wallet & Save Big!</h2>
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
                  <div className="mt-4 space-y-4">
                    <Label htmlFor="pickupLocation">Pickup Location</Label>
                    <Select 
                      value={pickupLocation} 
                      onValueChange={handlePickupLocationChange}
                      disabled={loadingLocations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select pickup location"} />
                      </SelectTrigger>
                      <SelectContent>
                        {pickupLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                <span>{location.name}</span>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {isLocationOpen(location) ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Open</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Closed</Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Selected location details */}
                    {selectedPickupLocationData && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-blue-900">{selectedPickupLocationData.name}</h4>
                            {isLocationOpen(selectedPickupLocationData) ? (
                              <Badge className="bg-green-100 text-green-800">Open Now</Badge>
                            ) : (
                              <Badge variant="secondary">Closed</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-2 text-sm text-blue-800">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{selectedPickupLocationData.address}</span>
                          </div>
                          
                          {selectedPickupLocationData.phone && (
                            <div className="flex items-center gap-2 text-sm text-blue-800">
                              <Phone className="h-4 w-4" />
                              <span>{selectedPickupLocationData.phone}</span>
                            </div>
                          )}

                          {selectedPickupLocationData.features && selectedPickupLocationData.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedPickupLocationData.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {selectedPickupLocationData.instructions && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="flex items-start gap-2">
                                <Navigation className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-sm font-medium text-yellow-800">Pickup Instructions:</div>
                                  <div className="text-sm text-yellow-700 mt-1">
                                    {selectedPickupLocationData.instructions}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-blue-600 mt-2">
                            Operating Hours: {(() => {
                              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                              const todayHours = selectedPickupLocationData.operating_hours[today as keyof typeof selectedPickupLocationData.operating_hours];
                              return `Today: ${todayHours}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
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
                    <div className="text-lg"></div>
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
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                              powered by rukisha
                            </span>
                          </div>
                          <div className="text-sm text-green-700 mt-1">
                            Balance: KES {balance.toLocaleString()} • Instant payment • Earn rewards
                          </div>
                          {balance < finalTotal && (
                            <div className="text-xs text-red-600 mt-1 font-medium">
                              Insufficient balance - Need KES {(finalTotal - balance).toLocaleString()} more
                            </div>
                          )}
                        </div>

                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mt-2">
                    <RadioGroupItem value="mobile-money" id="mobile-money" />
                    <Label htmlFor="mobile-money" className="flex-1 cursor-pointer">
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-sm text-muted-foreground">
                        Pay with M-Pesa or Airtel Money
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "mobile-money" && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Choose Mobile Money Provider</Label>
                      <RadioGroup value={mobileMoneyProvider} onValueChange={setMobileMoneyProvider} className="mt-2">
                        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value="mpesa" id="mpesa-provider" />
                          <Label htmlFor="mpesa-provider" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-green-600">M-Pesa</div>
                                <div className="text-sm text-muted-foreground">Safaricom M-Pesa</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value="airtel" id="airtel-provider" />
                          <Label htmlFor="airtel-provider" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-red-600">Airtel Money</div>
                                <div className="text-sm text-muted-foreground">Airtel Kenya</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <Label htmlFor="mobileMoneyPhone">
                        {mobileMoneyProvider === "mpesa" ? "M-Pesa" : "Airtel Money"} Phone Number
                      </Label>
                      <Input
                        id="mobileMoneyPhone"
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder={mobileMoneyProvider === "mpesa" ? "254712345678 (M-Pesa)" : "254712345678 (Airtel)"}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your {mobileMoneyProvider === "mpesa" ? "M-Pesa registered" : "Airtel Money registered"} phone number
                      </p>
                    </div>
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
                        <span className="font-medium text-green-800">Cashback Reward:</span>
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
                    items.length === 0 ||
                    (paymentMethod === "wallet" && balance < finalTotal)
                  }
                >
                  {paymentStatus === "processing" && paymentMethod === "mobile-money" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Waiting for {mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}...
                    </>
                  ) : paymentStatus === "processing" && paymentMethod === "wallet" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Wallet Payment...
                    </>
                  ) : isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : paymentMethod === "mobile-money" ? (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Pay with {mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}
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



                {/* Payment Status Messages */}
                {paymentStatus === "success" && (
                  <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-green-600 font-medium">Payment Successful!</div>
                    <p className="text-xs text-green-500 mt-1">Redirecting to your orders...</p>
                  </div>
                )}

                {paymentStatus === "failed" && (
                  <div className="text-center py-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-red-600 font-medium">Payment Failed</div>
                    <p className="text-xs text-red-500 mt-1">Please try again or contact support</p>
                  </div>
                )}
                
                {paymentMethod === "mobile-money" && (
                  <div className="text-xs text-center text-muted-foreground space-y-1">
                    <p>• You'll receive a payment prompt on your phone</p>
                    <p>• Enter your {mobileMoneyProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} PIN to complete payment</p>
                    <p>• Your order will be created only after successful payment</p>
                  </div>
                )}

                {paymentMethod === "wallet" && balance >= finalTotal && (
                  <div className="text-xs text-center text-green-700 space-y-1 bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">Wallet Benefits:</p>
                    <p>• <strong>Instant payment</strong> - No waiting for confirmation</p>
                    <p>• <strong>Earn 5% cashback</strong> on every order</p>
                    <p>• <strong>Secure & encrypted</strong> transactions</p>
                    <p>• <strong>Lightning fast</strong> checkout process</p>
                    <p>• <strong>No transaction fees</strong> - Save money!</p>
                  </div>
                )}

                {paymentMethod === "wallet" && balance < finalTotal && (
                  <div className="text-xs text-center text-orange-700 space-y-1 bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="font-medium text-orange-800">Insufficient Wallet Balance</p>
                    <p>You need <strong>KES {(finalTotal - balance).toLocaleString()}</strong> more to complete this order.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => navigate('/wallet')}
                    >
                      Add Funds to Wallet
                    </Button>
                  </div>
                )}

                {paymentStatus === "processing" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {paymentMethod === "wallet" 
                        ? "Processing wallet payment..." 
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
