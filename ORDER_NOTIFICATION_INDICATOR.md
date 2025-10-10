# Order Notification Indicator

## Overview
This feature provides a visual alert system in the admin dashboard to notify administrators when new orders are received. The indicator appears on the "Manage Orders" button in the Quick Actions section.

## Features

### 1. **Visual Indicators**
When new orders are detected:
- 🔴 **Pulsing Glow Effect**: The "Manage Orders" button pulses with an orange glow
- 🎯 **Ring Effect**: Orange ring (2px) with offset around the button
- 🟠 **Background Highlight**: Orange background (bg-orange-50) with hover effect
- 📍 **Badge**: Displays the count of new orders (e.g., "3 New")
- ⚡ **Ping Animation**: Animated ping indicator in the top-right corner

### 2. **Smart Acknowledgment**
- Orders are automatically marked as "viewed" when the admin visits the `/admin/orders` page
- The notification state persists across browser sessions using localStorage
- Timestamp-based tracking ensures only truly new orders trigger the notification

### 3. **Visual Example**
```
Normal State:
┌──────────────────────┐
│   Manage Orders      │
└──────────────────────┘

With New Orders:
┌──────────────────────┐ ⚡ (ping animation)
│ Manage Orders  [3 New]│ 
└──────────────────────┘
  (pulsing orange glow)
```

## Technical Implementation

### Files Created/Modified

#### 1. **OrderNotificationContext.tsx** (New)
Context provider that manages notification state:
- Tracks the last time orders were viewed (localStorage: `getdeals_last_viewed_orders`)
- Compares order timestamps against last viewed timestamp
- Provides `hasNewOrders`, `newOrdersCount`, and `acknowledgeOrders()` to consuming components

```typescript
interface OrderNotificationContextValue {
  hasNewOrders: boolean;
  newOrdersCount: number;
  acknowledgeOrders: () => void;
}
```

#### 2. **App.tsx** (Modified)
- Added `OrderNotificationProvider` wrapper around the app
- Placed after `OrdersProvider` to ensure order data is available

#### 3. **AdminDashboard.tsx** (Modified)
- Imported `useOrderNotification` hook
- Added conditional styling to "Manage Orders" button:
  - `animate-pulse`: Pulsing animation
  - `ring-2 ring-orange-400 ring-offset-2`: Orange ring effect
  - `bg-orange-50 hover:bg-orange-100`: Orange background
  - `border-orange-400`: Orange border
- Added badge showing new order count
- Added animated ping indicator element

#### 4. **AdminOrders.tsx** (Modified)
- Added `useEffect` hook that calls `acknowledgeOrders()` when the page mounts
- This resets the notification state when admin views the orders page

## How It Works

### Order Flow
```
1. Customer places order
   ↓
2. Order saved in OrdersContext with timestamp
   ↓
3. OrderNotificationContext detects order timestamp > last viewed timestamp
   ↓
4. hasNewOrders = true, newOrdersCount increments
   ↓
5. AdminDashboard displays glowing "Manage Orders" button
   ↓
6. Admin clicks button and navigates to /admin/orders
   ↓
7. AdminOrders page calls acknowledgeOrders()
   ↓
8. Last viewed timestamp updated to current time
   ↓
9. hasNewOrders = false, glow disappears
```

### Persistence
- **localStorage Key**: `getdeals_last_viewed_orders`
- **Storage Format**: Unix timestamp (milliseconds since epoch)
- **Purpose**: Ensures notification state persists across:
  - Page refreshes
  - Browser restarts
  - Tab closures

## Styling Details

### Tailwind Classes Used
```tsx
// Button with new orders
className="animate-pulse ring-2 ring-orange-400 ring-offset-2 bg-orange-50 hover:bg-orange-100 border-orange-400"

// Badge
className="ml-2 bg-orange-500 hover:bg-orange-600 text-white"

// Ping animation (outer)
className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"

// Ping animation (inner)
className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"
```

### Color Scheme
- **Primary Alert Color**: Orange (#f97316 and variants)
- **Rationale**: Orange provides good visibility without being as alarming as red
- **Accessibility**: High contrast against white/gray backgrounds

## Usage

### For Administrators
1. Monitor the admin dashboard for the glowing "Manage Orders" button
2. When you see the glow and badge (e.g., "5 New"), new orders have arrived
3. Click the button to view orders
4. The notification automatically resets when you view the orders page

### For Developers
```typescript
// In any component within OrderNotificationProvider
import { useOrderNotification } from "@/contexts/OrderNotificationContext";

function MyComponent() {
  const { hasNewOrders, newOrdersCount, acknowledgeOrders } = useOrderNotification();
  
  return (
    <div>
      {hasNewOrders && <span>You have {newOrdersCount} new orders!</span>}
      <button onClick={acknowledgeOrders}>Mark as viewed</button>
    </div>
  );
}
```

## Future Enhancements

### Potential Additions
1. **Sound Notifications**: Play a sound when new orders arrive
2. **Desktop Notifications**: Browser notification API integration
3. **Multiple Notification Types**: Extend to wallet deposits, new users, etc.
4. **Notification History**: Keep a log of all notifications
5. **Settings Panel**: Allow admins to configure notification preferences
6. **Real-time Updates**: WebSocket integration for instant notifications
7. **Mobile Responsive**: Optimize notification display for mobile devices

## Browser Compatibility
- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Opera (76+)

## Performance Considerations
- Lightweight context (~100 lines of code)
- Minimal re-renders (uses useMemo and useCallback)
- localStorage operations are fast and synchronous
- No network requests required for notification logic

## Testing

### Manual Testing Steps
1. Open admin dashboard in one tab
2. Place an order in another tab (as a customer)
3. Return to admin dashboard
4. Verify "Manage Orders" button is glowing with badge
5. Click "Manage Orders"
6. Verify glow disappears

### Edge Cases Covered
- ✅ No orders yet (graceful handling)
- ✅ localStorage unavailable (fallback to current timestamp)
- ✅ Invalid timestamp in storage (uses current timestamp)
- ✅ Multiple new orders (shows correct count)
- ✅ Rapid order creation (debounced updates)

## Troubleshooting

### Notification not appearing
1. Check browser console for errors
2. Verify OrderNotificationProvider is wrapping the app
3. Confirm orders are being created with valid timestamps
4. Clear localStorage and refresh

### Notification not disappearing
1. Verify AdminOrders page is calling `acknowledgeOrders()`
2. Check localStorage key `getdeals_last_viewed_orders` is being updated
3. Ensure useEffect dependency array includes `acknowledgeOrders`

### Performance issues
1. Check if multiple instances of provider exist
2. Verify memo/callback hooks are properly configured
3. Monitor localStorage operations in DevTools

## License
This feature is part of the GetDeals Kenya platform.

---

**Branch**: `feature/order-notification-indicator`
**Author**: GitHub Copilot
**Date**: October 10, 2025
