MLM Plan – Final Detailed Spec (3×5 Matrix, First Purchase + Repurchase)

1) Core Definitions
    • Product Price (P): The selling price of an item in the MLM program.
    • Company Share: 30% of P.
    • User Pool: 70% of P. All commission percentages reference this pool unless stated otherwise.
    • First Purchase (Joining Purchase): A user’s first-ever successful order in the system. Exactly one per user.
    • Repurchase: Any purchase by the user after their first purchase.
    • Sponsor (Referrer): The user whose referral code was used at sign-up. This relationship is used for eligibility counting and reporting, not for level path.
    • Placement Parent: The immediate upline node in the 3-wide matrix (created by BFS spillover).
    • Levels (L1…L5): Defined by placement path, not by sponsor. L1 is the buyer’s placement parent; L2 is parent’s parent; … up to L5.
    • Directs / Frontline: The first 3 placements under a user (A, B, C) in the matrix.
    • Wallet: Internal ledger that stores credited commissions. Withdrawals are paid out from here subject to rules.
Important: Commission distribution always follows the placement tree (matrix levels), not the sponsor link. The sponsor link is used to check the “3 directs” eligibility for self income.

2) Global Split Formula
For any purchase with price P:
    • Company: 30% of P
    • User Pool: 70% of P
All level/self-income calculations reference this 70% base.
Example baseline with P = ₹1000:
    • Company = ₹300
    • User Pool = ₹700

3) First Purchase Payouts (applies only once per user)
3.1 Level Commissions (placement-based)
Percentages are of the User Pool (70%):
    • L1: 25% of 70%
    • L2: 20% of 70%
    • L3: 15% of 70%
    • L4: 10% of 70%
    • L5: 10% of 70%
    • Total to Levels: 80% of the User Pool
If fewer than 5 uplines exist: Pay whatever levels exist; the unused remainder returns to the company.
Credit timing: Level commissions are credited instantly to each upline’s wallet.
3.2 Self Income (buyer’s own income)
    • Pool Size: 20% of the User Pool (i.e., the remaining part of 70%).
    • Reserve: This amount is reserved at the time of the buyer’s first purchase.
    • Eligibility to start payout: Buyer must have 3 directs (A, B, C) and each must have completed their first purchase (i.e., buyer has received L1 commissions from all three).
    • Once eligible: The reserved self income is released to the buyer’s wallet in 4 equal weekly installments (Reserve ÷ 4).
      Example: If reserve = ₹80, user gets ₹20/week × 4 weeks. If reserve = ₹140, user gets ₹35/week × 4 weeks.
    • If not yet eligible: The reserve stays locked. Eligibility achieved later starts the weekly schedule from the next weekly cycle. No lump-sum catch-up; the release is weekly until fully paid.
    • One-time only: Self income applies only to the user’s first purchase.

4) Repurchase Payouts (every purchase after first)
    • No self income for the buyer.
    • 100% of the User Pool goes to levels L1–L5 by placement path:
        ◦ L1: 30% of 70%
        ◦ L2: 20% of 70%
        ◦ L3: 20% of 70%
        ◦ L4: 15% of 70%
        ◦ L5: 15% of 70%
        ◦ Total: 100% of the User Pool
    • Fewer than 5 uplines: Missing-level amounts return to the company.
    • Credit timing: Level commissions are credited instantly to wallets.

5) Placement Rules (3-wide BFS spillover)
    • Each user can hold maximum 3 directs (frontline positions): A, B, C.
    • If more than 3 users join using the same sponsor code:
        ◦ They are placed in the sponsor’s downline using Breadth-First Search (BFS), from left to right level-by-level.
        ◦ Fill A’s frontline (A1, A2, A3), then B’s frontline (B1…B3), then C’s frontline, and so on.
    • Matrix is fixed: Inactive/unverified users still occupy their node. No reseating or skipping.
    • Commission path: Always follows the placement parent chain (not sponsor link).
    • Eligibility counting (3 directs): Counts your frontline (the first three placements under you). Extra signups placed deeper do not increase your frontline count (they may still be your sponsor referrals, but not your direct placements).
Example placement for 6 signups (P1…P6) under U:
    • U.A = P1, U.B = P2, U.C = P3 (frontline now full)
    • Next spill to U.A’s frontline: A.A = P4, A.B = P5, A.C = P6
    • Next new signup would go under U.B’s frontline, left to right.

6) Wallet & Withdrawals
6.1 Wallet Credits
    • First Purchase:
        ◦ Level commissions → instant wallet credit to uplines L1–L5.
        ◦ Self income → reserved, then released weekly in 4 equal parts (Reserve ÷ 4) after eligibility; each installment credits the wallet on the weekly cycle.
    • Repurchase:
        ◦ All level commissions → instant wallet credit to uplines L1–L5.
6.2 Withdrawal Conditions
    • Minimum withdrawable balance: ₹500 (wallet ≥ ₹500).
    • KYC: Compulsory for withdrawals (PAN/Aadhaar/ID per company policy). Commissions can accrue pre-KYC but cannot be withdrawn until KYC is approved.
    • Admin approval cycle: Withdrawal requests are time-stamped and shown in the admin panel. Admin processes approvals on a weekly cycle.
    • Payout method: As per policy (Bank/UPI). On approval, the wallet is debited and payout is executed.
Optional (policy placeholders you can decide later): processing fee %, max withdrawals per week, minimum age of commission before withdrawal, TDS/withholding, etc.

7) Edge Cases & Rules
    1. Incomplete Upline Chain: If fewer than 5 placement uplines exist for a buyer, pay existing levels only; unused commission reverts to company.
    2. Eligibility never achieved: Buyer’s reserved self income from first purchase stays locked indefinitely (until 3 directs complete first purchases). No expiry unless you define one.
    3. Multiple purchases before eligibility: Only the first purchase creates a self-income reserve. Later purchases (repurchases) do not add to self income; they only generate level commissions for uplines.
    4. Inactive / No KYC users:
        ◦ They retain their node in the matrix (affects placement and level paths).
        ◦ Their commissions can still credit to wallet; they just cannot withdraw until KYC is completed and withdrawal rules met.
    5. Refunds / order cancellations: If a purchase is refunded, reverse all related wallet credits and reserves (full rollback). (Implementation detail for devs.)
    6. Precision & rounding: Define a standard rounding rule (e.g., round to nearest paise, banker's rounding) to avoid discrepancies.

8) Worked Examples (₹1000 product)
8.1 First Purchase – Full 5-level upline exists
    • P = ₹1000 → User Pool = ₹700
    • Level commissions (instant):
        ◦ L1 ₹175 (25% of 700), L2 ₹140, L3 ₹105, L4 ₹70, L5 ₹70
    • Self income reserve: ₹140 (20% of 700)
    • Eligibility met (has A, B, C and each bought once): Release ₹35/week × 4 to buyer’s wallet.
8.2 First Purchase – Only 2 uplines exist
    • P = ₹1000 → User Pool = ₹700
    • Paid: L1 ₹175, L2 ₹140
    • Missing: L3+L4+L5 = ₹245 → returns to company
    • Self income: Reserve ₹140 for buyer; weekly release after eligibility.
8.3 Repurchase – 3 uplines exist
    • P = ₹1000 → User Pool = ₹700
    • Level payouts: L1 ₹210 (30%), L2 ₹140 (20%), L3 ₹140 (20%)
    • Missing: L4+L5 = ₹210 → returns to company
    • No self income for buyer.

9) Implementation Notes 
9.1 Wallet Logic
    • Earnings Credited
        ◦ First Purchase:
            ▪ Self Income credited weekly (20% of pool ÷ 4 weeks). Example: ₹80 ÷ 4 = ₹20/week.
            ▪ Level commissions credited instantly.
        ◦ Repurchase:
            ▪ Only level commissions credited instantly (no self income).
    • Withdrawals
        ◦ Minimum balance: ₹500
        ◦ KYC required
        ◦ Admin approval mandatory
9.2 Admin Panel Requirements
    • Approve/Reject withdrawal requests
    • See user wallet balances
    • Commission distribution logs per transaction
    • Track spillover placement in tree
9.3 Matrix Placement Algorithm (BFS)
    • Each user can have max 3 directs.
    • If more users join under same sponsor → system auto-places them left-to-right (Breadth-First Search).
    • Even inactive/unverified users hold their slot.
9.4 Commission Safety Rule
    • If a level is missing (e.g., chain ends at Level 2), the remaining levels’ commission goes to the company, not redistributed.
9.5 Referral Code Rule
    • A user receives their referral code only after purchasing their first item.
    • Without first purchase → no referral code, cannot sponsor directs.

10. Edge Cases & Clarifications
    1. Less than 3 Directs
        ◦ User not eligible for self income (weekly ₹20/₹35 etc.).
        ◦ Still eligible for level commissions if they are in someone else’s team.
    2. If purchase happens but uplines are missing
        ◦ The unused portion of 70% pool → sent back to company.
    3. Inactive Users (no KYC / no withdrawal eligibility)
        ◦ They still occupy their node in the matrix.
        ◦ But their commission share is held by company until they activate.
    4. Repurchase vs First Purchase
        ◦ First Purchase → includes self income (weekly split).
        ◦ Repurchase → no self income, only level commissions.

11. System Flow Summary (Step-by-Step)
    1. User joins → buys product (₹1000 MLM price).
    2. Referral Code Generated → only after this first purchase.
    3. System splits → 30% company (₹300), 70% user pool (₹700).
    4. First Purchase:
        ◦ Level Distribution: ₹560 (5 levels)
        ◦ Self Income: ₹140 (weekly split ₹35 × 4)
    5. Repurchase:
        ◦ Level Distribution only: 5 levels, fixed % from ₹700.
        ◦ No self income.
    6. Matrix Rule:
        ◦ Max 3 directs per user.
        ◦ Spillover fills empty slots left-to-right.
        ◦ Inactive nodes still hold position.
    7. Wallet:
        ◦ All commissions go here first.
        ◦ Withdraw only if ≥ ₹500 + KYC approved + Admin approval.
    8. If chain shorter than 5 levels → unused commission portion goes to company.



