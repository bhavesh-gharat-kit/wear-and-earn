# MLM System Testing Guide - "Wear and Earn"

## 🚀 How to Test Your MLM System

Your server is running at: **http://localhost:3003**

---

## 📋 **Step-by-Step Testing Process**

### **Phase 1: Create Test Users**

#### **Step 1: Create Root User (Sponsor)**
1. Go to: http://localhost:3003/signup
2. Fill in the form:
   - **Full Name**: John Sponsor
   - **Email**: john@test.com
   - **Phone**: 9876543210
   - **Address**: Test Address 1
   - **Password**: 123456
   - **Referral Code**: (Leave empty - this will be root)
3. Click "Register"
4. Note down the referral code generated (e.g., `JOH123456`)

#### **Step 2: Create First Referral**
1. Go to: http://localhost:3003/signup?ref=JOH123456
2. Fill in the form:
   - **Full Name**: Alice User1
   - **Email**: alice@test.com
   - **Phone**: 9876543211
   - **Address**: Test Address 2
   - **Password**: 123456
   - **Referral Code**: JOH123456 (should be pre-filled)
3. You should see: "✓ Valid referral code! You will be sponsored by: John Sponsor"
4. Click "Register"

#### **Step 3: Create More Users for Matrix**
Repeat Step 2 with different details:
- **Bob User2** (Phone: 9876543212) - using John's referral code
- **Carol User3** (Phone: 9876543213) - using John's referral code
- **David User4** (Phone: 9876543214) - using Alice's referral code

---

### **Phase 2: Test MLM Dashboard**

#### **Step 1: Login and View Dashboard**
1. Login as John Sponsor: http://localhost:3003/login
2. Go to MLM Dashboard: http://localhost:3003/mlm-dashboard
3. You should see:
   - **Profile Information** (Name, Referral Code, Status)
   - **Team Statistics** (Direct Referrals: 3, Level counts)
   - **Referral Link** (copy and share)
   - **Matrix Information** (Position: Root)
   - **Earnings** (Initially ₹0.00)

#### **Step 2: Test Other Users' Dashboards**
- Login as Alice and check her dashboard
- She should show John as her parent
- Her team size will be smaller

---

### **Phase 3: Test Commission System**

#### **Step 1: Add Commission Amount to Products**
1. Login as admin: http://localhost:3003/admin/login
2. Go to Products management
3. Edit a product and set "Commission Amount" (e.g., ₹100)

#### **Step 2: Place Orders to Trigger Commissions**
1. Login as Alice User1
2. Add a product with commission to cart
3. Place order (use COD for testing)
4. This triggers **Joining Commission** since it's Alice's first order

#### **Step 3: Check Commission Distribution**
1. Login as John Sponsor
2. Go to MLM Dashboard
3. Check "Recent Transactions" - you should see sponsor commission
4. Check "Earnings" - wallet balance should increase

---

### **Phase 4: Test Repurchase Logic**

#### **Step 1: Place Second Order**
1. Login as Alice again
2. Place another order
3. This triggers **Repurchase Commission** (if eligible)

#### **Step 2: Test 3-3 Rule**
- For repurchase eligibility, a user needs 3 active referrals in first 3 levels
- Add more users under Alice to test this

---

## 🏗️ **How MLM System Works**

### **Matrix Structure (7 Levels, 3-Wide)**
```
                John (Root)
               /     |     \
           Alice    Bob    Carol
          /  |  \   
      David  E   F   
```

### **Commission Flow**

#### **Joining Order Commission (First Purchase)**
- **Total Commission**: ₹100 (from product)
- **Company Cut**: 25% = ₹25
- **Sponsors Bucket**: 52.5% = ₹52.50
  - Level 1 (John): 20% of ₹52.50 = ₹10.50
  - Level 2-7: Distributed based on percentages
- **Self Commission**: 22.5% = ₹22.50 (paid over 4 weeks)

#### **Repurchase Order Commission**
- **Total Commission**: ₹100
- **Company Cut**: 25% = ₹25  
- **Sponsors Only**: 75% = ₹75
  - Level 1: 25% of ₹75 = ₹18.75
  - Level 2: 20% of ₹75 = ₹15.00
  - And so on...

### **Key Rules**
1. **BFS Placement**: New users placed optimally in matrix
2. **3-3 Rule**: Need 3 active downlines in first 3 levels for repurchase income
3. **Weekly Payouts**: Self-commission paid over 4 weeks
4. **Rollup**: Inactive users' commissions go to company

---

## 🔧 **Testing APIs Directly**

### **Test MLM Dashboard API**
```bash
# Login first, then:
curl http://localhost:3003/api/mlm/dashboard
```

### **Test Referral Validation**
```bash
curl "http://localhost:3003/api/validate-referral?code=JOH123456"
```

### **Test Admin MLM Stats**
```bash
# Login as admin first, then:
curl http://localhost:3003/api/admin/mlm-stats
```

---

## 📊 **Admin Testing**

### **View MLM Statistics**
1. Login as admin: http://localhost:3003/admin/login
2. Go to: http://localhost:3003/admin/mlm-stats
3. View:
   - Total users and active users
   - Commission distribution
   - Level-wise user counts
   - Recent MLM transactions

---

## 🐛 **Testing Scenarios**

### **Scenario 1: Basic Tree Building**
1. Create 5-10 users with referral chains
2. Check matrix placement in database
3. Verify hierarchy table entries

### **Scenario 2: Commission Calculation**
1. Place orders with different commission amounts
2. Verify commission distribution in ledger table
3. Check wallet balance updates

### **Scenario 3: Eligibility Testing**
1. Test 3-3 rule with insufficient downlines
2. Test with sufficient active downlines
3. Verify commission vs rollup behavior

### **Scenario 4: Payment Integration**
1. Set up Razorpay test keys
2. Place online orders
3. Test webhook commission triggers

---

## 🎯 **Success Indicators**

✅ **User Registration**: Users can signup with referral codes  
✅ **Matrix Placement**: Users appear in correct matrix positions  
✅ **Commission Calculation**: Accurate commission distribution  
✅ **Dashboard Data**: Correct team stats and earnings display  
✅ **Payment Flow**: Orders trigger commission distribution  
✅ **Admin Stats**: System-wide statistics work correctly  

---

## 📱 **URLs for Testing**

- **Main App**: http://localhost:3003
- **Signup**: http://localhost:3003/signup  
- **Login**: http://localhost:3003/login
- **MLM Dashboard**: http://localhost:3003/mlm-dashboard
- **Admin Login**: http://localhost:3003/admin/login
- **Admin MLM Stats**: http://localhost:3003/admin/mlm-stats

---

## 💡 **Tips for Testing**

1. **Use different browsers** or incognito tabs for different users
2. **Check browser console** for any JavaScript errors
3. **Monitor database** changes using Prisma Studio: `npx prisma studio`
4. **Test edge cases** like invalid referral codes, duplicate signups
5. **Verify calculations** manually against the commission percentages

Your MLM system is ready for comprehensive testing! 🚀
