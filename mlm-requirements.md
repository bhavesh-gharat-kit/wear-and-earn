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

  -------
  for more explanation 
  High-level shape
 E-commerce does what it always does (cart→checkout→paid order).
 On ﬁrst paid order, the user becomes Ac ve, gets a referral link, and is inserted into the MLM
tree.
 If they used a sponsor link → they’re placed under that sponsor.
If not → auto-ﬁller places them le -to-right in a 3-wide matrix (as in your A → B,C,D example)
up to 7 levels depth from the global root.
 Commission engine runs per order:
o Joining order: 25% Company, 75% “sponsors+user” → of that 75%, 70% sponsors (split
by levels), 30% to the buyer paid over 4 weekly installments.
o Repurchase order: 25% Company, 75% sponsors (level split diﬀers). Repurchase
eligibility rules apply (3-3 rule). Month-end ineligibility causes sponsor share to roll to
company.
 No refunds (your constraint), but we s ll design idempotency.
Data model (Prisma)
Money = paisa (integers). Avoid ﬂoats.
// prisma/schema.prisma
model User {
id
Int
@id @default(autoincrement())
name
String
email
String @unique
passwordHash String
phone
String? @unique
referralCode String @unique // shown in dashboard
sponsorId
Int?
// null if placed by auto-ﬁller
sponsor
User? @rela on("UserSponsor", ﬁelds: [sponsorId], references: [id])
referrals
User[] @rela on("UserSponsor")
isAc ve
Boolean @default(false) // turns true on ﬁrst PAID order
isKycApproved Boolean @default(false)
lastMonthPurchase Int
@default(0) // paisa aggregated by month-end job
monthlyPurchase Int
@default(0) // paisa for current month
isEligibleRepurchase Boolean @default(false) // 3-3 rule ﬂag
walletBalance Int
@default(0) // withdrawable
pendingSelfJoinPayout Int @default(0) // not used; payouts are in schedule table
createdAt
DateTime @default(now())
updatedAt
DateTime @updatedAt
node
MatrixNode?
wallets
Ledger[]
orders
Order[]
}model MatrixNode {
userId Int @id
user
User @rela on(ﬁelds: [userId], references: [id])
parentId Int? // null for global root
parent MatrixNode? @rela on("MatrixParent", ﬁelds: [parentId], references: [userId])
children MatrixNode[] @rela on("MatrixParent")
posi on Int? // 1..3 rela ve to parent (tri-matrix width)
}
model Hierarchy {
// closure table for 7-level lookups
id
Int @id @default(autoincrement())
ancestorId Int
descendantId Int
depth
Int
// 1..7
@@unique([ancestorId, descendantId])
@@index([descendantId, depth])
@@index([ancestorId, depth])
}
model Product {
id
Int @id @default(autoincrement())
name
String
price
Int // paisa
commissionAmount Int // paisa (per item)
isAc ve
Boolean @default(true)
createdAt
DateTime @default(now())
}
model Order {
id
Int @id @default(autoincrement())
userId
Int
user
User @rela on(ﬁelds: [userId], references: [id])
productId Int
product
Product @rela on(ﬁelds: [productId], references: [id])
amount
Int // paisa
quan ty Int @default(1)
isJoiningOrder Boolean // true if ﬁrst ever paid order for this user
status
String // created|paid|failed
gateway
String // razorpay
gatewayOrderId String? @uniquepaidAt
DateTime?
createdAt DateTime @default(now())
}
model Ledger {
id
Int @id @default(autoincrement())
userId Int? // null for company/system fund
type
String // company_fund | sponsor_commission | self_joining_instalment |
repurchase_commission | rollup_to_company | withdrawal_debit | reversal
ref
String? // idempotency key: orderId:line
amount Int // +credit, -debit in paisa
levelDepth Int?
note
String?
createdAt DateTime @default(now())
@@index([userId, type])
@@index([ref])
}
model SelfPayoutSchedule {
id
Int @id @default(autoincrement())
userId Int
orderId Int
amount Int // this instalment amount
dueAt DateTime // weekly cadence
status String @default("scheduled") // scheduled|paid|skipped
createdAt DateTime @default(now())
}
model Conﬁg {
// to keep % splits adjustable without redeploy
key String @id
value Json
}
Placement rules (7 levels, 3-wide)
 If referral link is used → set sponsorId and parent = sponsor (direct child). Track up to 7
ancestors in Hierarchy.
 If no referral → use auto-ﬁller star ng from a global root user (company owner), BFS to ﬁnd
the ﬁrst parent with <3 children; insert as posi on 1..3. Create Hierarchy rows up to 7 levels.
 Keep closure table (Hierarchy) always in sync for O(1) 7-level fetch.
Auto-ﬁller (tri-matrix BFS) — server u l
// lib/matrix.tsimport prisma from "@/lib/prisma";
export async func on bfsFindOpenSlot(rootUserId: number) {
const queue: number[] = [rootUserId];
while (queue.length) {
const uid = queue.shi ()!;
const children = await prisma.matrixNode.ﬁndMany({
where: { parentId: uid },
orderBy: { posi on: 'asc' }
});
if (children.length < 3) {
const used = new Set(children.map(c => c.posi on!));
const pos = [1,2,3].ﬁnd(p => !used.has(p))!;
return { parentId: uid, posi on: pos };
}
queue.push(...children.map(c => c.userId));
}
// Should never happen if tree exists, but fallback to root
return { parentId: rootUserId, posi on: 1 };
}
export async func on placeUserInMatrix(tx, newUserId: number, parentUserId: number, posi on?:
number) {
await tx.matrixNode.create({
data: { userId: newUserId, parentId: parentUserId, posi on: posi on ?? null }
});
// Build closure up to 7 ancestors
let current = await tx.matrixNode.ﬁndUnique({ where: { userId: parentUserId }});
let depth = 1;
while (current && depth <= 7) {
await tx.hierarchy.create({
data: { ancestorId: current.userId, descendantId: newUserId, depth }
});
current = current.parentId
? await tx.matrixNode.ﬁndUnique({ where: { userId: current.parentId }})
: null;
depth++;
}
}Commission math
1) Joining Order (ﬁrst paid order for the user)
 Let C = product.commissionAmount * quan ty.
 Company fund: 25% of C.
 Sponsors + user bucket: 75% of C.
o Sponsors por on: 70% of (75% C) = 0.525 * C distributed by levels:
 L1 20%, L2 15%, L3 10%, L4 10%, L5 5%, L6 5%, L7 5%
(These percentages apply to the Sponsors por on, not to C directly.)
o Buyer self por on: 30% of (75% C) = 0.225 * C → split into 4 equal weekly instalments
(schedule rows).
If a level has no ancestor or ancestor is inac ve → that level’s share goes to company fund (roll-up).
2) Repurchase Order
 Eligibility for receiving repurchase income for an ancestor:
o The ancestor has the 3-3 rule: at least 3 directs, and each of those 3 directs has ≥3
directs (their level-1). (You can encode this as derived ﬂags.)
 Company: 25% of C.
 Sponsors por on: 75% of C split by level:
o L1 25%, L2 20%, L3 15%, L4 15%, L5 10%, L6 10%, L7 5% (again of the 75% pot).
 Month-end ineligibility sweep:

o
If a beneﬁciary’s KYC not approved OR monthlyPurchase < ₹500 in the month → their
repurchase commission for that month rolls to company.
Commission engine (order paid webhook)
Input: orderId (paid), user, product, quan ty.
Steps:
1. Mark order paid, set paidAt.
2. If user’s ﬁrst paid order → isJoiningOrder=true, set isAc ve=true, generate referralCode if not
exists, place user:
o If sponsorId present → parent = sponsor (posi on = next free 1..3).
o Else → parent = BFS auto-ﬁller from global root.
3. Build Hierarchy (up to 7).
4. Compute commission and write Ledger entries atomically with idempotency (ref =
orderId:depth:kind).
5. Update wallets and SelfPayoutSchedule (for joining self instalments).
6. Update monthlyPurchase (current month).
Pseudocode (joining) // lib/commission.ts
const JOIN_SPLIT = {
company: 0.25,
sponsorsBucket: 0.75,
sponsorsPor onOfBucket: 0.70, // rest is self
selfPor onOfBucket: 0.30};
const JOIN_LEVELS = { 1:0.20, 2:0.15, 3:0.10, 4:0.10, 5:0.05, 6:0.05, 7:0.05 };
export async func on handlePaidJoining(tx, order: Order) {
const C = order.product.commissionAmount * order.quan ty;
const companyCut = Math.ﬂoor(C * JOIN_SPLIT.company);
await tx.ledger.create({ data: { userId: null, type: "company_fund", amount: companyCut, ref:
`${order.id}:company` }});
const bucket = C - companyCut; // 75% C
const sponsorsPot = Math.ﬂoor(bucket * JOIN_SPLIT.sponsorsPor onOfBucket); // 52.5% C
const selfPot = bucket - sponsorsPot; // 22.5% C
const ancestors = await tx.hierarchy.ﬁndMany({
where: { descendantId: order.userId, depth: { lte: 7 } },
orderBy: { depth: "asc" }
});
// distribute sponsorsPot over levels
for (const a of ancestors) {
const pct = JOIN_LEVELS[a.depth] || 0;
if (!pct) con nue;
const levelAmt = Math.ﬂoor(sponsorsPot * pct);
const beneﬁciary = await tx.user.ﬁndUnique({ where: { id: a.ancestorId }});
const eligible = beneﬁciary?.isAc ve; // AND any other “inac ve means company” rules you deﬁne
if (eligible) {
await tx.ledger.create({
data: { userId: beneﬁciary.id, type: "sponsor_commission", amount: levelAmt, levelDepth: a.depth,
ref: `${order.id}:${a.depth}:join` }
});
await tx.user.update({ where: { id: beneﬁciary.id }, data: { walletBalance: { increment: levelAmt } }});
} else {
await tx.ledger.create({
data: { userId: null, type: "rollup_to_company", amount: levelAmt, levelDepth: a.depth, ref:
`${order.id}:${a.depth}:join-roll` }
});
}
}
// self 4 weekly instalments
const instal = Math.ﬂoor(selfPot / 4);const r = selfPot - (instal * 4); // remainder to add to ﬁrst instalment
for (let i = 0; i < 4; i++) {
await tx.selfPayoutSchedule.create({
data: {
userId: order.userId,
orderId: order.id,
amount: i === 0 ? instal + r : instal,
dueAt: addWeeks(order.paidAt ?? new Date(), i + 1),
}
});
}
}
Pseudocode (repurchase)
const REPURCHASE_LEVELS = { 1:0.25, 2:0.20, 3:0.15, 4:0.15, 5:0.10, 6:0.10, 7:0.05 };
export async func on handlePaidRepurchase(tx, order: Order) {
const C = order.product.commissionAmount * order.quan ty;
const companyCut = Math.ﬂoor(C * 0.25);
await tx.ledger.create({ data: { userId: null, type: "company_fund", amount: companyCut, ref:
`${order.id}:company` }});
const sponsorsPot = C - companyCut; // 75%
const ancestors = await tx.hierarchy.ﬁndMany({
where: { descendantId: order.userId, depth: { lte: 7 } },
orderBy: { depth: "asc" }
});
for (const a of ancestors) {
const pct = REPURCHASE_LEVELS[a.depth] || 0;
const rawAmt = Math.ﬂoor(sponsorsPot * pct);
const beneﬁciary = await tx.user.ﬁndUnique({ where: { id: a.ancestorId }});
const eligible = await isRepurchaseEligible(tx, beneﬁciary!.id);
if (eligible) {
await tx.ledger.create({
data: { userId: beneﬁciary!.id, type: "repurchase_commission", amount: rawAmt, levelDepth:
a.depth, ref: `${order.id}:${a.depth}:rep` }
});
await tx.user.update({ where: { id: beneﬁciary!.id }, data: { walletBalance: { increment: rawAmt } }});
} else {
await tx.ledger.create({data: { userId: null, type: "rollup_to_company", amount: rawAmt, levelDepth: a.depth, ref:
`${order.id}:${a.depth}:rep-roll` }
});
}
}
}
Repurchase eligibility (3-3 rule)
export async func on isRepurchaseEligible(tx, userId: number) {
// KYC & month >= 500 check is done in month-end sweep; real- me we enforce the 3-3 rule here:
// 1) user has >= 3 directs
// 2) at least 3 of those directs each have >= 3 directs
const directs = await tx.user.ﬁndMany({ where: { sponsorId: userId }, select: { id: true }});
if (directs.length < 3) return false;
let countWith3 = 0;
for (const d of directs) {
const dDirects = await tx.user.count({ where: { sponsorId: d.id }});
if (dDirects >= 3) countWith3++;
if (countWith3 >= 3) break;
}
return countWith3 >= 3;
}
API surface (App Router)
 Public
o POST /api/auth/register → op onal spid in query/body
o POST /api/payments/create-order (Razorpay)
o POST /api/payments/webhook (order paid → triggers placement + commissions)
 Protected (user)
o GET /api/me (wallet, referral code/link, eligibility ﬂags)
o GET /api/tree/ancestors?depth=7 and GET /api/tree/downline (paged)
o GET /api/ledger (paginated)
o POST /api/withdrawals/request (if you add payouts)
o POST /api/kyc/submit
 Admin
o GET /api/admin/orders
o GET /api/admin/ledger
o GET /api/admin/withdrawals?status=requested
o POST /api/admin/withdrawals/:id/approve|reject|mark-paid
o POST /api/admin/tree/recompute-hierarchy (maintenance)
Webhook handler (skeleton)// app/api/payments/webhook/route.ts
import prisma from "@/lib/prisma";
import { placeUserInMatrix, bfsFindOpenSlot } from "@/lib/matrix";
import { handlePaidJoining, handlePaidRepurchase } from "@/lib/commission";
import { verifyRazorpaySignature } from "@/lib/gateway";
export async func on POST(req: Request) {
const raw = await req.text();
if (!verifyRazorpaySignature(raw, req.headers)) return new Response("bad sig", { status: 400 });
const event = JSON.parse(raw);
const gatewayOrderId = event.payload?.payment?.en ty?.order_id;
const order = await prisma.order.ﬁndUnique({
where: { gatewayOrderId },
include: { product: true, user: true }
});
if (!order || order.status === "paid") return new Response("ok"); // idempotent
await prisma.$transac on(async (tx) => {
// mark paid
await tx.order.update({ where: { id: order.id }, data: { status: "paid", paidAt: new Date() }});
// ﬁrst ever paid order?
const countPaid = await tx.order.count({ where: { userId: order.userId, status: "paid" }});
const isJoining = countPaid === 1;
if (isJoining) {
// ac vate user + referral code
await tx.user.update({
where: { id: order.userId },
data: { isAc ve: true, referralCode: crypto.randomUUID().slice(0,8) }
});
// placement
const user = await tx.user.ﬁndUnique({ where: { id: order.userId }});
const parentUserId = user!.sponsorId
? user!.sponsorId
: (await bfsFindOpenSlot((await getGlobalRootId(tx))))!.parentId;
await placeUserInMatrix(tx, order.userId, parentUserId);
await handlePaidJoining(tx, { ...order, isJoiningOrder: true });
} else {await handlePaidRepurchase(tx, { ...order, isJoiningOrder: false });
}
// update monthly purchase
const add = order.amount;
await tx.user.update({
where: { id: order.userId },
data: { monthlyPurchase: { increment: add } }
});
});
return new Response("ok");
}
Scheduled jobs
1. Weekly self-payout runner (joining self 30% over 4 weeks)
o Query SelfPayoutSchedule where dueAt <= now and status=scheduled
o Credit walletBalance, write Ledger(type=self_joining_instalment), mark schedule paid.
2. Month-end ineligibility sweep (repurchase)
o For previous month, ﬁnd users with monthlyPurchase < 50000 (₹500) or
!isKycApproved.
o For all their repurchase_commission ledger entries in that month:
 Write compensa ng ledger: rollup_to_company and deduct from user wallet (if
already credited, hold nega ve or block withdrawals un l reconciled; simpler:
during the month keep repurchase in pending state, only release on month
close. I recommend pending + release, not post-debit).
o Reset monthlyPurchase=0 for new month and store last month in lastMonthPurchase.
Be er pa ern (recommended):
 For repurchase: write commission rows as pending during the month, release at month close if
eligible; else roll to company. Avoid clawbacks.
User dashboard
 Referral
o Link: h ps://wearnearn.com/register?spid=${user.id} (Copy / Share bu ons)
 Wallet
o Withdrawable balance, pending self-instalments (with dates), pending repurchase (un l
month close)
 Tree
o Directs list; compact 3-wide visual for the ﬁrst few levels; “load more” for pagina on
 Eligibility
o 3-3 rule status; KYC status; Current month purchase vs ₹500 requirementEdge cases (your list + handling)
 Sponsor inac ve → that commission goes to company (we check isAc ve or a stricter ﬂag;
treat “inac ve” as not allowed to earn).
 Mul ple users join without referral → auto-ﬁller BFS guarantees le -to-right ﬁlling under
root.
 No refunds → simplify: no reversal ﬂows; s ll keep idempotent refs in Ledger.ref.
Security & correctness
 All money muta ons inside Prisma $transac on.
 Idempotency via Ledger.ref = orderId:depth:kind.
 Input rate-limit on register/checkout; verify Razorpay webhook signature.
 Keep commission percentages in Conﬁg so business can tweak without deploy.
 Use DB indexes shown in schema for speed.