// Commission configuration based on requirements
const JOIN_SPLIT = {
  company: 0.25,
  sponsorsBucket: 0.75,
  sponsorsPortionOfBucket: 0.70, // rest is self
  selfPortionOfBucket: 0.30
};

const JOIN_LEVELS = { 
  1: 0.20, 
  2: 0.15, 
  3: 0.10, 
  4: 0.10, 
  5: 0.05, 
  6: 0.05, 
  7: 0.05 
};

const REPURCHASE_LEVELS = { 
  1: 0.25, 
  2: 0.20, 
  3: 0.15, 
  4: 0.15, 
  5: 0.10, 
  6: 0.10, 
  7: 0.05 
};

function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export async function handlePaidJoining(tx, order) {
  const commissionAmount = order.product ? order.product.commissionAmount : 0;
  const quantity = order.orderProducts ? order.orderProducts.reduce((sum, op) => sum + op.quantity, 0) : 1;
  const C = commissionAmount * quantity;
  
  if (C <= 0) return; // No commission to distribute
  
  const companyCut = Math.floor(C * JOIN_SPLIT.company);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company` 
    }
  });

  const bucket = C - companyCut; // 75% C
  const sponsorsPot = Math.floor(bucket * JOIN_SPLIT.sponsorsPortionOfBucket); // 52.5% C
  const selfPot = bucket - sponsorsPot; // 22.5% C

  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 7 } },
    orderBy: { depth: "asc" },
    include: { ancestor: true }
  });

  // Distribute sponsorsPot over levels
  for (const a of ancestors) {
    const pct = JOIN_LEVELS[a.depth] || 0;
    if (!pct) continue;
    
    const levelAmt = Math.floor(sponsorsPot * pct);
    const beneficiary = a.ancestor;
    const eligible = beneficiary?.isActive;

    if (eligible && levelAmt > 0) {
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "sponsor_commission", 
          amount: levelAmt, 
          levelDepth: a.depth,
          ref: `${order.id}:${a.depth}:join` 
        }
      });
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: levelAmt } }
      });
    } else {
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: levelAmt, 
          levelDepth: a.depth, 
          ref: `${order.id}:${a.depth}:join-roll` 
        }
      });
    }
  }

  // Self 4 weekly instalments
  const instal = Math.floor(selfPot / 4);
  const r = selfPot - (instal * 4); // remainder to add to first instalment
  
  for (let i = 0; i < 4; i++) {
    await tx.selfPayoutSchedule.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        amount: i === 0 ? instal + r : instal,
        dueAt: addWeeks(order.paidAt || new Date(), i + 1),
      }
    });
  }
}

export async function handlePaidRepurchase(tx, order) {
  const commissionAmount = order.product ? order.product.commissionAmount : 0;
  const quantity = order.orderProducts ? order.orderProducts.reduce((sum, op) => sum + op.quantity, 0) : 1;
  const C = commissionAmount * quantity;
  
  if (C <= 0) return; // No commission to distribute
  
  const companyCut = Math.floor(C * 0.25);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company` 
    }
  });

  const sponsorsPot = C - companyCut; // 75%

  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 7 } },
    orderBy: { depth: "asc" },
    include: { ancestor: true }
  });

  for (const a of ancestors) {
    const pct = REPURCHASE_LEVELS[a.depth] || 0;
    const rawAmt = Math.floor(sponsorsPot * pct);
    const beneficiary = a.ancestor;
    const eligible = await isRepurchaseEligible(tx, beneficiary.id);

    if (eligible && rawAmt > 0) {
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "repurchase_commission", 
          amount: rawAmt, 
          levelDepth: a.depth, 
          ref: `${order.id}:${a.depth}:rep` 
        }
      });
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: rawAmt } }
      });
    } else {
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: rawAmt, 
          levelDepth: a.depth, 
          ref: `${order.id}:${a.depth}:rep-roll` 
        }
      });
    }
  }
}

export async function isRepurchaseEligible(tx, userId) {
  // Check 3-3 rule: user has >= 3 directs, and at least 3 of those directs each have >= 3 directs
  const directs = await tx.user.findMany({ 
    where: { sponsorId: userId }, 
    select: { id: true }
  });
  
  if (directs.length < 3) return false;

  let countWith3 = 0;
  for (const d of directs) {
    const dDirects = await tx.user.count({ where: { sponsorId: d.id }});
    if (dDirects >= 3) countWith3++;
    if (countWith3 >= 3) break;
  }
  
  return countWith3 >= 3;
}

export async function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
