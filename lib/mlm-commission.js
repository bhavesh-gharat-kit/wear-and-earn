import { PrismaClient } from '@prisma/client';
import { isRepurchaseEligible } from './mlm-matrix.js';

const prisma = new PrismaClient();

// Commission configuration - EXACT PERCENTAGES AS SPECIFIED
// Total commission split: 30% company + 70% users
// Of the 70% users: Sponsors get their portion + Self gets remaining
const JOIN_SPLIT = {
  company: 0.30,  // 30% company  
  sponsorsBucket: 0.70,  // 70% users total
  // Sponsor levels take their percentages from commission, remainder goes to self income
  sponsorsTotal: 0.80,  // L1(25%) + L2(20%) + L3(15%) + L4(10%) + L5(10%) = 80%
  selfPortion: 0.20     // Remaining 20% goes to self income (from the commission amount)
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
  
  // User portion: 70% of commission
  const userPortion = totalCommission - companyCut;
  
  // Calculate sponsor distributions (L1=25%, L2=20%, L3=15%, L4=10%, L5=10% of total commission)
  let sponsorTotal = 0;
  
  console.log(`Joining commission breakdown: Total=${totalCommission}, Company=${companyCut}, UserPortion=${userPortion}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });
  
  // Distribute sponsor commissions across levels
  for (const ancestor of ancestors) {
    const levelPercentage = JOIN_LEVELS[ancestor.depth] || 0;
    if (!levelPercentage) continue;
    
    const levelAmount = Math.floor(totalCommission * levelPercentage);
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
  
  // Calculate self income: remaining amount after sponsor distributions
  const selfIncome = userPortion - sponsorTotal;
  
  // Create 4 weekly self-payout schedule for self income
  if (selfIncome > 0) {
    await createSelfPayoutSchedule(tx, order.userId, order.id, selfIncome);
  }
  
  console.log(`Joining commission processed: Total=${totalCommission}, Company=${companyCut}, Sponsors=${sponsorTotal}, Self=${selfIncome}`);
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
  
  // Sponsors portion: 70% distributed across levels
  console.log(`Repurchase commission breakdown: Total=${totalCommission}, Company=${companyCut}`);
  
  // Get ancestors for level-wise distribution (5 levels max)
  const ancestors = await tx.hierarchy.findMany({
    where: { descendantId: order.userId, depth: { lte: 5 } },
    include: { ancestor: true },
    orderBy: { depth: "asc" }
  });
  
  // Distribute across levels
  for (const ancestor of ancestors) {
    const levelPercentage = REPURCHASE_LEVELS[ancestor.depth] || 0;
    if (!levelPercentage) continue;
    
    const levelAmount = Math.floor(totalCommission * levelPercentage);
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
