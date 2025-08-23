# 🧪 Quick MLM Testing Checklist

## Your server is running at: http://localhost:3003

---

## 🎯 **QUICK TEST (5 Minutes)**

### ✅ **Step 1: Test Basic Signup**
1. Go to: http://localhost:3003/signup
2. Create a user:
   - Name: Test User
   - Phone: 9999999999
   - Password: 123456
3. Note the referral code generated

### ✅ **Step 2: Test Referral Signup**
1. Go to: http://localhost:3003/signup?ref=YOUR_REFERRAL_CODE
2. Create another user with the referral code
3. You should see "Valid referral code" message

### ✅ **Step 3: Test MLM Dashboard**
1. Login as first user: http://localhost:3003/login
2. Go to: http://localhost:3003/mlm-dashboard
3. Check if you see:
   - Your referral code
   - Team statistics (1 direct referral)
   - Your referral link

### ✅ **Step 4: Test Admin View**
1. Login as admin: http://localhost:3003/admin/login
2. Go to: http://localhost:3003/admin/mlm-stats
3. See system-wide MLM statistics

---

## 🏗️ **HOW MLM WORKS - SIMPLE EXPLANATION**

### **Matrix Tree Structure**
```
You (Root)
├── Person A (invited by you)
├── Person B (invited by you)  
├── Person C (invited by you)
    ├── Person D (invited by C)
    ├── Person E (invited by C)
    └── Person F (invited by C)
```

### **Commission Flow**
1. **Someone joins under you** → You get commission
2. **They make purchases** → You get commission based on level
3. **Commission percentages**:
   - Level 1: 20-25% 
   - Level 2: 15-20%
   - Level 3: 10-15%
   - And so on...

### **Key Rules**
- **3-3 Rule**: Need 3 active people in first 3 levels for full benefits
- **Weekly Payouts**: Self commission paid over 4 weeks
- **Matrix Placement**: System automatically places new people optimally

---

## 💰 **COMMISSION EXAMPLE**

If someone buys a product with ₹100 commission:

**First Purchase (Joining):**
- Company: ₹25
- Level 1 (You): ₹10.50
- Level 2: ₹7.87
- Self to buyer: ₹22.50 (over 4 weeks)

**Repeat Purchase:**
- Company: ₹25  
- Level 1 (You): ₹18.75
- Level 2: ₹15.00
- And so on...

---

## 🔧 **DATABASE TESTING**

Want to see the data? Run Prisma Studio:
```bash
cd "/home/darshan/darshan/WEB DEVELOPMENT /WEAR AND EARN"
npx prisma studio
```

This opens a visual database browser at http://localhost:5555

---

## 📱 **TESTING URLS**

- **Main App**: http://localhost:3003
- **Signup**: http://localhost:3003/signup
- **MLM Dashboard**: http://localhost:3003/mlm-dashboard  
- **Admin MLM Stats**: http://localhost:3003/admin/mlm-stats
- **Admin Tree View**: http://localhost:3003/admin/mlm-tree

---

## 🚀 **WHAT TO EXPECT**

✅ **Working Features**:
- User signup with referral codes
- Automatic matrix placement (BFS algorithm)
- MLM dashboard with team stats
- Commission calculation (ready for orders)
- Admin statistics panel
- Referral link generation

⏳ **To Complete Testing**:
- Add commission amounts to products
- Place test orders to trigger commissions
- Set up Razorpay for payment testing

---

**Your MLM system is LIVE and ready! 🎉**

Start with the 5-minute quick test above, then explore the full testing guide in `MLM_TESTING_GUIDE.md`
