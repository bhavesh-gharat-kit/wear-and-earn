// Commission configuration - EXACT PERCENTAGES AS SPECIFIED
const JOIN_SPLIT = {
  company: 0.30,  // 30% company
  sponsorsBucket: 0.70,  // 70% users total
  sponsorsPortionOfBucket: 0.70, // 70% of the 70% = 49% of total (Sponsor Income)
  selfPortionOfBucket: 0.30       // 30% of the 70% = 21% of total (Self Income)
};

// JOINING ORDER - Sponsor Income distribution (70% of the 70%) - 5 LEVELS
const JOIN_LEVELS = { 
  1: 0.25,  // Level 1: 25%
  2: 0.20,  // Level 2: 20%
  3: 0.15,  // Level 3: 15%
  4: 0.10,  // Level 4: 10%
  5: 0.10   // Level 5: 10%
};

// REPURCHASE ORDER - Sponsor distribution (70% total) - 5 LEVELS
const REPURCHASE_LEVELS = { 
  1: 0.25,  // Level 1: 25%
  2: 0.20,  // Level 2: 20%
  3: 0.15,  // Level 3: 15%
  4: 0.10,  // Level 4: 10%
  5: 0.10   // Level 5: 10%
};

function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export async function handlePaidJoining(tx, order) {
  // Calculate total commission amount from all order products
  let totalCommissionAmount = 0;
  if (order.orderProducts && order.orderProducts.length > 0) {
    totalCommissionAmount = order.orderProducts.reduce((sum, orderProduct) => {
      const commissionPerUnit = orderProduct.product?.commissionAmount || 0;
      return sum + (commissionPerUnit * orderProduct.quantity);
    }, 0);
  }
  
  const C = totalCommissionAmount;
  if (C <= 0) {
    console.log('No commission to distribute for joining order:', order.id);
    return; // No commission to distribute
  }
  
  console.log(`Processing joining commission: ₹${C} for order ${order.id}`);
  
  const companyCut = Math.floor(C * JOIN_SPLIT.company);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company:join`,
      description: `Company fund from joining order ${order.id}`
    }
  });

  const bucket = C - companyCut; // 70% of total
  const sponsorsPot = Math.floor(bucket * JOIN_SPLIT.sponsorsPortionOfBucket); // 49% of total
  const selfPot = bucket - sponsorsPot; // 21% of total

  // Get user hierarchy (ancestors) up to 5 levels
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    orderBy: { depth: "asc" },
    include: { ancestor: true }
  });

  console.log(`Found ${ancestors.length} ancestors for joining commission distribution`);

  // Distribute sponsorsPot over 5 levels with idempotency
  for (const a of ancestors) {
    const pct = JOIN_LEVELS[a.depth] || 0;
    if (!pct) continue;
    
    const levelAmt = Math.floor(sponsorsPot * pct);
    const beneficiary = a.ancestor;
    const eligible = beneficiary?.isActive;
    const idempotencyKey = `${order.id}:${a.depth}:join`;

    // Check for duplicate processing
    const existingLedger = await tx.ledger.findUnique({
      where: { ref: idempotencyKey }
    });
    
    if (existingLedger) {
      console.log(`Skipping duplicate commission for ${idempotencyKey}`);
      continue;
    }

    if (eligible && levelAmt > 0) {
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "sponsor_commission", 
          amount: levelAmt, 
          levelDepth: a.depth,
          ref: idempotencyKey,
          description: `Level ${a.depth} joining commission from order ${order.id}`
        }
      });
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: levelAmt } }
      });
      console.log(`Paid ₹${levelAmt} joining commission to user ${beneficiary.id} at level ${a.depth}`);
    } else {
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: levelAmt, 
          levelDepth: a.depth, 
          ref: `${idempotencyKey}-roll`,
          description: `Rollup to company from ineligible user at level ${a.depth} for order ${order.id}`
        }
      });
      console.log(`Rolled up ₹${levelAmt} to company from level ${a.depth} (user inactive/ineligible)`);
    }
  }

  // Create 4 weekly self-payout schedule entries
  const instal = Math.floor(selfPot / 4);
  const remainder = selfPot - (instal * 4); // remainder to add to first instalment
  
  console.log(`Creating 4 weekly self-payout schedule: ₹${selfPot} total, ₹${instal} per week`);
  
  for (let i = 0; i < 4; i++) {
    const weeklyAmount = i === 0 ? instal + remainder : instal;
    const scheduleIdempotencyKey = `${order.id}:self:week${i + 1}`;
    
    // Check for duplicate schedule creation
    const existingSchedule = await tx.selfPayoutSchedule.findFirst({
      where: { 
        orderId: order.id,
        userId: order.userId,
        dueAt: addWeeks(order.paidAt || new Date(), i + 1)
      }
    });
    
    if (!existingSchedule) {
      await tx.selfPayoutSchedule.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          amount: weeklyAmount,
          dueAt: addWeeks(order.paidAt || new Date(), i + 1),
          ref: scheduleIdempotencyKey,
          description: `Week ${i + 1} self-payout from joining order ${order.id}`
        }
      });
      console.log(`Scheduled week ${i + 1} self-payout: ₹${weeklyAmount}`);
    }
  }
}

export async function handlePaidRepurchase(tx, order) {
  // Calculate total commission amount from all order products
  let totalCommissionAmount = 0;
  if (order.orderProducts && order.orderProducts.length > 0) {
    totalCommissionAmount = order.orderProducts.reduce((sum, orderProduct) => {
      const commissionPerUnit = orderProduct.product?.commissionAmount || 0;
      return sum + (commissionPerUnit * orderProduct.quantity);
    }, 0);
  }
  
  const C = totalCommissionAmount;
  if (C <= 0) {
    console.log('No commission to distribute for repurchase order:', order.id);
    return; // No commission to distribute
  }
  
  console.log(`Processing repurchase commission: ₹${C} for order ${order.id}`);
  
  const companyCut = Math.floor(C * 0.30); // 30% company cut for repurchase
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company:repurchase`,
      description: `Company fund from repurchase order ${order.id}`
    }
  });

  const sponsorsPot = C - companyCut; // 70% for sponsors

  // Get user hierarchy (ancestors) up to 5 levels
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    orderBy: { depth: "asc" },
    include: { ancestor: true }
  });

  console.log(`Found ${ancestors.length} ancestors for repurchase commission distribution`);

  // Distribute sponsorsPot over 5 levels with eligibility check and idempotency
  for (const a of ancestors) {
    const pct = REPURCHASE_LEVELS[a.depth] || 0;
    if (!pct) continue;
    
    const rawAmt = Math.floor(sponsorsPot * pct);
    const beneficiary = a.ancestor;
    const idempotencyKey = `${order.id}:${a.depth}:repurchase`;

    // Check for duplicate processing
    const existingLedger = await tx.ledger.findUnique({
      where: { ref: idempotencyKey }
    });
    
    if (existingLedger) {
      console.log(`Skipping duplicate repurchase commission for ${idempotencyKey}`);
      continue;
    }

    // Check repurchase eligibility (3-3 rule)
    const eligible = await isRepurchaseEligible(tx, beneficiary.id);
    
    if (eligible && rawAmt > 0) {
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "repurchase_commission", 
          amount: rawAmt, 
          levelDepth: a.depth, 
          ref: idempotencyKey,
          description: `Level ${a.depth} repurchase commission from order ${order.id}`
        }
      });
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: rawAmt } }
      });
      console.log(`Paid ₹${rawAmt} repurchase commission to user ${beneficiary.id} at level ${a.depth} (3-3 rule passed)`);
    } else {
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: rawAmt, 
          levelDepth: a.depth, 
          ref: `${idempotencyKey}-roll`,
          description: `Rollup to company from ineligible user at level ${a.depth} for order ${order.id} (3-3 rule failed)`
        }
      });
      console.log(`Rolled up ₹${rawAmt} to company from level ${a.depth} (3-3 rule failed for user ${beneficiary.id})`);
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
