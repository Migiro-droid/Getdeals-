# Leta Integration Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GETDEALS KENYA + LETA INTEGRATION                    │
│                         Real-Time Tracking & Webhooks                        │
└─────────────────────────────────────────────────────────────────────────────┘


┌──────────────────┐
│   CUSTOMER       │
│   Places Order   │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GETDEALS APPLICATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   Frontend   │         │   Backend    │         │   Database   │        │
│  │              │         │              │         │              │        │
│  │ - Checkout   │─────────▶  API Routes  │─────────▶  Supabase    │        │
│  │ - Tracking   │         │              │         │   (orders)   │        │
│  │ - Progress   │         │ /api/orders/ │         │              │        │
│  └──────────────┘         │    create    │         └──────────────┘        │
│                           └──────┬───────┘                                  │
│                                  │                                          │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
                                   │ POST /orders/create
                                   │ (order details, pickup, delivery)
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LETA API                                        │
│                   https://integrations.leta.ai                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │  Order Processing System                                   │             │
│  │  - Creates order with reference (LETA-123456)              │             │
│  │  - Assigns driver (auto or manual)                         │             │
│  │  - Tracks driver location                                  │             │
│  │  - Manages order lifecycle                                 │             │
│  └───────┬──────────────────────────────────────────────┬─────┘             │
│          │                                              │                   │
│          │ Webhooks (Status Changes)                    │ WebSocket         │
│          │                                              │ (Real-time)       │
└──────────┼──────────────────────────────────────────────┼───────────────────┘
           │                                              │
           │                                              │
           ▼                                              ▼
    ┌─────────────────┐                          ┌─────────────────┐
    │   WEBHOOK       │                          │   WEBSOCKET     │
    │   ENDPOINT      │                          │   CONNECTION    │
    └─────────────────┘                          └─────────────────┘
           │                                              │
           │ POST                                         │ wss://
           │ /api/webhooks/leta                           │ /ws/orders/{id}
           │                                              │
           ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GETDEALS APPLICATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Webhook Handler (api/webhooks/leta.ts)                      │           │
│  │  ───────────────────────────────────────────────────────────│           │
│  │  1. Receives status update from Leta                        │           │
│  │  2. Finds order by leta_order_id                            │           │
│  │  3. Updates order record:                                   │           │
│  │     - status (pending → assigned → in_transit → delivered)  │           │
│  │     - rider info (name, phone, location)                    │           │
│  │     - timestamps (pickup_at, delivered_at)                  │           │
│  │  4. Logs webhook to leta_webhook_logs                       │           │
│  │  5. Sends email notification                                │           │
│  │  6. Returns 200 OK                                          │           │
│  └──────────────────┬───────────────────────────────────────────┘           │
│                     │                                                        │
│                     ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │         Database Update (Supabase)                         │             │
│  │  ───────────────────────────────────────────────────────  │             │
│  │  orders table:                                             │             │
│  │    - status = 'assigned'                                   │             │
│  │    - leta_status = 'assigned'                              │             │
│  │    - rider_name = 'John Doe'                               │             │
│  │    - rider_phone = '+254712345678'                         │             │
│  │    - rider_latitude = -1.2921                              │             │
│  │    - rider_longitude = 36.8219                             │             │
│  │                                                            │             │
│  │  leta_webhook_logs table:                                  │             │
│  │    - order_id, status, payload, processed = true           │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  WebSocket Service (src/services/leta/tracking.ts)          │           │
│  │  ────────────────────────────────────────────────────────── │           │
│  │  1. Connects to wss://sandbox.integrations.leta.ai          │           │
│  │  2. Receives location updates every few seconds:            │           │
│  │     { latitude: -1.9450453, longitude: 39.045854 }          │           │
│  │  3. Updates UI with rider position                          │           │
│  │  4. Auto-reconnects on disconnect                           │           │
│  │  5. Handles errors (404, 400, network)                      │           │
│  └──────────────────┬───────────────────────────────────────────┘           │
│                     │                                                        │
│                     ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │         Frontend UI Components                             │             │
│  │  ───────────────────────────────────────────────────────  │             │
│  │                                                            │             │
│  │  OrderTracking.tsx:                                        │             │
│  │    ├─ Interactive map with rider marker                   │             │
│  │    ├─ Real-time location updates                          │             │
│  │    ├─ Rider info card (photo, name, phone)                │             │
│  │    ├─ ETA and status display                              │             │
│  │    └─ Delivery OTP                                        │             │
│  │                                                            │             │
│  │  DeliveryProgressBar.tsx:                                  │             │
│  │    ├─ 6-stage progress bar                                │             │
│  │    ├─ Animated scooter rider                              │             │
│  │    ├─ Status-specific colors                              │             │
│  │    ├─ Rider contact buttons                               │             │
│  │    └─ Auto-refresh every 30s                              │             │
│  │                                                            │             │
│  │  AccountPage.tsx (Orders Tab):                             │             │
│  │    ├─ Order list with status badges                       │             │
│  │    ├─ DeliveryProgressBar integration                     │             │
│  │    └─ Real-time status updates                            │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────┐
    │    CUSTOMER     │
    │ Sees Real-Time  │
    │ Delivery Status │
    └─────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           ORDER STATUS FLOW
═══════════════════════════════════════════════════════════════════════════════

1. PENDING          2. ASSIGNED         3. PICKUP           4. IN_TRANSIT
   Order created →     Driver assigned →   Driver picked up →  On the way
   
   [Webhook]          [Webhook]           [Webhook]           [WebSocket]
   ├─ Status update   ├─ Rider info       ├─ Pickup time      ├─ Location: (-1.234, 36.123)
   └─ No rider yet    ├─ Name: John Doe   └─ Status change    ├─ Location: (-1.235, 36.124)
                      ├─ Phone: +254...                       ├─ Location: (-1.236, 36.125)
                      └─ Location                             └─ ... (continuous updates)


5. ARRIVING         6. DELIVERED        7. EMAIL SENT
   Near destination →  Delivery complete →  Customer notified
   
   [Webhook]          [Webhook]           [Email Service]
   ├─ Status update   ├─ Delivery time    ├─ Subject: "Your order has been delivered!"
   └─ ETA: 2 mins     ├─ OTP code         ├─ Order #: GD-00001
                      └─ Final location   └─ Delivered at: 12:30 PM


═══════════════════════════════════════════════════════════════════════════════
                       DATA FLOW SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Webhooks (Status Changes):
───────────────────────────
  Leta → GetDeals Webhook Endpoint → Database Update → UI Refresh
  
  Triggers:
  - Order created (pending)
  - Driver assigned (assigned)
  - Picked up (pickup)
  - Arrived (arrived_at_destination)
  - Delivered (delivered)
  - Cancelled/Failed (cancelled/failed)

WebSockets (Real-Time Location):
─────────────────────────────────
  Leta WebSocket → Frontend Service → UI Map Update
  
  Updates:
  - Rider latitude/longitude every few seconds
  - Continuous during in_transit status
  - Auto-disconnect on final state (delivered/cancelled)


═══════════════════════════════════════════════════════════════════════════════
                       CONFIGURATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

✅ 1. Environment Variables
     - VITE_LETA_API_URL=https://integrations.leta.ai
     - VITE_LETA_TOKEN=9ad8af7c3ea3674aee27c3ea8e59928606852820

✅ 2. Database Schema
     - orders table with Leta fields
     - leta_webhook_logs table for audit

✅ 3. API Endpoints
     - POST /api/orders/create → Creates order in Leta
     - POST /api/webhooks/leta → Receives status updates
     - GET /api/orders/:id/tracking → Fetches order status

✅ 4. Frontend Components
     - DeliveryProgressBar.tsx → Progress visualization
     - OrderTracking.tsx → Real-time tracking page
     - LetaTrackingService → WebSocket management

✅ 5. Leta Client
     - Initialized on app startup (App.tsx)
     - Driver availability working
     - Order creation working

⚠️  6. Leta Dashboard (ACTION REQUIRED)
     - Webhook URL: https://getdeals.co.ke/api/webhooks/leta
     - Enable all status events
     - Verify webhook configuration


═══════════════════════════════════════════════════════════════════════════════
                       MONITORING & DEBUGGING
═══════════════════════════════════════════════════════════════════════════════

Browser Console:
────────────────
  [App] ✅ Leta client initialized successfully
  WebSocket connected
  📍 Location update: { lat: -1.9450453, lng: 39.045854 }

Server Logs:
────────────
  🔔 LETA WEBHOOK RECEIVED:
  Order ID: LETA-123456
  Status: assigned
  ✅ Order updated successfully

Database Queries:
─────────────────
  -- Check webhooks received
  SELECT * FROM leta_webhook_logs ORDER BY created_at DESC LIMIT 10;
  
  -- Check order updates
  SELECT order_reference, status, leta_status, rider_name 
  FROM orders WHERE leta_order_id IS NOT NULL;


═══════════════════════════════════════════════════════════════════════════════
```

---

## Key Takeaways

### ✅ What's Working

1. **Order Creation** → Leta API integration active
2. **Webhook Endpoint** → Ready to receive status updates
3. **WebSocket Service** → Real-time location tracking implemented
4. **UI Components** → Progress bar and tracking page ready
5. **Database** → Schema configured for all Leta data
6. **Email Notifications** → Triggered on delivery/failure

### ⚠️ What's Needed

1. **Configure webhook URL in Leta dashboard** (5 minutes)
2. **Test with real order** to verify end-to-end flow

### 🎯 Next Steps

1. Go to Leta developer dashboard
2. Add webhook URL: `https://getdeals.co.ke/api/webhooks/leta`
3. Enable all status events
4. Create test order
5. Watch real-time tracking in action!

---

**Your system is READY. Just flip the switch in Leta's dashboard!** 🚀
