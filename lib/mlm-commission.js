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

// Commission configuration - Updated for 5-level structure
const JOIN_SPLIT = {
  company: 0.30,  // Updated: 30% company (was 25%)
  sponsorsBucket: 0.70,  // Updated: 70% users (was 75%)
  sponsorsPortionOfBucket: 0.70, // rest is self
  selfPortionOfBucket: 0.30
};

// Updated for 5-level structure (reduced from 7)
const JOIN_LEVELS = { 
  1: 0.30,  // Increased for fewer levels
  2: 0.25, 
  3: 0.20, 
  4: 0.15, 
  5: 0.10
};

// Updated for 5-level structure (reduced from 7)
const REPURCHASE_LEVELS = { 
  1: 0.35,  // Increased for fewer levels
  2: 0.25, 
  3: 0.20, 
  4: 0.15, 
  5: 0.05
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
  
  // Create 4 weekly self-payout schedule
  const installment = Math.floor(selfPot / 4);
  const remainder = selfPot - (installment * 4);
  
  for (let i = 0; i < 4; i++) {
    const amount = i === 0 ? installment + remainder : installment;
    const dueDate = new Date(order.paidAt || order.createdAt);
    dueDate.setDate(dueDate.getDate() + (i + 1) * 7); // Weekly intervals
    
    await tx.selfPayoutSchedule.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        amount: amount,
        dueAt: dueDate,
        status: 'scheduled'
      }
    });
  }
  
  console.log(`Created 4 weekly self-payout schedules of ${installment} paisa each`);
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
  
  // Company cut: 25%
  const companyCut = Math.floor(C * 0.25);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company`,
      note: `Company cut from repurchase order ${order.id}`
    }
  });
  
  // Sponsors portion: 75%
  const sponsorsPot = C - companyCut;
  
  console.log(`Repurchase commission breakdown: Total=${C}, Company=${companyCut}, Sponsors=${sponsorsPot}`);
  
  // Get ancestors for level-wise distribution
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 7 } },
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
