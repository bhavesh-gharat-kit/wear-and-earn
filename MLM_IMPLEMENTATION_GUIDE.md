# MLM System Implementation - "Wear and Earn"

## Overview
We have successfully implemented a comprehensive Multi-Level Marketing (MLM) system for the "Wear and Earn" e-commerce platform. The system includes a 7-level matrix structure with sophisticated commission distribution, referral tracking, and automated payout scheduling.

## 🚀 Key Features Implemented

### 1. **Database Schema (Prisma)**
- **Enhanced User Model**: Added MLM-specific fields including referralCode, walletBalance, monthlyPurchase, isActive, isKycApproved, isEligibleRepurchase
- **MatrixNode Model**: Tree structure for MLM hierarchy with BFS placement algorithm
- **Hierarchy Model**: Closure table for optimized ancestor/descendant queries
- **Ledger Model**: Complete transaction logging system for all MLM activities
- **SelfPayoutSchedule Model**: Automated weekly payout scheduling for self-commissions
- **Config Model**: System-wide configuration management

### 2. **MLM Business Logic**
- **7-Level Matrix System**: Each user can have up to 3 direct referrals per level
- **BFS Placement Algorithm**: Automatic optimal placement in the matrix tree
- **Commission Structure**:
  - **Joining Orders**: 25% company, 75% sponsors+user (70% sponsors, 30% self over 4 weeks)
  - **Repurchase Orders**: 25% company, 75% sponsors (distributed across 7 levels)
- **3-3 Rule**: Users must have 3 active downlines in first 3 levels for repurchase eligibility
- **Eligibility Tracking**: Automatic validation for commission distribution

### 3. **API Endpoints**

#### MLM Core APIs
- `POST /api/webhooks/razorpay` - Payment webhook for commission triggers
- `GET /api/mlm/dashboard` - User MLM dashboard data
- `POST /api/mlm/process-payouts` - Process pending self-payouts
- `GET /api/validate-referral` - Validate referral codes during signup
- `GET /api/admin/mlm-stats` - Admin MLM statistics

#### Enhanced Existing APIs
- `POST /api/signup` - Updated with MLM matrix placement
- `POST /api/orders` - Enhanced with MLM commission calculation and Razorpay integration
- `GET /api/orders` - Updated to handle paisa conversion

### 4. **Frontend Components**

#### User Interface
- `MLMDashboard.jsx` - Comprehensive MLM dashboard showing:
  - Wallet balance and earnings breakdown
  - Team statistics (direct referrals, level-wise counts)
  - Matrix position and parent information
  - Referral link with copy functionality
  - Recent transaction history
- `Register.jsx` - Enhanced signup with referral code validation
- MLM Dashboard page with payout processing

#### Admin Interface
- Admin MLM statistics page showing:
  - System-wide MLM metrics
  - Commission distribution analytics
  - Level-wise user distribution
  - Recent transaction monitoring

### 5. **Utility Functions (`lib/mlm-matrix.js`)**
- `bfsFindOpenSlot()` - BFS algorithm for optimal matrix placement
- `placeUserInMatrix()` - Complete matrix placement with hierarchy building
- `getDirectReferrals()` - Count direct referrals
- `getTotalTeamSize()` - Calculate total team across all levels
- `getUplines()` / `getDownlines()` - Hierarchy navigation
- `isRepurchaseEligible()` - 3-3 rule validation

### 6. **Commission Distribution (`lib/mlm-commission.js`)**
- `handlePaidJoining()` - Process joining order commissions
- `handlePaidRepurchase()` - Process repurchase order commissions
- Level-wise commission distribution with percentage configuration
- Automatic rollup to company for inactive/ineligible users
- Weekly self-payout scheduling

## 🏗️ Technical Architecture

### Database Design
- **Storage**: All monetary values stored in paisa (100 paisa = 1 rupee) for precision
- **Indexing**: Optimized indexes on referralCode, userId, hierarchy relationships
- **Constraints**: Proper foreign key relationships and data validation
- **Transactions**: ACID compliance for all MLM operations

### Payment Integration
- **Razorpay Integration**: Complete payment gateway setup with webhook handling
- **Order Tracking**: Gateway order ID mapping for payment confirmation
- **Commission Triggers**: Automatic commission distribution on payment success

### Security & Validation
- **Webhook Verification**: Razorpay signature validation
- **Referral Validation**: Real-time referral code verification
- **Session Management**: Secure user authentication for MLM operations
- **Data Integrity**: Transaction-based operations for consistency

## 📊 Commission Structure Details

### Joining Order (First Purchase)
- **Company Cut**: 25% of commission amount
- **Sponsors Distribution**: 52.5% distributed across levels 1-7
  - Level 1: 20%, Level 2: 15%, Level 3: 10%, Level 4: 10%
  - Level 5: 5%, Level 6: 5%, Level 7: 5%
- **Self Commission**: 22.5% paid over 4 weekly installments

### Repurchase Orders
- **Company Cut**: 25% of commission amount
- **Sponsors Distribution**: 75% distributed across levels 1-7
  - Level 1: 25%, Level 2: 20%, Level 3: 15%, Level 4: 15%
  - Level 5: 10%, Level 6: 10%, Level 7: 5%
- **Eligibility**: 3-3 rule must be satisfied

## 🔧 Setup Instructions

### 1. Environment Configuration
```env
# Add to .env file
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
```

### 2. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 3. Dependencies
- Razorpay SDK already installed
- All Prisma models configured
- Next.js API routes implemented

## 🎯 Usage Flow

### User Journey
1. **Signup**: User registers with optional referral code
2. **Matrix Placement**: Automatic placement using BFS algorithm
3. **First Purchase**: Triggers joining commission distribution
4. **Team Building**: User invites others using their referral link
5. **Ongoing Purchases**: Repurchase commissions based on eligibility
6. **Earnings**: Weekly self-payouts + instant sponsor commissions

### Admin Monitoring
1. **MLM Statistics**: Real-time system metrics
2. **Commission Tracking**: Complete audit trail
3. **User Management**: Monitor team structures and eligibility

## 🔮 Future Enhancements

### Phase 2 Features (Suggested)
- **Rank System**: Achievement-based ranks with additional benefits
- **Bonus Pools**: Performance-based bonus distributions
- **Mobile App**: Dedicated MLM mobile application
- **Advanced Analytics**: Detailed performance dashboards
- **Withdrawal System**: Bank account integration for payouts
- **KYC Integration**: Document verification system

## 🛡️ Security Considerations

### Current Implementation
- Webhook signature verification
- Secure session management
- Transaction-based operations
- Input validation on all APIs

### Recommended Additions
- Rate limiting on sensitive endpoints
- IP whitelisting for webhooks
- Enhanced logging and monitoring
- Regular security audits

## 📈 Performance Optimizations

### Database
- Closure table for O(1) hierarchy queries
- Proper indexing on frequently queried fields
- Efficient pagination for large datasets

### API
- Transaction grouping for atomic operations
- Optimized queries with proper includes
- Caching for static configuration data

---

**Note**: This MLM system is production-ready with comprehensive testing recommended before deployment. All monetary calculations use precise integer arithmetic to avoid floating-point errors.
