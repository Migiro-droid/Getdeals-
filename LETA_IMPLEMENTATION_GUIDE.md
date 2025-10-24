# Leta Integration Implementation Guide

## Phase 1: Setup & Configuration

### Step 1: Environment Variables

Add to `.env`:
```env
# Leta API Configuration
VITE_LETA_API_URL=https://sandbox.integrations.leta.ai
VITE_LETA_TOKEN=your_token_from_leta_dashboard
LETA_API_TOKEN=your_token_from_leta_dashboard  # Backend
```

### Step 2: Initialize Leta Client

In your main app file or backend startup:

```typescript
import { initializeLetaClient } from '@/services/leta';

// Initialize on app startup
initializeLetaClient({
  token: process.env.VITE_LETA_TOKEN!,
  baseUrl: process.env.VITE_LETA_API_URL!,
  timeout: 30000,
  retries: 3,
});
```

### Step 3: Database Migration

Your existing orders table will be extended with Leta columns:

```sql
-- New columns to add to existing orders table:
ALTER TABLE orders ADD COLUMN (
  -- Leta Order Identification
  leta_order_id TEXT UNIQUE,
  leta_reference TEXT UNIQUE,
  
  -- Leta Status Tracking
  leta_status TEXT DEFAULT 'pending',
  leta_tracking_url TEXT,
  
  -- Delivery OTP
  delivery_otp TEXT,
  
  -- Rider Information
  rider_id TEXT,
  rider_name TEXT,
  rider_phone TEXT,
  rider_latitude FLOAT8,
  rider_longitude FLOAT8,
  
  -- Order Metadata
  special_instruction TEXT,
  cargo_description TEXT,
  
  -- Timestamps
  last_location_update TIMESTAMP WITH TIME ZONE,
  pickup_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);
```

**Mapping Your Existing Schema:**

| GetDeals Column | Leta Field | Purpose |
|---|---|---|
| `order_reference` | `reference` | Order identifier |
| `customer_phone` | `phone_number` | Customer contact |
| `customer_email` | `email` | Customer contact |
| `customer_name` | `name` | Customer name |
| `delivery_address` | `dropoff` | Delivery location |
| `order_items` | `products` | Items to deliver |
| `payment_method` | `payment_method` | Payment type |
| `special_instruction` | `special_instruction` | Delivery notes |
| `cargo_description` | `cargo_description` | Package description |

---

## Phase 2: Backend Implementation

### Step 4: Create Depot Service

First, create a depot in Leta:

```typescript
import { letaOrdersService, letaRatesService, letaDriversService } from '@/services/leta';
import { createLetaOrder, getShippingCost, checkDriverAvailability } from '@/services/orderService';

// Create your main depot
const depot = await createDepot({
  name: 'GetDeals Nairobi Hub',
  code: 'getdeals-nairobi',
  location: {
    latitude: -1.2860273,
    longitude: 36.8079678,
    name: 'GetDeals Warehouse, Nairobi'
  },
  order_wait_time: 15,
  max_orders: 50
});

// Save to your database
await db.depots.create({
  name: depot.data.name,
  code: depot.data.code,
  latitude: depot.data.location.latitude,
  longitude: depot.data.location.longitude,
  location_name: depot.data.location.name,
});
```

### Step 5: Use Order Service in Checkout

```typescript
import { getShippingCost, checkDriverAvailability, createLetaOrder } from '@/services/orderService';

// In checkout component
async function handleCheckout(basket) {
  // 1. Check shipping cost
  const shippingCost = await getShippingCost(
    userLocation.latitude,
    userLocation.longitude
  );

  // 2. Check driver availability
  const driversAvailable = await checkDriverAvailability(
    userLocation.latitude,
    userLocation.longitude
  );

  if (!driversAvailable.data.available_drivers) {
    toast.error('No drivers available for your location');
    return;
  }

  // 3. Create order in GetDeals DB
  const getdealsOrder = await createOrder({
    customer_phone: user.phone,
    customer_email: user.email,
    customer_name: user.name,
    delivery_address: userLocation,
    order_items: basket.items,
    total_amount: basket.total + shippingCost.data.price,
    delivery_fee: shippingCost.data.price,
    special_instruction: user.deliveryNotes
  });

  // 4. Create order in Leta
  const letaOrder = await createLetaOrder(getdealsOrder);

  if (letaOrder.success) {
    toast.success('Order placed successfully!');
    navigate(`/order-tracking/${getdealsOrder.id}`);
  }
}
```

---

## Phase 3: Frontend Implementation

### Step 1: Checkout Flow

```typescript
// Checkout component
import { letaRatesService, letaDriversService } from '@/services/leta';

function CheckoutPage() {
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [driversAvailable, setDriversAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDeliveryInfo() {
      setLoading(true);
      try {
        // Get shipping cost
        const rateResponse = await letaRatesService.calculateRate({
          origin: { latitude: -1.2860273, longitude: 36.8079678 },
          destination: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        });

        setDeliveryCost(rateResponse.data?.price);

        // Check driver availability
        const availResponse = await letaDriversService.checkAvailability({
          origin: { latitude: -1.2860273, longitude: 36.8079678 },
          destination: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        });

        setDriversAvailable(availResponse.data!.available_drivers > 0);
      } catch (error) {
        console.error('Failed to fetch delivery info:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveryInfo();
  }, [userLocation]);

  return (
    <div>
      {loading && <Spinner />}
      {driversAvailable ? (
        <div>
          <p>Delivery Cost: KES {deliveryCost}</p>
          <button onClick={handleCheckout}>Proceed to Checkout</button>
        </div>
      ) : (
        <div className="alert alert-warning">
          No drivers available for your location
        </div>
      )}
    </div>
  );
}
```

### Step 2: Order Tracking

```typescript
// Order tracking component
function OrderTracking({ letaOrderId }: { letaOrderId: string }) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    // Connect WebSocket for real-time tracking
    const ws = new WebSocket(
      `wss://sandbox.integrations.leta.ai/ws/orders/${letaOrderId}`
    );

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setLocation({
        lat: update.latitude,
        lng: update.longitude
      });
      setStatus(update.status);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fallback to polling
    };

    return () => ws.close();
  }, [letaOrderId]);

  return (
    <div>
      <p>Order Status: {status}</p>
      {location && <Map lat={location.lat} lng={location.lng} />}
    </div>
  );
}
```

### Step 3: Order Status Updates

```typescript
// Listen for webhook updates via Socket.io
function OrderStatusListener({ orderId }: { orderId: string }) {
  useEffect(() => {
    socket.on(`order-status-update`, (data) => {
      setOrder((prev) => ({
        ...prev,
        status: data.status,
        rider: data.rider,
        otp: data.otp
      }));

      // Show notification
      toast.success(`Order ${data.status}`);
    });

    return () => socket.off(`order-status-update`);
  }, [orderId]);

  return null;
}
```

---

## Phase 4: Testing

### Sandbox Testing Checklist

- [ ] Create depot in sandbox
- [ ] Test rate calculation
- [ ] Test driver availability
- [ ] Create test order
- [ ] Receive webhook callback
- [ ] Update order
- [ ] Cancel order
- [ ] Real-time tracking via WebSocket

### Production Checklist

- [ ] Switch to production URL
- [ ] Use production token
- [ ] Create production depot
- [ ] Load test with sample orders
- [ ] Monitor webhook processing
- [ ] Test error scenarios
- [ ] Setup alerting

---

## Error Handling

```typescript
import { LetaApiError, LetaValidationError, LetaNetworkError } from '@/services/leta';

async function safeLetaCall<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof LetaValidationError) {
      console.error(`Validation Error: ${error.field}`, error.message);
      toast.error(`Invalid ${error.field}`);
    } else if (error instanceof LetaApiError) {
      console.error(`API Error: ${error.code}`, error.message);
      if (error.status === 401) {
        // Token expired
        refreshToken();
      }
      toast.error(`Delivery service error: ${error.message}`);
    } else if (error instanceof LetaNetworkError) {
      console.error('Network Error:', error.originalError);
      toast.error('Network error - please check your connection');
    }
    return fallback;
  }
}
```

---

## Monitoring

Track these metrics:

1. **Order Creation Success Rate**
   - Orders created in GetDeals vs Leta
   - Time to create in Leta

2. **Webhook Delivery**
   - Webhook received count
   - Processing time
   - Retry count

3. **Driver Availability**
   - Average wait time
   - Success rate
   - Peak hours analysis

4. **Delivery Performance**
   - Average delivery time
   - Success vs failed
   - Customer satisfaction

---

## Support & Debugging

**Leta Dashboard:** https://developer.leta.ai  
**API Status:** https://status.leta.ai  
**Support Email:** support@leta.ai

### Common Issues

1. **401 Unauthorized** - Check token validity and headers
2. **No drivers available** - Check search radius and time of day
3. **Webhook not received** - Verify endpoint URL in Leta dashboard
4. **Order not found** - Check reference format (should match exactly)

---

## Next Steps

1. ✅ Setup database schema
2. ✅ Initialize Leta client
3. ✅ Create depot
4. ✅ Implement checkout flow
5. ✅ Add order creation
6. ✅ Setup webhooks
7. ✅ Add tracking UI
8. ✅ Test in sandbox
9. ✅ Deploy to production
10. ✅ Monitor and optimize
