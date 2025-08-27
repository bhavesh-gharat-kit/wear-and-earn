# Enhanced Razorpay Webhook with MLM Functionality

## Overview
The Razorpay webhook handler at `/api/webhooks/razorpay/route.js` has been enhanced with comprehensive MLM functionality including commission distribution, matrix placement, and audit tracking.

## Key Features Implemented

### 1. Webhook Security & Idempotency
- ✅ **Signature Verification**: Validates webhook authenticity using HMAC-SHA256
- ✅ **Idempotency Protection**: Prevents duplicate processing using webhook IDs
- ✅ **Webhook Logging**: Tracks all processed webhooks in `WebhookLog` table

### 2. Order Status Detection
- ✅ **First Order Detection**: Automatically identifies joining orders vs repurchase orders
- ✅ **Paid Order Counting**: Counts existing paid orders to determine order type
- ✅ **Status Updates**: Sets order status to 'paid' when payment is captured

### 3. Joining Order Processing (First Order)
- ✅ **User Activation**: Sets `isActive = true` and generates unique referral code
- ✅ **MLM Tree Placement**: Places user in 3-wide matrix using BFS algorithm
- ✅ **Sponsor Preference**: Places under sponsor if available, otherwise auto-fills
- ✅ **Commission Distribution**: 30% company, 70% users (21% self, 49% sponsors)
- ✅ **5-Level Hierarchy**: 25%, 20%, 15%, 10%, 10% distribution across 5 levels
- ✅ **Self-Payout Schedule**: Creates 4 weekly installments for self income

### 4. Repurchase Order Processing (Repeat Orders)
- ✅ **Eligibility Check**: Validates 3-3 rule before distributing commissions
- ✅ **Commission Distribution**: 30% company, 70% sponsors across 5 levels
- ✅ **Monthly Purchase Tracking**: Updates user's monthly purchase amount

### 5. Commission Calculation
- ✅ **Product-Based**: Calculates from `product.commissionAmount` × quantity
- ✅ **Multi-Product Support**: Handles orders with multiple products
- ✅ **Exact Percentages**: Follows specified commission structure exactly

### 6. Audit Trail & Error Handling
- ✅ **Ledger Entries**: Creates detailed audit trail for all transactions
- ✅ **Idempotency Keys**: Uses format `${orderId}:${level}:${type}` to prevent duplicates
- ✅ **Error Handling**: Comprehensive try-catch with meaningful error messages
- ✅ **Transaction Safety**: All database operations wrapped in Prisma transactions

## Commission Structure

### Joining Orders (First Order)
```
Total Commission (C) = sum of (product.commissionAmount × quantity)

Company Cut: 30% of C
User Bucket: 70% of C
├── Self Income: 30% of bucket = 21% of C (paid in 4 weekly installments)
└── Sponsor Income: 70% of bucket = 49% of C (distributed across 5 levels)

Level Distribution:
- Level 1: 25% (12.25% of total)
- Level 2: 20% (9.8% of total)  
- Level 3: 15% (7.35% of total)
- Level 4: 10% (4.9% of total)
- Level 5: 10% (4.9% of total)
```

### Repurchase Orders (Repeat Orders)
```
Total Commission (C) = sum of (product.commissionAmount × quantity)

Company Cut: 30% of C
Sponsor Income: 70% of C (distributed across 5 levels, subject to 3-3 rule)

Level Distribution (only if 3-3 rule passed):
- Level 1: 25% (17.5% of total)
- Level 2: 20% (14% of total)
- Level 3: 15% (10.5% of total)
- Level 4: 10% (7% of total)
- Level 5: 10% (7% of total)
```

## Database Schema Updates

### New Tables
```sql
-- Webhook idempotency tracking
CREATE TABLE webhook_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webhookId VARCHAR(255) UNIQUE,
  event VARCHAR(255),
  processedAt DATETIME,
  payload TEXT,
  createdAt DATETIME
);
```

### Enhanced Tables
```sql
-- Ledger enhancements
ALTER TABLE ledger ADD COLUMN ref VARCHAR(255) UNIQUE;
ALTER TABLE ledger ADD INDEX idx_ref (ref);

-- Self payout schedule enhancements  
ALTER TABLE self_payout_schedule ADD COLUMN ref VARCHAR(255);
ALTER TABLE self_payout_schedule ADD COLUMN description TEXT;
ALTER TABLE self_payout_schedule ADD INDEX idx_ref (ref);
```

## API Endpoint

### POST `/api/webhooks/razorpay`
Handles Razorpay webhook events for payment processing.

**Headers:**
- `x-razorpay-signature`: HMAC-SHA256 signature for verification

**Request Body:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "order_id": "order_xxx",
        "amount": 50000,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## Error Handling

1. **Invalid Signature**: Returns 401 with error message
2. **Order Not Found**: Returns 404 with error message  
3. **Duplicate Processing**: Returns 200 with "Already processed" message
4. **Database Errors**: Returns 500 with error logging

## Security Features

1. **Webhook Signature Verification**: Validates request authenticity
2. **Idempotency Protection**: Prevents duplicate webhook processing
3. **Transaction Atomicity**: Ensures data consistency
4. **SQL Injection Protection**: Uses Prisma ORM with parameterized queries

## Testing

Use the provided `test-webhook.js` script to test webhook functionality:

```bash
node test-webhook.js
```

## Environment Variables Required

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
DATABASE_URL=mysql://user:password@localhost:3306/database_name
```

## MLM Business Rules Implemented

1. **3-3 Rule**: Users must have ≥3 direct referrals, with ≥3 of those having ≥3 referrals each
2. **Matrix Placement**: 3-wide BFS placement with sponsor preference
3. **Commission Rollup**: Inactive/ineligible users' commissions roll up to company
4. **Weekly Payouts**: Self income paid in 4 weekly installments
5. **Monthly Tracking**: Purchase amounts tracked for eligibility calculations

## Files Modified

1. `/app/api/webhooks/razorpay/route.js` - Main webhook handler
2. `/lib/commission.js` - Commission calculation functions
3. `/prisma/schema.prisma` - Database schema updates
4. `/test-webhook.js` - Testing script (new)

This implementation provides a robust, secure, and auditable MLM commission system integrated with Razorpay payment processing.
