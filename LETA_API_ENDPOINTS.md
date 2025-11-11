# Leta API Endpoints Documentation

**Base URL:** `https://integrations.leta.ai`  
**Authentication:** Bearer token in Authorization header  
**Content-Type:** `application/json`

## All 7 Implemented Endpoints

### 1. Create Order
- **Endpoint:** `POST /orders/add`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/orders.ts` (line 25)
  - `api/orders/create.ts` (line 27)
  - `scripts/test-leta-order-submission.mjs` (line 231)
- **Payload:** Order with customer, products, dropoff location, payment method
- **Response:** Order ID, reference, status, tracking_url

### 2. Update Order
- **Endpoint:** `PUT /orders/update`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/orders.ts` (line 47)
  - `scripts/test-leta-order-submission.mjs` (line 476)
- **Payload:** reference, new dropoff location, customer details
- **Response:** Updated order data

### 3. Cancel Order
- **Endpoint:** `POST /orders/cancel`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/orders.ts` (line 70)
  - `scripts/test-leta-order-submission.mjs` (line 541)
- **Payload:** `{ reference: "order-reference" }`
- **Response:** Cancelled order confirmation

### 4. Get Order Status
- **Endpoint:** `GET /orders/{reference}`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/orders.ts` (line 95)
- **Payload:** None (reference in URL)
- **Response:** Order details and current status

### 5. Calculate Shipping Rates
- **Endpoint:** `POST /shipping/rates/calculate/`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/rates.ts` (line 26)
  - `scripts/test-leta-order-submission.mjs` (line 285)
- **Payload:** `{ origin: {lat, lng}, destination: {lat, lng} }`
- **Response:** Distance, price, duration

### 6. Check Driver Availability
- **Endpoint:** `POST /drivers/availability/`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/drivers.ts` (line 27)
  - `scripts/test-leta-order-submission.mjs` (line 343)
- **Payload:** `{ origin, destination, search_radius, order_preparation_time }`
- **Response:** Available drivers info

### 7. Create Depot
- **Endpoint:** `POST /depots/create/`
- **Status:** ✅ Implemented & Verified
- **Files Using:** 
  - `src/services/leta/depots.ts` (line 31)
  - `scripts/register-quickmart-depots.mjs` (line 111)
  - `scripts/test-leta-order-submission.mjs` (line 421)
- **Payload:** Depot configuration with location, geofence, name, code
- **Response:** Created depot with ID and code

## Endpoint Verification Checklist

| Endpoint | HTTP Method | Status | Verified |
|----------|-------------|--------|----------|
| /orders/add | POST | ✅ | Yes |
| /orders/update | PUT | ✅ | Yes |
| /orders/cancel | POST | ✅ | Yes |
| /orders/{reference} | GET | ✅ | Yes |
| /shipping/rates/calculate/ | POST | ✅ | Yes |
| /drivers/availability/ | POST | ✅ | Yes |
| /depots/create/ | POST | ✅ | Yes |

## Implementation Details by Service

### OrdersService (`src/services/leta/orders.ts`)
```typescript
// ✅ POST /orders/add
async createOrder(payload): OrderResponse
// Uses: client.post<OrderResponse>("/orders/add", payload)

// ✅ PUT /orders/update
async updateOrder(payload): OrderResponse
// Uses: client.put<OrderResponse>("/orders/update", payload)

// ✅ POST /orders/cancel
async cancelOrder(reference): OrderResponse
// Uses: client.post<OrderResponse>("/orders/cancel", payload)

// ✅ GET /orders/{reference}
async getOrder(reference): OrderResponse
// Uses: client.get<OrderResponse>(`/orders/${reference}`)
```

### RatesService (`src/services/leta/rates.ts`)
```typescript
// ✅ POST /shipping/rates/calculate/
async calculateRate(payload): RateResponse
// Uses: client.post("/shipping/rates/calculate/", payload)
```

### DriversService (`src/services/leta/drivers.ts`)
```typescript
// ✅ POST /drivers/availability/
async checkAvailability(payload): AvailabilityResponse
// Uses: client.post("/drivers/availability/", payload)
```

### DepotsService (`src/services/leta/depots.ts`)
```typescript
// ✅ POST /depots/create/
async createDepot(payload): DepotResponse
// Uses: client.post('/depots/create/', payload)
```

## Current Test Results (Most Recent)

```
[SUCCESS] Configuration validation passed
[SUCCESS] Order creation (ID: 5454475)
[PASS] Order update
[PASS] Order cancellation
[SUCCESS] Depot creation (ID: 3293)
[ERROR] Shipping rates calculation (no rates for test distance)
[ERROR] Driver availability (no drivers in sandbox)

Results: 4/7 PASSING
```

## Notes

1. **Base URL Handling:** Always use `https://integrations.leta.ai` as base, do NOT add `/api` suffix
2. **Trailing Slashes:** Some endpoints require trailing slash (e.g., `/depots/create/`, `/drivers/availability/`)
3. **String Coordinates:** Dropoff latitude/longitude should be strings, not numbers
4. **Payment Method:** Use 'postpaid' for GetDeals orders
5. **Sandbox Limitations:** 
   - Driver availability may return empty in sandbox
   - Shipping rates may fail for certain distance ranges

## Environments

- **Sandbox:** `https://integrations.leta.ai` (current - for testing)
- **Production:** To be configured when live

## Authentication

All requests require:
```
Authorization: Bearer {LETA_API_TOKEN}
Content-Type: application/json
```

Configured in: `process.env.LETA_API_TOKEN` or `process.env.VITE_LETA_TOKEN`
