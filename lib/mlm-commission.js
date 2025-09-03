import { PrismaClient } from '@prisma/client';
import { isRepurchaseEligible } from './mlm-matrix.js';

const prisma = new PrismaClient();

// Commission configuration - EXACT PERCENTAGES AS SPECIFIED
// Total commission split: 30% company + 70% users
// Of the 70% users: 80% goes to levels, 20% goes to self income
const JOIN_SPLIT = {
  company: 0.30,  // 30% company  
  sponsorsBucket: 0.70,  // 70% users total
  // Of the 70% user portion: 80% to levels + 20% to self income
  sponsorsTotal: 0.80,  // 80% of user portion goes to levels 
  selfPortion: 0.20     // 20% of user portion goes to self income (₹140 from ₹700)
};

// JOINING ORDER - Sponsor commission distribution (percentages of total commission amount)
const JOIN_LEVELS = { 
  1: 0.25,  // Level 1: 25% of commission
  2: 0.20,  // Level 2: 20% of commission
  3: 0.15,  // Level 3: 15% of commission
  4: 0.10,  // Level 4: 10% of commission
  5: 0.10   // Level 5: 10% of commission
};

// REPURCHASE ORDER - Same distribution as joining
const REPURCHASE_LEVELS = { 
  1: 0.25,  // Level 1: 25%
  2: 0.20,  // Level 2: 20%
  3: 0.15,  // Level 3: 15%
  4: 0.10,  // Level 4: 10%
  5: 0.10   // Level 5: 10%
};

/**
 * Check if user has formed Level 1 team eligibility for self weekly income
 * User must have:
 * 1. 3 direct referrals (A, B, C)
 * 2. All 3 must have made at least one purchase
 * 3. User must have received L1 commissions from all 3
 */
async function hasLevel1TeamEligibility(tx, userId) {
  console.log('Checking Level 1 team eligibility for user:', userId);
  
  // Get user's direct referrals
  const directReferrals = await tx.user.findMany({
    where: { sponsorId: userId },
    select: { id: true, fullName: true }
  });
  
  console.log(`User ${userId} has ${directReferrals.length} direct referrals`);
  
  if (directReferrals.length < 3) {
    console.log('Not eligible: Less than 3 direct referrals');
    return false;
  }
  
  // Check if all 3 directs have made purchases and user received commissions
  let qualifiedDirects = 0;
  
  for (const direct of directReferrals.slice(0, 3)) { // Only check first 3
    // Check if this direct has made any paid purchase
    const paidOrders = await tx.order.count({
      where: { 
        userId: direct.id,
        paidAt: { not: null }
      }
    });
    
    if (paidOrders > 0) {
      // Check if user received L1 commission from this direct
      const l1Commission = await tx.ledger.count({
        where: {
          userId: userId,
          type: 'sponsor_commission',
          levelDepth: 1,
          ref: { contains: ':1:' } // Level 1 commission reference
        }
      });
      
      if (l1Commission > 0) {
        qualifiedDirects++;
      }
    }
  }
  
  console.log(`User ${userId} has ${qualifiedDirects} qualifying direct referrals with purchases`);
  
  const isEligible = qualifiedDirects >= 3;
  console.log(`User ${userId} Level 1 team eligibility: ${isEligible}`);
  
  return isEligible;
}

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
  
  // MLM commissions work ONLY on products with type "MLM" and mlmPrice set
  if (product.type !== 'MLM') {
    throw new Error(`MLM commission only applies to products with type "MLM". Product ${product.id} has type: ${product.type}`);
  }
  
  if (!product.mlmPrice || product.mlmPrice <= 0) {
    throw new Error(`MLM commission requires mlmPrice to be set for product ${product.id}. Current mlmPrice: ${product.mlmPrice}`);
  }
  
  // Calculate total commission amount (in paisa) - ONLY from mlmPrice
  const mlmPriceInPaisa = Math.floor(product.mlmPrice * 100); // Convert ₹ to paisa
  const totalCommission = mlmPriceInPaisa * (order.quantity || 1);
  
  console.log(`MLM Commission calculation: Product ${product.id} (${product.type}), MLM Price: ₹${product.mlmPrice}, Quantity: ${order.quantity || 1}, Total Commission: ₹${totalCommission/100}`);
  
  // Company cut: 30% of MLM price
  const companyCut = Math.floor(totalCommission * JOIN_SPLIT.company);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company`,
      description: `Company cut from joining order ${order.id}`
    }
  });
  
  // User portion: 70% of commission (₹700 from ₹1000)
  const userPortion = totalCommission - companyCut;
  
  // Fixed self income: 20% of user portion (₹140 from ₹700)
  const selfIncome = Math.floor(userPortion * JOIN_SPLIT.selfPortion);
  
  // Level distribution pool: 80% of user portion (₹560 from ₹700)
  const levelPool = userPortion - selfIncome;
  
  // Calculate sponsor distributions (percentages of the ₹700 user portion, NOT total commission)
  let sponsorTotal = 0;
  
  console.log(`Joining commission breakdown: Total=${totalCommission}, Company=${companyCut}, UserPortion=${userPortion}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });
  
  // Distribute sponsor commissions across levels (calculated on userPortion, not totalCommission)
  for (const ancestor of ancestors) {
    const levelPercentage = JOIN_LEVELS[ancestor.depth] || 0;
    if (!levelPercentage) continue;
    
    // Calculate level amount from user portion (₹700), not total commission (₹1000)
    const levelAmount = Math.floor(userPortion * levelPercentage);
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
          description: `Level ${ancestor.depth} joining commission from order ${order.id}`
        }
      });
      
      // Credit to beneficiary wallet
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: levelAmount } }
      });
      
      // Record commission entry
      await tx.commission.create({
        data: {
          userId: beneficiary.id,
          fromUserId: order.userId,
          orderId: order.id,
          amount: levelAmount,
          level: ancestor.depth,
          type: 'joining',
          description: `Level ${ancestor.depth} joining commission`
        }
      });
      
      sponsorTotal += levelAmount;
    } else {
      // Rollup to company if ineligible
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: levelAmount, 
          levelDepth: ancestor.depth,
          ref: `${order.id}:${ancestor.depth}:rollup`,
          description: `Level ${ancestor.depth} rollup from order ${order.id} (inactive user)`
        }
      });
    }
  }
  
  // Create 4 weekly self-payout schedule for self income (fixed ₹35/week for ₹1000 product)
  if (selfIncome > 0) {
    await createSelfPayoutSchedule(tx, order.userId, order.id, selfIncome);
  }
  
  console.log(`Joining commission processed: Total=${totalCommission}, Company=${companyCut}, LevelPool=${levelPool}, Sponsors=${sponsorTotal}, Self=${selfIncome}`);
}

/**
 * Handle commission distribution for repurchase orders
 */
export async function handleRepurchaseCommission(tx, order) {
  console.log('Processing repurchase commission for order:', order.id);
  
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });
  
  if (!product) {
    throw new Error('Product not found for commission calculation');
  }
  
  // MLM commissions work ONLY on products with type "MLM" and mlmPrice set
  if (product.type !== 'MLM') {
    throw new Error(`MLM commission only applies to products with type "MLM". Product ${product.id} has type: ${product.type}`);
  }
  
  if (!product.mlmPrice || product.mlmPrice <= 0) {
    throw new Error(`MLM commission requires mlmPrice to be set for product ${product.id}. Current mlmPrice: ${product.mlmPrice}`);
  }
  
  // Calculate total commission amount (in paisa) - ONLY from mlmPrice
  const mlmPriceInPaisa = Math.floor(product.mlmPrice * 100); // Convert ₹ to paisa
  const totalCommission = mlmPriceInPaisa * (order.quantity || 1);
  
  console.log(`MLM Repurchase Commission calculation: Product ${product.id} (${product.type}), MLM Price: ₹${product.mlmPrice}, Quantity: ${order.quantity || 1}, Total Commission: ₹${totalCommission/100}`);
  
  // Company cut: 30% of MLM price
  const companyCut = Math.floor(totalCommission * JOIN_SPLIT.company);
  await tx.ledger.create({ 
    data: { 
      userId: null, 
      type: "company_fund", 
      amount: companyCut, 
      ref: `${order.id}:company`,
      description: `Company cut from repurchase order ${order.id}`
    }
  });
  
  // User portion: 70% distributed across levels (no self income on repurchase)
  const userPortion = totalCommission - companyCut;
  console.log(`Repurchase commission breakdown: Total=${totalCommission}, Company=${companyCut}, UserPortion=${userPortion}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });
  
  // Distribute across levels (calculated on userPortion, not totalCommission)
  for (const ancestor of ancestors) {
    const levelPercentage = REPURCHASE_LEVELS[ancestor.depth] || 0;
    if (!levelPercentage) continue;
    
    // Calculate level amount from user portion (₹700), not total commission (₹1000)
    const levelAmount = Math.floor(userPortion * levelPercentage);
    const beneficiary = ancestor.ancestor;
    
    // Check repurchase eligibility (3-3 rule + other conditions)
    const eligible = await isRepurchaseEligible(tx, beneficiary.id);
    
    if (eligible && beneficiary.isActive) {
      // Credit to beneficiary
      await tx.ledger.create({
        data: { 
          userId: beneficiary.id, 
          type: "repurchase_commission", 
          amount: levelAmount, 
          levelDepth: ancestor.depth,
          ref: `${order.id}:${ancestor.depth}:rep`,
          description: `Level ${ancestor.depth} repurchase commission from order ${order.id}`
        }
      });
      
      await tx.user.update({ 
        where: { id: beneficiary.id }, 
        data: { walletBalance: { increment: levelAmount } }
      });
      
      // Record commission entry
      await tx.commission.create({
        data: {
          userId: beneficiary.id,
          fromUserId: order.userId,
          orderId: order.id,
          amount: levelAmount,
          level: ancestor.depth,
          type: 'repurchase',
          description: `Level ${ancestor.depth} repurchase commission`
        }
      });
      
      console.log(`Level ${ancestor.depth} repurchase commission: ${levelAmount} paisa to user ${beneficiary.id}`);
    } else {
      // Roll up to company
      await tx.ledger.create({
        data: { 
          userId: null, 
          type: "rollup_to_company", 
          amount: levelAmount, 
          levelDepth: ancestor.depth, 
          ref: `${order.id}:${ancestor.depth}:rep-roll`,
          description: `Level ${ancestor.depth} repurchase commission rolled to company (ineligible beneficiary)`
        }
      });
      
      console.log(`Level ${ancestor.depth} repurchase commission rolled to company: ${levelAmount} paisa`);
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
  console.log(`Creating self-payout schedule for user ${userId}, order ${orderId}, amount ${amount} paisa (Fixed ₹35/week for ₹1000 product)`);
  
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
