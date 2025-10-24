# Leta Delivery Management API Integration Guide

## Overview

This guide provides step-by-step integration of the Leta delivery management system into GetDeals Kenya. Orders created on GetDeals can be injected into Leta's cloud platform and managed through connected drivers for real-time delivery.

## 🎯 Integration Goals

- ✅ Create orders in Leta from GetDeals checkout
- ✅ Update orders (change delivery address, customer info)
- ✅ Cancel orders
- ✅ Manage depots (store/outlet locations)
- ✅ Calculate shipping rates
- ✅ Check driver availability
- ✅ Track orders in real-time (WebSocket)
- ✅ Handle webhook callbacks for order status updates

## 🔑 Authentication

**Header Required:**
```
Authorization: Bearer <your_token>
```

**Environments:**
- Sandbox: `https://sandbox.integrations.leta.ai`
- Production: `https://integrations.leta.ai`

**Setup:**
1. Get your token from Leta developer dashboard
2. Store in `.env` as `VITE_LETA_TOKEN` (frontend) and `LETA_API_TOKEN` (backend)
3. Store base URL as `VITE_LETA_API_URL`

## 📋 Database Schema

### Orders Table Extensions
```sql
-- Add to existing orders table
ALTER TABLE orders ADD COLUMN (
  leta_order_id VARCHAR(255),
  leta_reference VARCHAR(255) UNIQUE,
  leta_status VARCHAR(50),
  leta_tracking_url TEXT,
  delivery_otp VARCHAR(10),
  rider_id VARCHAR(255),
  rider_name VARCHAR(255),
  rider_phone VARCHAR(20),
  rider_latitude FLOAT,
  rider_longitude FLOAT,
  last_location_update TIMESTAMP,
  special_instruction TEXT,
  cargo_description TEXT
);
```

### Depots Table
```sql
CREATE TABLE depots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  location_name TEXT,
  pickup_geofence_type VARCHAR(20),
  pickup_geofence_radius INT,
  dropoff_geofence_type VARCHAR(20),
  dropoff_geofence_radius INT,
  order_wait_time INT,
  max_orders INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Webhooks Log Table
```sql
CREATE TABLE leta_webhook_logs (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255),
  event_type VARCHAR(50),
  status VARCHAR(50),
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 API Endpoints Implementation

### Backend Endpoints to Create

1. **POST** `/api/orders/create-with-leta`
   - Creates order in GetDeals & Leta simultaneously
   
2. **PUT** `/api/orders/:id/update-leta`
   - Updates order in Leta
   
3. **POST** `/api/orders/:id/cancel-leta`
   - Cancels order in Leta
   
4. **POST** `/api/depots/create`
   - Creates new depot in Leta
   
5. **PUT** `/api/depots/:code/update`
   - Updates depot in Leta
   
6. **POST** `/api/shipping/calculate-rate`
   - Gets shipping rate from Leta
   
7. **POST** `/api/drivers/check-availability`
   - Checks driver availability
   
8. **POST** `/api/leta/webhook`
   - Receives webhook callbacks from Leta
   
9. **GET** `/api/orders/:id/track`
   - Gets real-time order tracking (WebSocket fallback)

## 📦 Key Data Requirements

### For Order Creation
```javascript
{
  customer: {
    phone_number: "+254728322355",
    email: "customer@example.com",
    name: "John Doe"
  },
  reference: "GD-ORDER-12345",          // Unique GetDeals order ID
  special_instruction: "Handle with care",
  cargo_description: "Grocery basket items",
  dropoff: {
    name: "Customer Home",
    latitude: "-1.2860273",
    longitude: "36.8079678"
  },
  pickup: {                              // OR use depot_code instead
    name: "GetDeals Depot",
    latitude: "-1.2860273",
    longitude: "36.8079678"
  },
  payment_method: "postpaid",           // or "prepaid"
  depot_code: "getdeals-nairobi",       // Alternative to pickup object
  products: [
    {
      code: "BASKET-001",
      quantity: 1,
      price: 2500.00
    }
  ]
}
```

### For Depot Creation
```javascript
{
  name: "GetDeals Nairobi Hub",
  code: "getdeals-nairobi",
  location: {
    latitude: -1.2860273,
    longitude: 36.8079678,
    name: "GetDeals Warehouse, Nairobi"
  },
  pickup_geofence_type: "soft",
  pickup_geofence_radius: 500,
  dropoff_geofence_type: "soft",
  dropoff_geofence_radius: 500,
  order_wait_time: 15,
  max_orders: 50
}
```

## 🔔 Webhook Status Codes

| Status | Meaning |
|--------|---------|
| `pending` | Order created, awaiting driver |
| `assigned` | Driver assigned to order |
| `accepted` | Driver accepted the order |
| `arrived_at_store` | Driver arrived at pickup |
| `pickup` | Items picked up |
| `arrived_at_destination` | Driver arrived at dropoff |
| `delivered` | Order successfully delivered |
| `cancelled` | Order cancelled |
| `failed` | Delivery failed |

## 🌐 WebSocket Real-time Tracking

**Connection URL:**
```
wss://sandbox.integrations.leta.ai/ws/orders/{order_slug}
```

**Response Sample:**
```json
{
  "latitude": -1.2860273,
  "longitude": 36.8079678,
  "accuracy": 10,
  "timestamp": "2025-10-23T14:30:00Z",
  "status": "in_transit"
}
```

## 🛠️ Implementation Flow

### 1. During Checkout
- User selects delivery method
- Call `/api/shipping/calculate-rate` to get price
- Check driver availability with `/api/drivers/check-availability`

### 2. After Order Confirmation
- Create order in GetDeals database
- Call `/api/orders/create-with-leta` to inject into Leta
- Get back `leta_reference` and `tracking_url`
- Store in database and display to user

### 3. Real-time Updates
- Connect WebSocket to track driver location
- Listen for webhooks on `/api/leta/webhook`
- Update order status in GetDeals database
- Emit events to frontend via Socket.io/real-time service

### 4. Order Management
- Allow users to cancel orders (before pickup)
- Update delivery address if needed
- Provide driver contact and OTP to customer

## ⚠️ Error Handling

**Common Errors:**
- `401 Unauthorized` - Invalid/expired token
- `400 Bad Request` - Invalid payload format
- `404 Not Found` - Order/depot doesn't exist
- `429 Too Many Requests` - Rate limit exceeded

**Implementation:**
- Implement exponential backoff for retries
- Log all failures to database
- Notify admin on repeated failures
- Validate all payloads before sending

## 🔒 Security Considerations

1. **Token Management**
   - Store tokens in environment variables
   - Rotate regularly
   - Never log or expose in client code

2. **Webhook Verification**
   - Verify webhook origin
   - Implement request signature validation
   - Use HTTPS only

3. **Data Protection**
   - Encrypt sensitive fields (phone, email, address)
   - Use HTTPS for all API calls
   - Implement rate limiting

4. **Idempotency**
   - Use unique `reference` for orders
   - Check if order exists before creating
   - Implement idempotency keys

## 📊 Monitoring & Logging

Track:
- API request/response times
- Success/failure rates
- Webhook delivery success
- Driver availability metrics
- Order delivery times

## 🚀 Deployment Checklist

- [ ] Setup database tables
- [ ] Create backend service layer
- [ ] Implement all 9 endpoints
- [ ] Add webhook handler
- [ ] Setup WebSocket connection
- [ ] Test in sandbox environment
- [ ] Load test with sample data
- [ ] Setup monitoring/alerting
- [ ] Document API endpoints
- [ ] Train support team
- [ ] Migration plan for existing orders
- [ ] Switch to production domain
- [ ] Monitor production closely

## 📚 File Structure

```
src/
├── services/
│   └── leta/
│       ├── index.ts              # Main service exports
│       ├── client.ts             # API client setup
│       ├── orders.ts             # Order operations
│       ├── depots.ts             # Depot operations
│       ├── rates.ts              # Rate calculation
│       ├── drivers.ts            # Driver availability
│       └── tracking.ts           # WebSocket tracking
├── routes/
│   └── leta.ts                   # API endpoints
├── controllers/
│   └── leta.controller.ts        # Request handlers
├── models/
│   └── leta.model.ts             # Database models
└── types/
    └── leta.types.ts             # TypeScript interfaces
```

## 🔗 Reference Links

- Leta API Docs: https://docs.leta.ai
- Developer Dashboard: https://developer.leta.ai
- Support Email: support@leta.ai
- Status Page: https://status.leta.ai

---

**Version:** 1.0  
**Last Updated:** October 23, 2025  
**Status:** Implementation Ready
