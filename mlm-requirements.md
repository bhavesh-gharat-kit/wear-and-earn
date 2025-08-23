This is wear and earn project, the e-commerce garments website with mlm logic integration. Users can visit website, can purchase the products. Once the product is purchased by user then user refferel link will be created and visible at user dashboard and that user will be joined to mlm logic(see below in detail)

1. user account section: 
  - when user purchases anything, it will be activated and can see refferel link at his account section(share and copy options must be there, refferel link like https://wearnearn.com/register?spid=#123 - where spid is sponsor id)
  - user registered by link of sponsor will be at downline of that sponsor - also keep track upto 7 such levels
  - if user registered without refferel link then the tree will filled left to right like below

       A
      /|\
     / | \
    B  C  D
   /|\ .  .
  / | \
upto level 7


2. commission distribution:
  - each product must have commission amount stored into table
  - for joining(first time purchase) commission distribution will go as follow
    - company: 25% of commission amount and sponsors: 75%. sponsors 75% further distribution:
    - 70% of that 75% will go to sponsors and 30% will be paid to user itself in 4 weeks e.g. if amount is 100 then 25/week
    - 70% amount will be further distributed to sponsors level wise:
      - level 1: 20%, level 2: 15%, level 3: 10%, level 4: 10%, level 5: 5%, level 6: 5%, level 7: 5%
  - for repurchase(purchasing again after first one) commission distribution will go as follow
    - if user's three members have completed the level 1 team(have done 3-3 target each) then user will be eligible for repurchase income
    - company: 25% of commission amount and sponsors: 75%. sponsors 75% further distribution:
      - level 1: 25%, level 2: 20%, level 3: 15%, level 4: 15%, level 5: 10%, level 6: 10%, level 7: 5%
      - at the end of month if user have not purchased rs. 500 or above or have not done the kyc then he is not eligible to take the income hence it will rolled up to company



User Registers (no purchase yet)
Insert into User table only:
{
  id: 101,
  name: "Ravi",
  email: "ravi@example.com",
  sponsorId: 45,   // if came via referral link
  isActive: false, // ❌ not active yet
  referralCode: null
}
👉 Do nothing in MatrixNode or Hierarchy at this stage.

2. User Places First Paid Order (Activation)
Inside your payment webhook transaction:
1. Check if this is first paid order
  const paidCount = await tx.order.count({
    where: { userId: order.userId, status: "paid" }
  });
  const isJoining = paidCount === 1;

2. Activate user
  await tx.user.update({
    where: { id: order.userId },
    data: {
      isActive: true,
      referralCode: crypto.randomUUID().slice(0, 8) // short code
    }
  });

3. Find placement slot
  If sponsorId exists → BFS find under sponsor.
  Else → BFS from company root.

  const user = await tx.user.findUnique({ where: { id: order.userId }});
  const slot = user!.sponsorId
    ? await bfsFindOpenSlot(user!.sponsorId)
    : await bfsFindOpenSlot(await getGlobalRootId(tx));

4. Insert into MatrixNode
  await tx.matrixNode.create({
    data: {
      userId: user!.id,
      parentId: slot.parentId,
      position: slot.position
    }
  });
👉 This fixes the user’s position in the MLM tree.

5. Update Hierarchy
  Insert rows for all uplines up to depth 7.
  Example: Ravi (101) placed under Alice (45), Alice under Root (1):
  Hierarchy:
  (ancestor=45, descendant=101, depth=1)
  (ancestor=1, descendant=101, depth=2)

  Code sketch:
  const uplines = await getUplines(slot.parentId, 7); // BFS fetch ancestors
  for (let i = 0; i < uplines.length; i++) {
    await tx.hierarchy.create({
      data: {
        ancestorId: uplines[i],
        descendantId: user!.id,
        depth: i + 1
      }
    });
  }
6. Trigger joining commission distribution
  Use Hierarchy to fetch uplines and give level-based commissions.
  Give self-commission schedule (22.5%).
  Keep company cut (25%).

3. User Makes Future Purchases (Repurchase)
  User already has:
    User.isActive = true
    Referral code
    Entry in MatrixNode (fixed position)
    Entries in Hierarchy (ancestors defined)

👉 For repurchases:
  Do not update MatrixNode or Hierarchy.
  Just run repurchase commission logic:
  Check the 3–3 rule.
  Distribute commissions up the upline using Hierarchy.



Commission Distribution Flow
1. Weekly Commission to User (Self Income)
  In your MLM plan, the self weekly commission (22.5%) is given to active users.
  You should not credit money daily in real wallet, instead:
  Maintain a virtual wallet (Wallet table).
  Add commissions as ledger entries (credit transactions).
  Users will later request withdrawal.
  Wallet table design:
  
  model Wallet {
    id          Int      @id @default(autoincrement())
    userId      Int
    balance     Decimal  @default(0.0) // running balance
    transactions WalletTransaction[]
  }

  model WalletTransaction {
    id          Int      @id @default(autoincrement())
    walletId    Int
    type        String   // 'credit' or 'debit'
    amount      Decimal
    source      String   // 'joining_bonus', 'repurchase_bonus', 'withdrawal'
    referenceId Int?     // e.g., orderId, payoutId
    createdAt   DateTime @default(now())
  }

👉 Each week, a cron job runs:
  Check eligible users (active users who meet 3–3 or other criteria).
  Calculate commission for the week.
  Insert WalletTransaction row (credit).
  Update Wallet.balance.

2. Commission Distribution to Upline
Whenever a new order is placed:
  Use the Hierarchy table to fetch uplines up to level 7.
  For each upline, calculate commission %.
  Insert WalletTransaction rows for each upline’s wallet.

3. How Wallet Works
  Balance is never edited directly by users.
  Only system processes (commission, payout, admin adjustment) change balance.
  Each change must have a matching transaction row (ledger for audit).
  Balance = SUM(all credits) − SUM(all debits).




Withdrawals (User Side)
1. User Requests Withdrawal
  User goes to dashboard → “Withdraw Funds”.
  They enter amount + bank/UPI details.
  Insert into WithdrawalRequest table.

  model WithdrawalRequest {
    id          Int       @id @default(autoincrement())
    userId      Int
    amount      Decimal
    status      String    // 'pending' | 'approved' | 'rejected' | 'paid'
    createdAt   DateTime  @default(now())
    processedAt DateTime?
    paymentRef  String?   // txn id / UTR
  }

  Validation:
    Amount ≤ Wallet.balance
    Amount ≥ Minimum withdrawal limit (say ₹500)
    Deduct TDS / charges if required.

2. Admin Reviews & Approves
  Admin has panel → sees withdrawal requests.
  Admin can Approve or Reject.
  On Reject → request closed, balance stays intact.
  On Approve:
    Deduct from wallet (WalletTransaction debit entry).
    Mark WithdrawalRequest.status = approved.

3. Payout Handling
After approval, you have 2 choices:
Option A: Manual Payout
  Admin manually sends via Bank/UPI/PayPal.
  Enter reference ID (UTR / transaction id).
  Mark request as paid.
Option B: Automated Payout
  Integrate with payout APIs (RazorpayX, Paytm Payouts, Cashfree).
  When admin approves, system calls payout API.
  API responds with success/failure → update WithdrawalRequest.