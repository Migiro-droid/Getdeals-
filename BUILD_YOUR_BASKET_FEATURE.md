# 🧺 Build Your Basket - Interactive Membership Experience

## Overview

The "Build Your Basket" feature transforms the traditional static membership page into an engaging, quiz-like journey that collects user preferences to power personalized shopping experiences on GetDeals.

## 🎯 Key Features

### 1. **Interactive 5-Step Journey**
- **Step 1: Shopping Habits** - How often users shop (Weekly, Monthly, Seasonal, etc.)
- **Step 2: Your Interests** - Favorite product categories
- **Step 3: When You Shop** - Spending patterns (End-Month, Mid-Month, Weekend, Anytime)
- **Step 4: Your Budget** - Income range for targeted offers
- **Step 5: Location & More** - County, town, occupation, and how they found us

### 2. **Gamification Elements**
- Progress bar showing completion percentage
- Animated step indicators with icons
- Color-coded sections (Emerald, Rose, Violet, Amber, Blue)
- Interactive card-based selections
- Real-time visual feedback on selections

### 3. **Personalization Engine**
The collected data powers:
- Personalized product recommendations
- Custom basket suggestions based on lifestyle
- Timed deals aligned with spending patterns
- Location-specific offers
- Category-filtered homepage views

## 📍 Routes

- **Primary**: `/build-your-basket`
- **Alias**: `/membership` (for backward compatibility)

Both routes render the same interactive experience.

## 🎨 Design Philosophy

### Visual Design
- **Gradient backgrounds**: Emerald-50 → Blue-50 → Purple-50
- **Step colors**: Each step has a unique brand color
- **Card-based UI**: Large, tappable selection cards
- **Smooth animations**: Fade-in transitions between steps
- **Progress indicators**: Visual feedback at every stage

### UX Principles
- **Conversational tone**: Friendly, localized copy with Swahili hints
- **Multi-select flexibility**: Users can choose multiple options where relevant
- **Validation**: Can't proceed without completing required fields
- **Clear CTAs**: "Next →", "Back", "Finish & Unlock Offers"

## 💾 Data Storage

### Current Implementation (Phase 1)
Data is stored in **localStorage** for immediate functionality:
```javascript
{
  userId: string,
  preferences: {
    shoppingFrequency: string[],
    categories: string[],
    spendingPattern: string,
    incomeRange: string,
    county: string,
    town: string,
    estate: string,
    occupation: string,
    sourceAwareness: string
  },
  timestamp: string
}
```

### Future Implementation (Phase 2)
Migration to Supabase database with the `user_basket_preferences` table.

**Migration file ready**: `create-basket-preferences-table.sql`

## 🔧 Technical Implementation

### Frontend Components
**File**: `/src/pages/BuildYourBasket.tsx`

Key features:
- React functional component with hooks
- Step-based state management
- Form validation logic
- localStorage integration
- Toast notifications for user feedback
- Responsive grid layouts

### Backend API (Ready for Migration)
**File**: `/src/lib/basketPreferences.ts`

Functions:
- `saveUserBasketPreferences()` - Save/update user preferences
- `getUserBasketPreferences()` - Fetch user preferences
- `getPersonalizedRecommendations()` - Get products based on preferences
- `getTimedDeals()` - Get deals based on spending patterns

### Database Schema
**File**: `create-basket-preferences-table.sql`

Features:
- UUID primary keys
- Foreign key to `auth.users`
- Array columns for multi-select data
- Timestamps with auto-update trigger
- Row Level Security (RLS) policies
- Indexes for performance
- Admin read access

## 📊 Data Collection Fields

| Field | Type | Options/Format |
|-------|------|---------------|
| Shopping Frequency | Multi-select | Weekly, Monthly, Seasonal, Festive, Emergency, Bulk |
| Categories | Multi-select | Essentials, Appliances, Electronics, Fashion, Back-to-School, Baby & Kids |
| Spending Pattern | Single-select | End-Month, Mid-Month, Weekend, Anytime |
| Income Range | Single-select | <20K, 20K-50K, 50K-100K, 100K+ |
| County | Dropdown | Nairobi, Mombasa, Kisumu, Nakuru, Kiambu, Other |
| Town | Free text | User's town/area |
| Occupation | Free text | User's profession |
| Source Awareness | Dropdown | Work, Church, Social Media, Referral, Billboard, Other |

## 🚀 Personalization Use Cases

### 1. **Timed Deals Engine**
```javascript
// Example: End-month shoppers see deals from 25th onwards
if (spendingPattern === 'end-month' && dayOfMonth >= 25) {
  showSpecialDeals();
}
```

### 2. **Category Filtering**
```javascript
// Show products from user's preferred categories
products.filter(p => userPreferences.categories.includes(p.category));
```

### 3. **Custom Basket Suggestions**
- "Teacher's Monthly Essentials" basket for teachers
- "Weekend Warrior Bundle" for weekend shoppers
- "Family Essentials" for bulk buyers

### 4. **Location-based Offers**
- County-specific delivery promotions
- Regional product availability
- Local partnership deals

## 🎁 Reward System

Upon completion, users receive:
- **Success toast**: "🎉 Asante sana! You've unlocked 10% off your next basket!"
- **Redirect**: Personalized homepage view (`/?personalized=true`)
- **Future rewards**: Loyalty points, exclusive access to flash sales

## 🔐 Privacy & Compliance

- Data is user-editable via account settings
- GDPR-compliant opt-in/opt-out
- Clear privacy messaging at bottom of form
- Secure storage with RLS policies
- No sharing with third parties

## 📱 Responsive Design

- **Mobile**: Single-column card layout
- **Tablet**: 2-column grid for selections
- **Desktop**: 3-column grid, side-by-side navigation

## 🧪 Testing Checklist

- [ ] All 5 steps navigate correctly
- [ ] Back button works properly
- [ ] Form validation prevents skipping required fields
- [ ] Multi-select allows multiple choices
- [ ] Single-select enforces one choice
- [ ] localStorage saves data correctly
- [ ] Toast notifications appear
- [ ] Redirect works after submission
- [ ] Mobile responsive layout
- [ ] Accessibility (keyboard navigation, screen readers)

## 🔄 Migration Steps (Database Setup)

1. **Run SQL migration**:
   ```bash
   # In Supabase SQL Editor, run:
   create-basket-preferences-table.sql
   ```

2. **Verify table creation**:
   ```sql
   SELECT * FROM user_basket_preferences LIMIT 1;
   ```

3. **Update BuildYourBasket.tsx**:
   - Remove localStorage fallback
   - Use only `saveUserBasketPreferences()` API call

4. **Test with real users**:
   - Sign in and complete the form
   - Verify data in Supabase dashboard
   - Check RLS policies work correctly

## 🎨 A/B Testing Variations

Test different page titles to optimize conversion:

1. **"Build Your Own Basket 🧺"** (Current)
2. **"What Do You Always Buy? 🛒"**
3. **"Your Future Basket 💡"**
4. **"Personalize Your Deals 🎯"**

## 📈 Success Metrics

Track these metrics to measure effectiveness:

- **Completion Rate**: % of users who finish all 5 steps
- **Drop-off Points**: Which step has highest abandonment
- **Time to Complete**: Average duration
- **Conversion Lift**: % increase in purchases from personalized users
- **Basket Size**: Average order value comparison
- **Repeat Purchase Rate**: Retention improvement

## 🔮 Future Enhancements

- **Machine Learning**: Use collected data to train recommendation models
- **A/B Testing**: Test different question orders and formats
- **Social Proof**: "Join 50,000+ shoppers who've personalized their experience"
- **Progress Saving**: Allow users to exit and resume later
- **Referral Integration**: "Invite friends who shop like you"
- **Seasonal Updates**: Adapt questions for holidays and events

## 👥 Target Audience

- **Primary**: First-time visitors exploring GetDeals
- **Secondary**: Existing users wanting personalized experiences
- **Tertiary**: Users clicking on email/social media campaigns

## 📧 Marketing Integration

- Email campaign: "Unlock Your Personal Deals"
- Social media posts featuring the interactive experience
- Push notifications for incomplete profiles
- Homepage banner promoting the feature

## 🛠️ Maintenance

- **Monthly**: Review form completion data
- **Quarterly**: Update category options based on inventory
- **Annually**: Refresh question wording and design

---

## Quick Start for Developers

```bash
# 1. Feature is already implemented in the codebase
# 2. Access the page at /build-your-basket or /membership
# 3. To deploy database:
#    - Open Supabase SQL Editor
#    - Run create-basket-preferences-table.sql
# 4. Test the full flow as an authenticated user
```

## Support

For questions or issues:
- **Technical**: Check `/src/pages/BuildYourBasket.tsx`
- **Database**: See `create-basket-preferences-table.sql`
- **API**: Review `/src/lib/basketPreferences.ts`

---

**Last Updated**: January 2025
**Status**: ✅ Active - localStorage implementation (Database migration pending)
