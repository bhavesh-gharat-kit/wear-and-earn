import { PrismaClient } from '@prisma/client';
import { isRepurchaseEligible } from './mlm-matrix.js';

const prisma = new PrismaClient();

// Commission configuration - Updated   console.log(`Repurchase commission breakdown: Total=${C}, Company=${companyCut}, Sponsors=${sponsorsPot}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });

// Commission configuration - EXACT PERCENTAGES AS SPECIFIED
const JOIN_SPLIT = {
  company: 0.30,  // 30% company
  sponsorsBucket: 0.70,  // 70% users total
  sponsorsPortionOfBucket: 0.70, // 70% of the 70% = 49% of total (Sponsor Income)
  selfPortionOfBucket: 0.30       // 30% of the 70% = 21% of total (Self Income)
};

// JOINING ORDER - Sponsor Income distribution (70% of the 70%)
const JOIN_LEVELS = { 
  1: 0.25,  // Level 1: 25%
  2: 0.20,  // Level 2: 20%
  3: 0.15,  // Level 3: 15%
  4: 0.10,  // Level 4: 10%
  5: 0.10   // Level 5: 10%
};

// REPURCHASE ORDER - Sponsor distribution (70% total)
const REPURCHASE_LEVELS = { 
  1: 0.25,  // Level 1: 25%
  2: 0.20,  // Level 2: 20%
  3: 0.15,  // Level 3: 15%
  4: 0.10,  // Level 4: 10%
  5: 0.10   // Level 5: 10%
};

/**
 * Handle commission distribution for joining order (first paid order)
 */
export async function handlePaidJoining(tx, order) {
  console.log('Processing joining commission for order:', order.id);
  
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });
  
  if (!product) {
    throw new Error('Product not found for commission calculation');
  }
  
  // Calculate commission amount (convert from rupees to paisa)
  const commissionInPaisa = Math.floor(product.commissionAmount * 100);
  const C = commissionInPaisa * (order.quantity || 1);
  
  // Company cut: 25%
  const companyCut = Math.floor(C * JOIN_SPLIT.company);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company`,
      note: `Company cut from joining order ${order.id}`
    }
  });
  
  // Sponsors + user bucket: 75%
  const bucket = C - companyCut;
  const sponsorsPot = Math.floor(bucket * JOIN_SPLIT.sponsorsPortionOfBucket); // 52.5% of C
  const selfPot = bucket - sponsorsPot; // 22.5% of C
  
  console.log(`Commission breakdown: Total=${C}, Company=${companyCut}, Sponsors=${sponsorsPot}, Self=${selfPot}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });
  
  // Distribute sponsors portion across levels
  for (const ancestor of ancestors) {
    const pct = JOIN_LEVELS[ancestor.depth] || 0;
    if (!pct) continue;
    
    const levelAmount = Math.floor(sponsorsPot * pct);
    const beneficiary = ancestor.ancestor;
    
    // Check if beneficiary is eligible (active user)
    const eligible = beneficiary?.isActive;
    
    if (eligible) {
      // Credit to beneficiary
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "sponsor_commission", 
          amount: levelAmount, 
          levelDepth: ancestor.depth,
          ref: `${order.id}:${ancestor.depth}:join`,
          note: `Level ${ancestor.depth} joining commission from order ${order.id}`
        }
      });
      
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: levelAmount } }
      });
      
      console.log(`Level ${ancestor.depth} commission: ${levelAmount} paisa to user ${beneficiary.id}`);
    } else {
      // Roll up to company
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: levelAmount, 
          levelDepth: ancestor.depth, 
          ref: `${order.id}:${ancestor.depth}:join-roll`,
          note: `Level ${ancestor.depth} commission rolled to company (inactive beneficiary)`
        }
      });
      
      console.log(`Level ${ancestor.depth} commission rolled to company: ${levelAmount} paisa`);
    }
  }
  
  // Create 4 weekly self-payout schedule using dedicated function
  await createSelfPayoutSchedule(tx, order.userId, order.id, selfPot);
  
  console.log(`Joining commission processed: Total=${C}, Company=${companyCut}, Sponsors=${sponsorsPot}, Self=${selfPot}`);
}

/**
 * Handle commission distribution for repurchase order
 */
export async function handlePaidRepurchase(tx, order) {
  console.log('Processing repurchase commission for order:', order.id);
  
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });
  
  if (!product) {
    throw new Error('Product not found for commission calculation');
  }
  
  // Calculate commission amount (convert from rupees to paisa)
  const commissionInPaisa = Math.floor(product.commissionAmount * 100);
  const C = commissionInPaisa * (order.quantity || 1);
  
  // Company cut: 30% (same as joining orders)
  const companyCut = Math.floor(C * 0.30);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company`,
      note: `Company cut from repurchase order ${order.id}`
    }
  });
  
  // Sponsors portion: 70% (distributed across levels)
  const sponsorsPot = C - companyCut;
  
  console.log(`Repurchase commission breakdown: Total=${C}, Company=${companyCut}, Sponsors=${sponsorsPot}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });
  
  // Distribute across levels
  for (const ancestor of ancestors) {
    const pct = REPURCHASE_LEVELS[ancestor.depth] || 0;
    const rawAmount = Math.floor(sponsorsPot * pct);
    const beneficiary = ancestor.ancestor;
    
    // Check repurchase eligibility (3-3 rule + other conditions)
    const eligible = await isRepurchaseEligible(tx, beneficiary.id);
    
    if (eligible && beneficiary.isActive) {
      // Credit to beneficiary
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "repurchase_commission", 
          amount: rawAmount, 
          levelDepth: ancestor.depth,
          ref: `${order.id}:${ancestor.depth}:rep`,
          note: `Level ${ancestor.depth} repurchase commission from order ${order.id}`
        }
      });
      
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: rawAmount } }
      });
      
      console.log(`Level ${ancestor.depth} repurchase commission: ${rawAmount} paisa to user ${beneficiary.id}`);
    } else {
      // Roll up to company
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: rawAmount, 
          levelDepth: ancestor.depth, 
          ref: `${order.id}:${ancestor.depth}:rep-roll`,
          note: `Level ${ancestor.depth} repurchase commission rolled to company (ineligible beneficiary)`
        }
      });
      
      console.log(`Level ${ancestor.depth} repurchase commission rolled to company: ${rawAmount} paisa`);
    }
  }
}

/**
 * Convert paisa to rupees for display
 */
export function paisaToRupees(paisa) {
  return (paisa / 100).toFixed(2);
}

/**
 * Convert rupees to paisa for storage
 */
export function rupeesToPaisa(rupees) {
  return Math.floor(rupees * 100);
}

/**
 * Create self-payout schedule for joining order (4 weekly instalments)
 * @param {Object} tx - Prisma transaction object
 * @param {number} userId - User ID to create schedule for
 * @param {number} orderId - Order ID reference
 * @param {number} amount - Total amount in paisa to be paid over 4 weeks
 * @returns {Promise<void>}
 */
export async function createSelfPayoutSchedule(tx, userId, orderId, amount) {
  console.log(`Creating self-payout schedule for user ${userId}, order ${orderId}, amount ${amount} paisa`);
  
  // Divide amount into 4 weekly instalments
  const installment = Math.floor(amount / 4);
  const remainder = amount - (installment * 4);
  
  // Get order creation date for scheduling
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { paidAt: true, createdAt: true }
  });
  
  const baseDate = order?.paidAt || order?.createdAt || new Date();
  
  // Create 4 weekly schedules
  for (let week = 1; week <= 4; week++) {
    // Add remainder to first installment
    const weeklyAmount = week === 1 ? installment + remainder : installment;
    
    // Calculate due date (weekly intervals)
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + (week * 7));
    
    await tx.selfPayoutSchedule.create({
      data: {
        userId: userId,
        orderId: orderId,
        amount: weeklyAmount,
        dueAt: dueDate,
        status: 'scheduled'
      }
    });
    
    console.log(`Week ${week}: ${weeklyAmount} paisa due on ${dueDate.toISOString()}`);
  }
  
  console.log(`Created 4 weekly self-payout schedules totaling ${amount} paisa`);
}
