# Delivery API Integration Guide

This guide explains how to integrate the Leta delivery system API endpoints into your Express server.

## File Structure

```
src/
├── routes/
│   └── delivery.routes.ts          # All delivery API endpoints
├── services/
│   └── orderService.ts             # Order-to-Leta integration logic
├── middleware/
│   └── auth.ts                     # Authentication middleware
└── app.ts                          # Main Express app
```

## Setup Instructions

### 1. Install Required Dependencies

```bash
npm install express-router socket.io cors body-parser
# or
bun add express-router socket.io cors body-parser
```

### 2. Import Routes in Your Express App

In your main `app.ts` or `server.ts` file:

```typescript
import express from 'express';
import deliveryRoutes from '@/routes/delivery.routes';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible globally for webhooks
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/delivery', deliveryRoutes);

// Socket.io events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join order tracking room
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`User joined order tracking: ${orderId}`);
  });

  // Leave order tracking room
  socket.on('leave-order', (orderId) => {
    socket.leave(`order-${orderId}`);
    console.log(`User left order tracking: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 3. Authentication Middleware

Create `src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}
```

## API Endpoints

### 1. Get Shipping Cost

**POST** `/api/delivery/shipping-cost`

Calculate delivery fee for a given location.

**Request:**
```json
{
  "latitude": -1.2860273,
  "longitude": 36.8079678
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingCost": 300,
    "currency": "KES",
    "estimatedDeliveryTime": "30-45 minutes"
  }
}
```

### 2. Check Driver Availability

**POST** `/api/delivery/check-availability`

Verify drivers are available for a delivery location.

**Request:**
```json
{
  "latitude": -1.2860273,
  "longitude": 36.8079678
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "driversAvailable": true,
    "metrics": {
      "available_drivers": 12,
      "average_rating": 4.8
    }
  }
}
```

### 3. Create Delivery Order

**POST** `/api/delivery/orders`

Create a delivery order in Leta system after GetDeals checkout.

**Headers:**
```
Authorization: Bearer <user_token>
```

**Request:**
```json
{
  "getdealsOrderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "letaOrder": {
      "id": "leta-order-123",
      "reference": "GD-550e8400",
      "order_status": "pending",
      "tracking_url": "https://tracking.leta.ai/..."
    },
    "trackingUrl": "https://tracking.leta.ai/..."
  }
}
```

### 4. Update Delivery Address

**PUT** `/api/delivery/orders/:orderId/address`

Update delivery address before driver pickup.

**Headers:**
```
Authorization: Bearer <user_token>
```

**Request:**
```json
{
  "deliveryAddress": {
    "name": "New Address",
    "latitude": -1.2950,
    "longitude": 36.7850
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Delivery address updated successfully"
  }
}
```

### 5. Cancel Order

**POST** `/api/delivery/orders/:orderId/cancel`

Cancel a delivery order (before driver pickup).

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Order cancelled successfully"
  }
}
```

### 6. Order Webhook

**POST** `/api/delivery/webhook`

Receives real-time status updates from Leta API.

**Request (from Leta):**
```json
{
  "order_id": "leta-order-123",
  "getdeals_order_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_status": "in_transit",
  "rider": {
    "id": "rider-123",
    "name": "John Doe",
    "phone": "+254712345678",
    "latitude": "-1.2860",
    "longitude": "36.8080",
    "vehicle": "Motorcycle",
    "rating": 4.8
  },
  "delivery_otp": "1234",
  "event_timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Webhook processed successfully"
  }
}
```

### 7. Get Order Tracking

**GET** `/api/delivery/orders/:orderId/tracking`

Get current tracking information for an order.

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_reference": "GD-1705320600000ABC",
    "status": "in_transit",
    "leta_status": "in_transit",
    "rider_info": {
      "id": "rider-123",
      "name": "John Doe",
      "phone": "+254712345678",
      "latitude": -1.2860,
      "longitude": 36.8080,
      "vehicle": "Motorcycle",
      "rating": 4.8
    },
    "delivery_otp": "1234",
    "delivery_address": {
      "name": "Home",
      "latitude": -1.2950,
      "longitude": 36.7850
    }
  }
}
```

### 8. Get User Orders

**GET** `/api/delivery/orders/user/:userId`

Get all orders for a user.

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "order_reference": "GD-1705320600000ABC",
        "status": "delivered",
        "leta_status": "delivered",
        "total_amount": 5000,
        "created_at": "2024-01-15T08:00:00Z"
      }
    ],
    "total": 1
  }
}
```

## Frontend Integration

### Using Frontend Service Layer

In your React components, use the `orderService` functions:

```typescript
import { 
  getShippingCost, 
  checkDriverAvailability, 
  createLetaOrder 
} from '@/services/orderService';

// Check shipping cost
const cost = await getShippingCost(latitude, longitude);

// Check driver availability
const available = await checkDriverAvailability(latitude, longitude);

// Create order
const letaOrder = await createLetaOrder(getdealsOrder);
```

### Socket.io Real-time Updates

In your OrderTracking component:

```typescript
import { io } from 'socket.io-client';

useEffect(() => {
  const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
  
  socket.emit('join-order', orderId);
  
  socket.on('order-status-update', (data) => {
    setOrder(prev => ({
      ...prev,
      leta_status: data.status,
      rider_info: data.rider
    }));
  });
  
  return () => {
    socket.emit('leave-order', orderId);
    socket.disconnect();
  };
}, [orderId]);
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

Common error codes:
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid token)
- `404` - Not Found (order/user doesn't exist)
- `500` - Server Error (service failure)

## Testing Endpoints

### Using cURL

```bash
# Check shipping cost
curl -X POST http://localhost:3001/api/delivery/shipping-cost \
  -H "Content-Type: application/json" \
  -d '{"latitude": -1.2860273, "longitude": 36.8079678}'

# Check driver availability
curl -X POST http://localhost:3001/api/delivery/check-availability \
  -H "Content-Type: application/json" \
  -d '{"latitude": -1.2860273, "longitude": 36.8079678}'

# Create order
curl -X POST http://localhost:3001/api/delivery/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"getdealsOrderId": "order-id-here"}'
```

### Using Postman

1. Create a new collection "GetDeals Delivery API"
2. Add requests for each endpoint
3. Set variables for `BASE_URL` and `TOKEN`
4. Configure body as JSON

## Environment Variables

Add these to your `.env` file:

```
# Leta API
VITE_LETA_API_URL=https://sandbox.integrations.leta.ai
VITE_LETA_TOKEN=your_beta_token_here

# Server
PORT=3001
VITE_API_URL=http://localhost:3001

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Frontend
VITE_FRONTEND_URL=http://localhost:5173
```

## Deployment Checklist

- [ ] Verify environment variables set in production
- [ ] Enable CORS for frontend domain
- [ ] Setup webhook authentication (signature verification)
- [ ] Configure SSL/TLS for HTTPS
- [ ] Setup database migrations (add_leta_columns.sql)
- [ ] Test all endpoints in staging
- [ ] Monitor webhook logs for failures
- [ ] Setup error logging (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Setup load balancing for multiple servers

## Support

For issues with Leta API integration:
- Email: integration@leta.ai
- Docs: https://docs.leta.ai
- Support: https://leta.ai/support

For GetDeals integration issues:
- Email: support@getdeals.co.ke
- Repository: This project
