IGH PRIORITY (Must Have - 4%)
1. Cron Endpoint for Weekly Payouts ⭐

File: route.js
Function: Process scheduled weekly self-payouts from SelfPayoutSchedule table
Actions: Credit wallets, update ledger, mark payouts as 'paid'
2. Withdrawal API Endpoints ⭐

File: route.js (User withdrawal request)
File: route.js (Admin approval)
Function: Complete withdrawal flow from request to approval
MEDIUM PRIORITY (Nice to Have - 1%)
3. KYC Admin Approval API

File: route.js
Function: Dedicated admin KYC approval endpoint
4. TypeScript Migration (Optional)

Convert: mlm-commission.js → .ts
Convert: matrix.js → .ts
Convert: referral.js → .ts
LOW PRIORITY (Polish)
5. Unit Tests (Optional)

Files: __tests__/referral.test.js, __tests__/matrix.test.js
Function: Test core MLM algorithms
6. Prisma Client Wrapper (Optional)

File: lib/prisma.ts
Function: Centralized database client
