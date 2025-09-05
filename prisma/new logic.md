MLM Pool Plan – Final Detailed Spec
1) Core Definitions
- Product Price (Pr): The price of the item itself (e.g., ■1200).
- MLM Price (Pm): The price set by Admin at product creation (e.g., ■200).
■ User sees Total Price = Pr + Pm (■1200 + ■200 = ■1400).
- Company Share: 30% of Pm.
- Pool Share: 70% of Pm.
- Referral Code: Generated only after user makes their first purchase.
- Sponsor/Referrer: Used only to track who referred whom (for team formation).
- Team Formation: A team is formed when 3 referred users make their first purchase.
- Wallet: Internal ledger where payouts are credited.
- KYC: Compulsory for withdrawals.
2) First Purchase Flow
- When a user makes their first purchase:
- 20% of Pool Share → reserved as Self Income.
• Paid in 4 equal weekly installments.
• Example: If Pm = ■200 → Pool Share = ■140 → Self Income = ■28 → user gets ■7/week × 4.
- Remaining 80% of Pool Share → goes to Turnover Pool.
3) Repurchase Flow
- On repurchases, 100% of Pool Share (70% of Pm) → goes to Turnover Pool.
- No self income on repurchases.
4) Team & Level Rules
- Team Formation: Every 3 successful referrals (first purchase completed) = 1 team.
- Levels:
- L1: 1 team → enter L1 pool.
- L2: 9 teams → promoted to L2 pool.
- L3: 27 teams → promoted to L3 pool.
- L4: 81 teams → promoted to L4 pool.
- L5: 243 teams → promoted to L5 pool.
- Promotion Rule: When promoted, user leaves old level and stays permanently in the higher one.
- Cascade Rule: If downline members form teams, those teams also count upward for their uplines.
- Unlimited Referrals: No 3×3 restriction.
5) Pool Structure (Distribution)
- At distribution time, Turnover Pool is split:
- L1 → 30%
- L2 → 20%
- L3 → 20%
- L4 → 15%
- L5 → 15%
- If no users in a level → that portion reverts to the company.
6) Pool Distribution Logic
- Triggered by Admin anytime.
- Steps:
1. Calculate pool balance.
2. Split into L1–L5 percentages.
3. Within each level, share is equally divided among all users.
- Example:
• Pool = ■1,00,000
• L1 = 30% = ■30,000• If 50 users in L1 → each gets ■600.
7) Wallet & Withdrawals
- All earnings (self income + pool distribution) go into the wallet.
- Minimum withdrawal: ■300
- KYC compulsory before withdrawal.
- Admin approval required before payout.
8) Admin Controls
- Set MLM Price at product creation.
- Trigger pool distribution anytime.
- View pool balance, user levels, distribution logs.
- Approve/reject withdrawals.
9) Edge Cases
1. No users in a level → share reverts to company.
2. Refunds → rollback self income + pool contribution.
3. Inactive users → no effect (since no fixed matrix).
4. Permanent levels → once achieved, cannot be lost.
5. Referral Code → only unlocks after first purchase.Wild Tree Example
This diagram shows how the new "wild" referral tree works: - A refers B, C, D → when 3 purchase,
A forms 1 team.
- C refers X, Y, Z → this forms a team for C and also contributes upward to A.
- Y refers P, Q, R → this forms a team for Y, and also counts upward for C and A.
This cascading team logic builds dynamically without fixed slots.