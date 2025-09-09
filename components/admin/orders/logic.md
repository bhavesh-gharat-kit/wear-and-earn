# MLM Pool Plan – Complete Detailed Specification

## Table of Contents
1. [Core Definitions & Concepts](#core-definitions--concepts)
2. [User Journey & Purchase Flows](#user-journey--purchase-flows)
3. [Team Formation System](#team-formation-system)
4. [Level Progression System](#level-progression-system)
5. [Pool Distribution Mechanism](#pool-distribution-mechanism)
6. [Wallet & Withdrawal System](#wallet--withdrawal-system)
7. [Admin Panel Specifications](#admin-panel-specifications)
8. [Detailed Examples & Scenarios](#detailed-examples--scenarios)
9. [Edge Cases & Business Rules](#edge-cases--business-rules)
10. [Technical Implementation Guide](#technical-implementation-guide)

---

## 1. Core Definitions & Concepts

### 1.1 Price Structure
**Product Price (Pr)**: The actual cost of the physical product
- Example: A shoe costs ₦1,200
- This goes to cover product cost, shipping, etc.
- User pays this regardless of MLM participation

**MLM Price (Pm)**: Additional fee set by admin for MLM participation
- Example: ₦200 MLM fee
- This is where all commissions come from
- Admin sets this at product creation time

**Total Price Calculation**:
```
Total Price = Product Price + MLM Price
Total Price = ₦1,200 + ₦200 = ₦1,400
```

### 1.2 Revenue Split from MLM Price
When a user pays the MLM Price (Pm), it's split as follows:

**Company Share (30% of Pm)**:
- Goes directly to company profit
- Example: 30% of ₦200 = ₦60
- Not redistributed to users

**Pool Share (70% of Pm)**:
- Available for user rewards
- Example: 70% of ₦200 = ₦140
- This gets further divided based on purchase type

### 1.3 Key System Components

**Referral Code**:
- Generated ONLY after user's first successful purchase
- Cannot refer others until you've made your first purchase
- Each code is unique per user

**Sponsor/Referrer Relationship**:
- Used to track who brought whom into the system
- Forms the foundation for team building
- Permanent relationship (cannot be changed)

**Team Definition**:
- Formed when exactly 3 referred users complete their first purchase
- Not just registration - actual purchase completion required
- Forms dynamically as purchases happen

---

## 2. User Journey & Purchase Flows

### 2.1 First Purchase Flow (Detailed)

When a user makes their **first ever purchase**:

**Step 1: Payment Processing**
- User pays Total Price (Pr + Pm)
- Product Price (Pr) → goes to product fulfillment
- MLM Price (Pm) → enters the MLM system

**Step 2: MLM Price Split**
```
MLM Price (₦200) splits into:
├── Company Share: ₦60 (30%)
└── Pool Share: ₦140 (70%)
```

**Step 3: Pool Share Distribution**
```
Pool Share (₦140) splits into:
├── Self Income (20%): ₦28
└── Turnover Pool (80%): ₦112
```

**Step 4: Self Income Payment Schedule**
- Self Income (₦28) is paid in 4 weekly installments
- Each week: ₦28 ÷ 4 = ₦7
- Payment schedule:
  - Week 1: ₦7
  - Week 2: ₦7
  - Week 3: ₦7
  - Week 4: ₦7

**Step 5: System Updates**
- User gets referral code generated
- User can now start referring others
- User enters team formation tracking

### 2.2 Repurchase Flow (Detailed)

When a user makes **subsequent purchases**:

**Key Difference**: No self income on repurchases

**Step 1: Payment Processing**
- Same as first purchase for product fulfillment

**Step 2: MLM Price Split**
```
MLM Price (₦200) splits into:
├── Company Share: ₦60 (30%)
└── Pool Share: ₦140 (70%)
```

**Step 3: Pool Share Distribution**
```
Pool Share (₦140):
├── Self Income: ₦0 (0% on repurchases)
└── Turnover Pool: ₦140 (100%)
```

**Result**: All Pool Share goes directly to Turnover Pool for distribution to level holders

---

## 3. Team Formation System

### 3.1 How Teams Are Formed

**Basic Rule**: Every 3 successful first purchases by your referrals = 1 team

**Detailed Process**:

1. **User A refers User B, C, D**
2. **All three (B, C, D) must complete their first purchase**
3. **Once all 3 purchases are complete → User A forms 1 team**
4. **User A can now progress in level system**

### 3.2 Cascade Team Counting

**The "Wild Tree" System**:

Teams formed by your downline also count toward your team total.

**Example Scenario**:
```
A (You)
├── B (Your direct referral)
├── C (Your direct referral)
│   ├── X (C's referral)
│   ├── Y (C's referral)
│   │   ├── P (Y's referral)
│   │   ├── Q (Y's referral)
│   │   └── R (Y's referral)
│   └── Z (C's referral)
└── D (Your direct referral)
```

**Team Counting for User A**:
1. **Direct team**: B, C, D purchase → A gets 1 team
2. **Cascade team 1**: X, Y, Z purchase → C forms 1 team → A gets +1 team
3. **Cascade team 2**: P, Q, R purchase → Y forms 1 team → C gets +1 team → A gets +1 team

**Total teams for A**: 3 teams (can reach L2 level)

### 3.3 No Limitations
- **Unlimited referrals**: No cap on how many people you can refer
- **No matrix restrictions**: Not limited to 3×3 or any fixed structure
- **Dynamic growth**: Teams form organically as purchases happen

---

## 4. Level Progression System

### 4.1 Level Requirements

| Level | Teams Required | Pool Share |
|-------|---------------|------------|
| L1    | 1 team        | 30%        |
| L2    | 9 teams       | 20%        |
| L3    | 27 teams      | 20%        |
| L4    | 81 teams      | 15%        |
| L5    | 243 teams     | 15%        |

### 4.2 Level Progression Rules

**Automatic Promotion**:
- When you reach required teams → automatically promoted
- No admin approval needed
- Happens immediately when threshold is met

**Permanent Levels**:
- Once promoted → cannot be demoted
- Stay at achieved level forever
- Even if team members become inactive

**Level Replacement**:
- When promoted → leave old level completely
- Join new level pool distribution
- Cannot be in multiple levels simultaneously

### 4.3 Detailed Progression Example

**User Journey**:
1. **Start**: User completes first purchase → eligible for team building
2. **3 referrals purchase**: User forms 1 team → enters L1
3. **Continue referring**: More teams form through direct + cascade
4. **Reach 9 teams**: Automatically promoted to L2 (leaves L1)
5. **Reach 27 teams**: Automatically promoted to L3 (leaves L2)
6. **And so on...**

---

## 5. Pool Distribution Mechanism

### 5.1 Pool Accumulation

**Sources of Turnover Pool**:
1. **First purchases**: 80% of Pool Share
2. **Repurchases**: 100% of Pool Share

**Example Accumulation**:
- Day 1: 10 first purchases × ₦112 = ₦1,120
- Day 2: 5 repurchases × ₦140 = ₦700
- Day 3: 8 first purchases × ₦112 = ₦896
- **Total Pool**: ₦2,716

### 5.2 Distribution Trigger

**Admin Control**:
- Admin decides when to distribute
- Can be daily, weekly, or any frequency
- No automatic scheduling

### 5.3 Distribution Calculation

**Step 1: Level Allocation**
```
Total Pool: ₦100,000
├── L1 (30%): ₦30,000
├── L2 (20%): ₦20,000
├── L3 (20%): ₦20,000
├── L4 (15%): ₦15,000
└── L5 (15%): ₦15,000
```

**Step 2: Per-User Calculation**
For each level, divide equally among all users in that level.

**Example for L1**:
- L1 allocation: ₦30,000
- Users in L1: 50 people
- Each L1 user gets: ₦30,000 ÷ 50 = ₦600

### 5.4 Empty Level Handling

**If no users in a level**:
- That percentage returns to company
- Not redistributed to other levels

**Example**:
- If no L4 users exist
- L4's 15% (₦15,000) goes to company
- Other levels get their normal share

---

## 6. Wallet & Withdrawal System

### 6.1 Wallet Functionality

**Income Sources**:
1. **Self Income**: Weekly installments from first purchase
2. **Pool Distributions**: Earnings from level-based sharing

**Wallet Features**:
- Real-time balance updates
- Transaction history
- Pending vs available balance

### 6.2 Withdrawal Process

**Requirements**:
1. **Minimum Balance**: ₦300
2. **KYC Completion**: Mandatory before any withdrawal
3. **Admin Approval**: Each withdrawal needs approval

**Process Flow**:
1. User requests withdrawal (≥₦300)
2. System checks KYC status
3. Request goes to admin panel
4. Admin approves/rejects
5. If approved → funds transferred
6. Transaction recorded

### 6.3 KYC Requirements

**Mandatory Documents**:
- Government-issued ID
- Proof of address
- Bank account details
- Phone verification

**One-time Process**:
- Complete once, valid forever
- Must be approved before any withdrawal

---

## 7. Admin Panel Specifications

### 7.1 Pool Management Dashboard

**Main Metrics Display**:
```
┌─────────────────────────────────────┐
│ POOL OVERVIEW                       │
├─────────────────────────────────────┤
│ Total Pool Balance: ₦125,450        │
│ Last Distribution: 2 days ago       │
│ Pending Distribution: Yes           │
└─────────────────────────────────────┘
```

**Level-wise Breakdown**:
```
┌─────────────────────────────────────┐
│ LEVEL DISTRIBUTION PREVIEW          │
├─────────────────────────────────────┤
│ L1 (30%): ₦37,635 → 125 users       │
│ L2 (20%): ₦25,090 → 45 users        │
│ L3 (20%): ₦25,090 → 12 users        │
│ L4 (15%): ₦18,818 → 3 users         │
│ L5 (15%): ₦18,818 → 1 user          │
└─────────────────────────────────────┘
```

**Action Buttons**:
- **[Trigger Distribution]** - Start pool distribution process
- **[View History]** - See past distributions
- **[Download Report]** - Export distribution data

**Distribution History Table**:
| Date | Total Pool | L1 Users | L2 Users | L3 Users | L4 Users | L5 Users | Status |
|------|------------|----------|----------|----------|----------|----------|---------|
| 2024-01-15 | ₦98,500 | 120 | 40 | 10 | 2 | 1 | Completed |
| 2024-01-10 | ₦76,200 | 115 | 38 | 8 | 2 | 0 | Completed |

### 7.2 Team Management Dashboard

**Summary Statistics**:
```
┌─────────────────────────────────────┐
│ TEAM OVERVIEW                       │
├─────────────────────────────────────┤
│ Total Teams Formed: 1,247           │
│ Active Team Builders: 156           │
│ Teams Formed Today: 23              │
└─────────────────────────────────────┘
```

**Level Distribution**:
```
┌─────────────────────────────────────┐
│ USER LEVEL BREAKDOWN                │
├─────────────────────────────────────┤
│ L1 Users: 125 (67.2%)               │
│ L2 Users: 45 (24.2%)                │
│ L3 Users: 12 (6.5%)                 │
│ L4 Users: 3 (1.6%)                  │
│ L5 Users: 1 (0.5%)                  │
│ Total: 186 users                    │
└─────────────────────────────────────┘
```

**Recent Team Formations**:
| User | Level Achieved | Teams Count | Date | Referrer |
|------|----------------|-------------|------|----------|
| User123 | L2 | 9 | 2024-01-16 | User456 |
| User789 | L1 | 1 | 2024-01-16 | User123 |
| User321 | L1 | 3 | 2024-01-15 | User654 |

**Search & Filter**:
- Search by user ID/name
- Filter by level
- Filter by date range
- Export filtered results

### 7.3 MLM Overview Dashboard

**Revenue Metrics**:
```
┌─────────────────────────────────────┐
│ REVENUE BREAKDOWN (Last 30 Days)    │
├─────────────────────────────────────┤
│ Total Sales: ₦2,450,000             │
│ Product Revenue: ₦1,960,000 (80%)   │
│ MLM Revenue: ₦490,000 (20%)         │
│                                     │
│ Company Share: ₦147,000 (30%)       │
│ Pool Share: ₦343,000 (70%)          │
└─────────────────────────────────────┘
```

**User Statistics**:
```
┌─────────────────────────────────────┐
│ USER ENGAGEMENT                     │
├─────────────────────────────────────┤
│ Total Registered: 2,156             │
│ Made First Purchase: 1,847 (85.7%)  │
│ Have Referral Code: 1,847           │
│ Active Referrers: 234 (12.7%)       │
└─────────────────────────────────────┘
```

**Pending Payments**:
| User | Self Income Due | Week | Amount | Next Payment |
|------|-----------------|------|---------|--------------|
| User123 | Week 2 | 2/4 | ₦7 | 2024-01-18 |
| User456 | Week 1 | 1/4 | ₦14 | 2024-01-17 |
| User789 | Week 3 | 3/4 | ₦3.50 | 2024-01-19 |

### 7.4 Pool Withdrawal Management

**Withdrawal Requests Queue**:
```
┌─────────────────────────────────────┐
│ PENDING WITHDRAWALS (5)             │
├─────────────────────────────────────┤
│ User123: ₦450 | KYC: ✓ | [Approve] [Reject] │
│ User456: ₦300 | KYC: ✓ | [Approve] [Reject] │
│ User789: ₦1,200 | KYC: ✗ | [Pending KYC]    │
└─────────────────────────────────────┘
```

**Quick Stats**:
```
┌─────────────────────────────────────┐
│ WITHDRAWAL OVERVIEW                 │
├─────────────────────────────────────┤
│ Pending Requests: 5                 │
│ Total Amount: ₦3,250                │
│ KYC Completed: 3/5                  │
│ Avg Processing Time: 2.3 days       │
└─────────────────────────────────────┘
```

**Withdrawal History**:
| Date | User | Amount | Status | Processing Time | Admin |
|------|------|--------|---------|----------------|--------|
| 2024-01-16 | User321 | ₦800 | Approved | 1 day | Admin1 |
| 2024-01-15 | User654 | ₦450 | Rejected | 3 hours | Admin1 |
| 2024-01-14 | User987 | ₦1,500 | Approved | 2 days | Admin2 |

**Filters & Actions**:
- Filter by KYC status
- Filter by amount range
- Bulk approve/reject
- Export withdrawal reports
- Send notifications to users

---

## 8. Detailed Examples & Scenarios

### 8.1 Complete User Journey Example

**Meet Sarah - New User**:

**Day 1 - First Purchase**:
- Sarah buys a product for ₦1,400 (₦1,200 product + ₦200 MLM)
- MLM Price split: ₦60 to company, ₦140 to pool
- Pool split: ₦28 self income, ₦112 to turnover pool
- Sarah gets referral code: "SARAH2024"
- Weekly payment scheduled: ₦7 × 4 weeks

**Week 1-4 - Self Income**:
- Week 1: ₦7 credited to wallet
- Week 2: ₦7 credited to wallet
- Week 3: ₦7 credited to wallet
- Week 4: ₦7 credited to wallet
- Total self income: ₦28

**Day 30 - First Referral**:
- Sarah refers John using code "SARAH2024"
- John makes first purchase
- Sarah's referral counter: 1/3 (needs 2 more for team)

**Day 45 - Second & Third Referrals**:
- Sarah refers Mike and Lisa
- Both complete first purchases
- Sarah's team formed: 1 team
- Sarah promoted to L1 level
- Now eligible for pool distributions

**Day 60 - First Pool Distribution**:
- Pool has ₦50,000
- L1 gets 30% = ₦15,000
- 25 users in L1
- Sarah receives: ₦15,000 ÷ 25 = ₦600

**Day 90 - Growing Downline**:
- John (Sarah's referral) forms his own team
- Sarah's cascade team count: 2 teams
- Still in L1 (needs 9 teams for L2)

### 8.2 Advanced Cascade Example

**Complex Team Structure**:
```
Sarah (L1 - 8 teams)
├── John (3 direct referrals → 1 team)
│   ├── Alex (3 direct referrals → 1 team)
│   │   ├── Person A
│   │   ├── Person B
│   │   └── Person C (3 direct referrals → 1 team)
│   │       ├── Person X
│   │       ├── Person Y
│   │       └── Person Z
│   ├── Beth
│   └── Chris
├── Mike (3 direct referrals → 1 team)
│   ├── David (3 direct referrals → 1 team)
│   ├── Emma
│   └── Frank
└── Lisa (3 direct referrals → 1 team)
    ├── Grace (3 direct referrals → 1 team)
    ├── Henry
    └── Ian
```

**Sarah's Team Count Calculation**:
1. **Direct team**: John, Mike, Lisa purchased → 1 team
2. **John's team**: Alex, Beth, Chris purchased → +1 team
3. **Alex's team**: Persons A, B, C purchased → +1 team
4. **Person C's team**: Persons X, Y, Z purchased → +1 team
5. **Mike's team**: David, Emma, Frank purchased → +1 team
6. **David's team**: 3 people purchased → +1 team
7. **Lisa's team**: Grace, Henry, Ian purchased → +1 team
8. **Grace's team**: 3 people purchased → +1 team

**Total: 8 teams** (needs 1 more for L2 promotion)

---

## 9. Edge Cases & Business Rules

### 9.1 Refund Scenarios

**Full Purchase Refund**:
- **Self Income**: If any installments paid → deduct from future earnings
- **Pool Contribution**: Remove from turnover pool if not yet distributed
- **Team Count**: If refunded purchase was part of team formation → recalculate teams
- **Level Demotion**: If team recalculation drops below level requirement → demote user

**Example**:
- User had 9 teams (L2 level)
- 3 referrals refund (1 team lost)
- Now has 8 teams → demoted to L1

### 9.2 Inactive User Handling

**Definition of Inactive**:
- No purchases in last 90 days
- No referral activity

**System Behavior**:
- **Pool Distribution**: Inactive users still eligible (permanent levels)
- **Team Counting**: Their formed teams still count for uplines
- **Referral Code**: Remains active
- **No Penalties**: No reduction in benefits

### 9.3 Payment Failures

**Self Income Payment Fails**:
- Retry automatically next day
- If multiple failures → mark for manual review
- User notified of payment issues

**Pool Distribution Payment Fails**:
- Amount remains in user's wallet
- User can request withdrawal later
- No automatic retries for bulk distributions

### 9.4 KYC Related Issues

**Withdrawal Request with Incomplete KYC**:
- Request automatically rejected
- User notified about KYC requirement
- Request can be resubmitted after KYC completion

**KYC Rejection**:
- User can resubmit with corrected documents
- Existing wallet balance remains safe
- No impact on earning eligibility

---

## 10. Technical Implementation Guide

### 10.1 Database Schema Essentials

**Users Table**:
```sql
users:
- id (primary)
- referral_code (unique, generated after first purchase)
- sponsor_id (references users.id)
- current_level (L1/L2/L3/L4/L5)
- team_count (calculated field)
- kyc_status (pending/approved/rejected)
- first_purchase_date
- wallet_balance
```

**Purchases Table**:
```sql
purchases:
- id (primary)
- user_id (foreign key)
- product_price
- mlm_price
- is_first_purchase (boolean)
- purchase_date
- status (completed/refunded)
```

**Teams Table**:
```sql
teams:
- id (primary)
- team_leader_id (foreign key to users)
- formation_date
- member1_id, member2_id, member3_id (the 3 referrals)
- status (active/disbanded)
```

**Pool Distributions Table**:
```sql
pool_distributions:
- id (primary)
- distribution_date
- total_pool_amount
- l1_amount, l1_users, l1_per_user
- l2_amount, l2_users, l2_per_user
- ... (for all levels)
- triggered_by_admin_id
```

### 10.2 Key Algorithms

**Team Counting Algorithm**:
```python
def calculate_user_teams(user_id):
    direct_teams = count_direct_teams(user_id)
    cascade_teams = 0
    
    # Get all downline users recursively
    downline_users = get_all_downline_users(user_id)
    
    for downline_user in downline_users:
        cascade_teams += count_direct_teams(downline_user.id)
    
    return direct_teams + cascade_teams

def count_direct_teams(user_id):
    # Count completed first purchases by direct referrals
    completed_referrals = get_completed_first_purchases(user_id)
    return completed_referrals // 3  # Integer division
```

**Level Promotion Check**:
```python
def check_and_promote_user(user_id):
    team_count = calculate_user_teams(user_id)
    current_level = get_user_level(user_id)
    
    level_requirements = {
        'L1': 1, 'L2': 9, 'L3': 27, 'L4': 81, 'L5': 243
    }
    
    for level, requirement in reversed(level_requirements.items()):
        if team_count >= requirement and level > current_level:
            update_user_level(user_id, level)
            break
```

**Pool Distribution Logic**:
```python
def distribute_pool():
    total_pool = get_current_pool_balance()
    
    distributions = {
        'L1': {'percentage': 30, 'users': get_users_by_level('L1')},
        'L2': {'percentage': 20, 'users': get_users_by_level('L2')},
        'L3': {'percentage': 20, 'users': get_users_by_level('L3')},
        'L4': {'percentage': 15, 'users': get_users_by_level('L4')},
        'L5': {'percentage': 15, 'users': get_users_by_level('L5')}
    }
    
    for level, data in distributions.items():
        level_amount = total_pool * (data['percentage'] / 100)
        user_count = len(data['users'])
        
        if user_count > 0:
            per_user_amount = level_amount / user_count
            for user in data['users']:
                credit_wallet(user.id, per_user_amount)
        else:
            # Return to company if no users in level
            credit_company_account(level_amount)
    
    # Clear the pool and record distribution
    clear_turnover_pool()
    record_distribution_log(distributions)
```

### 10.3 Admin Panel API Endpoints

**Pool Management**:
```
GET /admin/pool/overview
- Returns current pool status and level breakdown

POST /admin/pool/distribute
- Triggers pool distribution
- Returns distribution summary

GET /admin/pool/history
- Returns past distribution records
```

**Team Management**:
```
GET /admin/teams/overview
- Returns team formation statistics

GET /admin/teams/users/{level}
- Returns users in specific level

POST /admin/teams/recalculate/{user_id}
- Manually recalculates user's team count
```

**Withdrawal Management**:
```
GET /admin/withdrawals/pending
- Returns pending withdrawal requests

POST /admin/withdrawals/{id}/approve
- Approves specific withdrawal

POST /admin/withdrawals/{id}/reject
- Rejects specific withdrawal with reason
```

### 10.4 Automated Tasks

**Daily Tasks**:
- Process weekly self income payments
- Update team counts for all users
- Check and process level promotions
- Send payment failure notifications

**Real-time Tasks**:
- Generate referral codes after first purchase
- Update pool balance on each purchase
- Trigger team formation checks
- Update wallet balances

**Manual Tasks** (Admin Triggered):
- Pool distributions
- KYC approvals
- Withdrawal processing
- Refund processing

---

## Conclusion

This comprehensive specification covers every aspect of your MLM Pool Plan system. The admin panel sections provide clear guidance on what data to display and what actions to enable, while the detailed examples and technical implementation guide ensure smooth development and operation.

Key success factors for your system:
1. **Transparency**: Users can clearly see their progress and earnings
2. **Fairness**: Equal distribution within levels, permanent level achievement
3. **Scalability**: No artificial limits on growth or referrals
4. **Security**: KYC requirements and admin controls for withdrawals
5. **Simplicity**: Clear rules that users can understand and follow

The "spoon-feeding" level of detail provided here should enable any developer to implement this system accurately and any admin to manage it effectively.