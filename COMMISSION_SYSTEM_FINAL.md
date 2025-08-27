# Commission System - Exact Implementation

## Overview
Updated the existing `/lib/mlm-commission.js` file with your exact commission percentages. No new TypeScript files created to avoid confusion.

## Commission Structure Implemented

### JOINING ORDER COMMISSIONS (First Purchase)
```
Total Commission: 100% of product.commissionAmount
├── Company: 30%
└── Users: 70%
    ├── Self Income: 30% of 70% = 21% of total
    │   └── Paid over 4 weekly instalments
    └── Sponsor Income: 70% of 70% = 49% of total
        ├── Level 1: 25% = 12.25% of total
        ├── Level 2: 20% = 9.8% of total  
        ├── Level 3: 15% = 7.35% of total
        ├── Level 4: 10% = 4.9% of total
        └── Level 5: 10% = 4.9% of total
```

### REPURCHASE ORDER COMMISSIONS
```
Total Commission: 100% of product.commissionAmount  
├── Company: 30%
└── Sponsors: 70%
    ├── Level 1: 25% = 17.5% of total
    ├── Level 2: 20% = 14% of total
    ├── Level 3: 15% = 10.5% of total
    ├── Level 4: 10% = 7% of total
    └── Level 5: 10% = 7% of total
```

## Functions Updated in `/lib/mlm-commission.js`

### 1. `handlePaidJoining(tx, order)`
- **Purpose**: Process commission for first purchase (joining order)
- **Logic**: 
  - 30% to company
  - 21% to user (self income) - paid over 4 weekly instalments
  - 49% to sponsors distributed across 5 levels
- **Features**: Creates self-payout schedule, updates wallets, creates ledger entries

### 2. `handlePaidRepurchase(tx, order)`
- **Purpose**: Process commission for repeat purchases
- **Logic**:
  - 30% to company  
  - 70% to sponsors distributed across 5 levels
- **Eligibility**: Uses 3-3 rule via `isRepurchaseEligible()`

### 3. `createSelfPayoutSchedule(tx, userId, orderId, amount)`
- **Purpose**: Create 4 weekly installment schedule for self income
- **Parameters**: 
  - `tx` - Prisma transaction
  - `userId` - User receiving self income
  - `orderId` - Reference order
  - `amount` - Total amount in paisa to distribute over 4 weeks
- **Logic**: Divides amount into 4 equal weekly payments, handles remainders

### 4. `isRepurchaseEligible(tx, userId)` (in mlm-matrix.js)
- **Purpose**: Check 3-3 rule for repurchase eligibility
- **Rule**: User needs ≥3 direct referrals, each with ≥3 direct referrals
- **Returns**: Boolean indicating eligibility

## Configuration Constants

```javascript
// JOINING ORDER split
const JOIN_SPLIT = {
  company: 0.30,                    // 30% company
  sponsorsBucket: 0.70,             // 70% users total
  sponsorsPortionOfBucket: 0.70,    // 70% of 70% = 49% (sponsors)
  selfPortionOfBucket: 0.30         // 30% of 70% = 21% (self)
};

// JOINING ORDER - Sponsor levels (applied to 49% of total)
const JOIN_LEVELS = { 
  1: 0.25,  // 25% of sponsor portion
  2: 0.20,  // 20% of sponsor portion
  3: 0.15,  // 15% of sponsor portion
  4: 0.10,  // 10% of sponsor portion
  5: 0.10   // 10% of sponsor portion
};

// REPURCHASE ORDER - Sponsor levels (applied to 70% of total)
const REPURCHASE_LEVELS = { 
  1: 0.25,  // 25% of total commission
  2: 0.20,  // 20% of total commission
  3: 0.15,  // 15% of total commission
  4: 0.10,  // 10% of total commission
  5: 0.10   // 10% of total commission
};
```

## Example Calculation

### Product with ₹100 Commission Amount

#### Joining Order:
- **Total Commission**: ₹100.00 (10,000 paisa)
- **Company**: ₹30.00 (3,000 paisa)
- **Self Income**: ₹21.00 (2,100 paisa) - 4 weekly instalments of ₹5.25 each
- **Sponsor Income**: ₹49.00 (4,900 paisa)
  - Level 1: ₹12.25 (1,225 paisa)
  - Level 2: ₹9.80 (980 paisa)
  - Level 3: ₹7.35 (735 paisa)
  - Level 4: ₹4.90 (490 paisa)
  - Level 5: ₹4.90 (490 paisa)

#### Repurchase Order:
- **Total Commission**: ₹100.00 (10,000 paisa)
- **Company**: ₹30.00 (3,000 paisa)
- **Sponsors**: ₹70.00 (7,000 paisa)
  - Level 1: ₹17.50 (1,750 paisa)
  - Level 2: ₹14.00 (1,400 paisa)
  - Level 3: ₹10.50 (1,050 paisa)
  - Level 4: ₹7.00 (700 paisa)
  - Level 5: ₹7.00 (700 paisa)

## Database Integration

### Ledger Entries Created:
- `company_fund` - Company commission
- `sponsor_commission` - Level-wise sponsor commissions (joining)
- `repurchase_commission` - Level-wise sponsor commissions (repurchase)
- `rollup_to_company` - Ineligible commissions rolled to company

### SelfPayoutSchedule Entries:
- 4 weekly records per joining order
- Status: 'scheduled', 'paid', 'skipped'
- Automatic due date calculation

### User Wallet Updates:
- `walletBalance` incremented for eligible sponsors
- Transaction-safe operations
- Automatic rollback on errors

## Error Handling
- Product validation
- User eligibility checks  
- Transaction safety with automatic rollbacks
- Detailed logging for audit trails
- Graceful handling of missing ancestors

## Integration Points
- Works with existing MLM tree structure
- Uses hierarchy closure table for O(1) ancestor queries
- Integrates with existing user activation system
- Compatible with existing order processing flow

## Usage in Order Processing
```javascript
import { handlePaidJoining, handlePaidRepurchase } from './lib/mlm-commission.js';

// In order payment success handler
await prisma.$transaction(async (tx) => {
  if (order.isJoiningOrder) {
    await handlePaidJoining(tx, order);
  } else {
    await handlePaidRepurchase(tx, order);
  }
});
```
