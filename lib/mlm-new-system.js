import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NEW MLM SYSTEM - 3x5 Matrix Implementation
// Based on the detailed specification in mlm-logic.md

// Commission configuration for the NEW SYSTEM
const COMMISSION_CONFIG = {
  // Company gets 30% of product price
  COMPANY_SHARE: 0.30,
  // User pool gets 70% of product price  
  USER_POOL: 0.70,
  
  // FIRST PURCHASE commission distribution (of 70% user pool)
  FIRST_PURCHASE: {
    // Level commissions: 80% of user pool
    LEVELS: {
      1: 0.25, // 25% of 70% = L1 gets ₹175 from ₹700
      2: 0.20, // 20% of 70% = L2 gets ₹140 from ₹700
      3: 0.15, // 15% of 70% = L3 gets ₹105 from ₹700
      4: 0.10, // 10% of 70% = L4 gets ₹70 from ₹700
      5: 0.10  // 10% of 70% = L5 gets ₹70 from ₹700
    },
    // Self income: 20% of user pool (reserved for weekly payout)
    SELF_INCOME: 0.20 // 20% of 70% = ₹140 from ₹700
  },
  
  // REPURCHASE commission distribution (of 70% user pool)
  REPURCHASE: {
    // All 100% of user pool goes to levels (no self income)
    LEVELS: {
      1: 0.30, // 30% of 70% = L1 gets ₹210 from ₹700
      2: 0.20, // 20% of 70% = L2 gets ₹140 from ₹700
      3: 0.20, // 20% of 70% = L3 gets ₹140 from ₹700
      4: 0.15, // 15% of 70% = L4 gets ₹105 from ₹700
      5: 0.15  // 15% of 70% = L5 gets ₹105 from ₹700
    }
  },
  
  // Matrix limits
  MAX_DIRECTS: 3, // Maximum 3 direct placements (A, B, C)
  MAX_LEVELS: 5,  // Maximum 5 levels deep
  
  // Wallet and withdrawal rules
  MIN_WITHDRAWAL: 50000, // ₹500 in paisa
  WEEKLY_INSTALLMENTS: 4 // Self income paid in 4 weekly installments
};

/**
 * Check if user is making their first purchase (joining purchase)
 */
async function isFirstPurchase(tx, userId) {
  const existingOrders = await tx.order.count({
    where: {
      userId: userId,
      paidAt: { not: null }
    }
  });
  
  return existingOrders === 0;
}

/**
 * Check if user has 3 directs who have all made their first purchase
 * This determines eligibility for self income weekly payouts
 */
async function checkSelfIncomeEligibility(tx, userId) {
  console.log('Checking self income eligibility for user:', userId);
  
  // Get placement-based directs (not sponsor-based)
  const placementDirects = await tx.matrixNode.findMany({
    where: { 
      parentId: userId 
    },
    include: {
      user: {
        include: {
          orders: {
            where: {
              paidAt: { not: null }
            }
          }
        }
      }
    }
  });
  
  console.log(`User ${userId} has ${placementDirects.length} placement directs`);
  
  if (placementDirects.length < 3) {
    console.log('Not eligible: Less than 3 placement directs');
    return false;
  }
  
  // Check if all 3 directs have made their first purchase
  const directsWithPurchases = placementDirects.filter(direct => 
    direct.user.orders.length > 0
  );
  
  console.log(`${directsWithPurchases.length} out of ${placementDirects.length} directs have made purchases`);
  
  const isEligible = directsWithPurchases.length >= 3;
  console.log(`User ${userId} self income eligibility: ${isEligible}`);
  
  return isEligible;
}

/**
 * Get placement-based upline chain (NOT sponsor chain)
 * This follows the matrix placement hierarchy, not referral relationships
 */
async function getPlacementUplines(tx, userId) {
  const uplines = [];
  let currentUserId = userId;
  let level = 1;
  
  while (level <= COMMISSION_CONFIG.MAX_LEVELS) {
    // Find placement parent
    const parentNode = await tx.matrixNode.findFirst({
      where: {
        userId: currentUserId
      },
      include: {
        parent: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!parentNode || !parentNode.parent) {
      break; // No more uplines
    }
    
    uplines.push({
      userId: parentNode.parent.userId,
      user: parentNode.parent.user,
      level: level
    });
    
    currentUserId = parentNode.parent.userId;
    level++;
  }
  
  return uplines;
}

/**
 * BFS algorithm to find the next available placement position
 * Implements 3-wide matrix with spillover
 */
async function findNextPlacementPosition(tx, sponsorId) {
  // Start BFS from sponsor
  const queue = [sponsorId];
  const visited = new Set();
  
  while (queue.length > 0) {
    const currentParentId = queue.shift();
    
    if (visited.has(currentParentId)) {
      continue;
    }
    visited.add(currentParentId);
    
    // Check how many direct placements this parent has
    const directPlacements = await tx.matrixNode.findMany({
      where: { parentId: currentParentId },
      orderBy: { position: 'asc' }
    });
    
    console.log(`Parent ${currentParentId} has ${directPlacements.length} direct placements`);
    
    // If parent has less than 3 directs, place here
    if (directPlacements.length < COMMISSION_CONFIG.MAX_DIRECTS) {
      const usedPositions = new Set(directPlacements.map(p => p.position));
      const availablePosition = [1, 2, 3].find(pos => !usedPositions.has(pos));
      
      return {
        parentId: currentParentId,
        position: availablePosition
      };
    }
    
    // If parent is full, add their children to queue for next level
    directPlacements.forEach(placement => {
      if (!visited.has(placement.userId)) {
        queue.push(placement.userId);
      }
    });
  }
  
  // Fallback: place under sponsor (should not happen)
  return {
    parentId: sponsorId,
    position: 1
  };
}

/**
 * Place user in matrix using BFS spillover
 */
async function placeUserInMatrix(tx, userId, sponsorId) {
  console.log(`Placing user ${userId} in matrix under sponsor ${sponsorId}`);
  
  // Find next available position
  const placement = await findNextPlacementPosition(tx, sponsorId);
  
  console.log(`Placing user ${userId} under parent ${placement.parentId} at position ${placement.position}`);
  
  // Create matrix node
  await tx.matrixNode.create({
    data: {
      userId: userId,
      parentId: placement.parentId,
      position: placement.position
    }
  });
  
  // Build hierarchy closure table for quick level queries
  const uplines = await getPlacementUplines(tx, placement.parentId);
  
  // Add immediate parent
  await tx.hierarchy.create({
    data: {
      ancestorId: placement.parentId,
      descendantId: userId,
      depth: 1
    }
  });
  
  // Add all uplines up to 5 levels
  for (const upline of uplines.slice(0, 4)) { // +1 level for each upline
    await tx.hierarchy.create({
      data: {
        ancestorId: upline.userId,
        descendantId: userId,
        depth: upline.level + 1
      }
    });
  }
  
  return placement;
}

/**
 * Handle FIRST PURCHASE commission distribution
 */
async function processFirstPurchaseCommissions(tx, order) {
  console.log('Processing FIRST PURCHASE commissions for order:', order.id);
  
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });
  
  if (!product || product.type !== 'MLM' || !product.mlmPrice) {
    throw new Error('Invalid MLM product for commission calculation');
  }
  
  const totalAmount = Math.floor(product.mlmPrice * 100 * (order.quantity || 1)); // Convert to paisa
  const companyShare = Math.floor(totalAmount * COMMISSION_CONFIG.COMPANY_SHARE);
  const userPool = totalAmount - companyShare;
  
  console.log(`First Purchase: Total=${totalAmount}, Company=${companyShare}, UserPool=${userPool}`);
  
  // Record company share
  await tx.ledger.create({
    data: {
      userId: null, // Company
      type: 'company_fund',
      amount: companyShare,
      ref: `FP_${order.id}:company`,
      description: `Company share from first purchase order ${order.id}`
    }
  });
  
  // Get placement-based uplines
  const uplines = await getPlacementUplines(tx, order.userId);
  
  // Distribute level commissions instantly
  let totalLevelPaid = 0;
  for (const upline of uplines) {
    const levelPercent = COMMISSION_CONFIG.FIRST_PURCHASE.LEVELS[upline.level];
    if (!levelPercent) continue;
    
    const levelAmount = Math.floor(userPool * levelPercent);
    totalLevelPaid += levelAmount;
    
    // Credit to upline wallet
    await tx.user.update({
      where: { id: upline.userId },
      data: { walletBalance: { increment: levelAmount } }
    });
    
    // Create ledger entry
    await tx.ledger.create({
      data: {
        userId: upline.userId,
        type: 'level_commission',
        amount: levelAmount,
        levelDepth: upline.level,
        ref: `FP_${order.id}:L${upline.level}`,
        description: `Level ${upline.level} first purchase commission from order ${order.id}`
      }
    });
    
    // Create commission record
    await tx.commission.create({
      data: {
        userId: upline.userId,
        fromUserId: order.userId,
        orderId: order.id,
        amount: levelAmount,
        level: upline.level,
        type: 'first_purchase',
        description: `Level ${upline.level} first purchase commission`
      }
    });
  }
  
  // Reserve self income for weekly payout
  const selfIncomeReserve = Math.floor(userPool * COMMISSION_CONFIG.FIRST_PURCHASE.SELF_INCOME);
  const weeklyAmount = Math.floor(selfIncomeReserve / COMMISSION_CONFIG.WEEKLY_INSTALLMENTS);
  
  console.log(`Self income reserve: ${selfIncomeReserve}, Weekly: ${weeklyAmount}`);
  
  // Create 4 weekly payout schedules
  const startDate = new Date();
  for (let week = 0; week < COMMISSION_CONFIG.WEEKLY_INSTALLMENTS; week++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (week * 7));
    
    await tx.selfPayoutSchedule.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        amount: weeklyAmount,
        dueAt: dueDate,
        status: 'scheduled',
        ref: `FP_${order.id}:W${week + 1}`,
        description: `First purchase self income - Week ${week + 1} of 4`
      }
    });
  }
  
  // Return unused commission to company if upline chain is incomplete
  const expectedLevelTotal = Math.floor(userPool * 0.80); // 80% should go to levels
  const unusedAmount = expectedLevelTotal - totalLevelPaid;
  
  if (unusedAmount > 0) {
    await tx.ledger.create({
      data: {
        userId: null, // Company
        type: 'company_fund',
        amount: unusedAmount,
        ref: `FP_${order.id}:unused`,
        description: `Unused level commission from incomplete upline chain - order ${order.id}`
      }
    });
  }
  
  return {
    companyShare,
    userPool,
    levelsPaid: totalLevelPaid,
    selfIncomeReserved: selfIncomeReserve,
    unusedReturned: unusedAmount
  };
}

/**
 * Handle REPURCHASE commission distribution
 */
async function processRepurchaseCommissions(tx, order) {
  console.log('Processing REPURCHASE commissions for order:', order.id);
  
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });
  
  if (!product || product.type !== 'MLM' || !product.mlmPrice) {
    throw new Error('Invalid MLM product for commission calculation');
  }
  
  const totalAmount = Math.floor(product.mlmPrice * 100 * (order.quantity || 1)); // Convert to paisa
  const companyShare = Math.floor(totalAmount * COMMISSION_CONFIG.COMPANY_SHARE);
  const userPool = totalAmount - companyShare;
  
  console.log(`Repurchase: Total=${totalAmount}, Company=${companyShare}, UserPool=${userPool}`);
  
  // Record company share
  await tx.ledger.create({
    data: {
      userId: null, // Company
      type: 'company_fund',
      amount: companyShare,
      ref: `RP_${order.id}:company`,
      description: `Company share from repurchase order ${order.id}`
    }
  });
  
  // Get placement-based uplines
  const uplines = await getPlacementUplines(tx, order.userId);
  
  // Distribute ALL user pool to levels (no self income for repurchase)
  let totalLevelPaid = 0;
  for (const upline of uplines) {
    const levelPercent = COMMISSION_CONFIG.REPURCHASE.LEVELS[upline.level];
    if (!levelPercent) continue;
    
    const levelAmount = Math.floor(userPool * levelPercent);
    totalLevelPaid += levelAmount;
    
    // Credit to upline wallet
    await tx.user.update({
      where: { id: upline.userId },
      data: { walletBalance: { increment: levelAmount } }
    });
    
    // Create ledger entry
    await tx.ledger.create({
      data: {
        userId: upline.userId,
        type: 'level_commission',
        amount: levelAmount,
        levelDepth: upline.level,
        ref: `RP_${order.id}:L${upline.level}`,
        description: `Level ${upline.level} repurchase commission from order ${order.id}`
      }
    });
    
    // Create commission record
    await tx.commission.create({
      data: {
        userId: upline.userId,
        fromUserId: order.userId,
        orderId: order.id,
        amount: levelAmount,
        level: upline.level,
        type: 'repurchase',
        description: `Level ${upline.level} repurchase commission`
      }
    });
  }
  
  // Return unused commission to company if upline chain is incomplete
  const unusedAmount = userPool - totalLevelPaid;
  
  if (unusedAmount > 0) {
    await tx.ledger.create({
      data: {
        userId: null, // Company
        type: 'company_fund',
        amount: unusedAmount,
        ref: `RP_${order.id}:unused`,
        description: `Unused level commission from incomplete upline chain - order ${order.id}`
      }
    });
  }
  
  return {
    companyShare,
    userPool,
    levelsPaid: totalLevelPaid,
    unusedReturned: unusedAmount
  };
}

/**
 * Generate referral code for user (only after first purchase)
 */
async function generateReferralCode(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId }
  });
  
  if (user.referralCode) {
    return user.referralCode; // Already has one
  }
  
  // Generate unique referral code
  let referralCode;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    referralCode = `WE${userId.toString().padStart(4, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const existing = await tx.user.findUnique({
      where: { referralCode }
    });
    
    if (!existing) {
      break;
    }
    
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique referral code');
  }
  
  // Update user with referral code
  await tx.user.update({
    where: { id: userId },
    data: { referralCode }
  });
  
  return referralCode;
}

/**
 * Main function to handle paid order processing
 */
export async function processMLMOrder(tx, order) {
  console.log('Processing MLM order:', order.id, 'for user:', order.userId);
  
  // Check if this is first purchase or repurchase
  const isFirst = await isFirstPurchase(tx, order.userId);
  
  console.log(`Order ${order.id} is ${isFirst ? 'FIRST PURCHASE' : 'REPURCHASE'} for user ${order.userId}`);
  
  let result;
  
  if (isFirst) {
    // Handle first purchase
    result = await processFirstPurchaseCommissions(tx, order);
    
    // Generate referral code (only after first purchase)
    const referralCode = await generateReferralCode(tx, order.userId);
    console.log(`Generated referral code: ${referralCode} for user ${order.userId}`);
    
    // Place user in matrix if not already placed
    const existingNode = await tx.matrixNode.findUnique({
      where: { userId: order.userId }
    });
    
    if (!existingNode) {
      // Find sponsor for placement
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        include: { sponsor: true }
      });
      
      if (user.sponsor) {
        const placement = await placeUserInMatrix(tx, order.userId, user.sponsorId);
        console.log(`Placed user ${order.userId} in matrix at position:`, placement);
      }
    }
  } else {
    // Handle repurchase
    result = await processRepurchaseCommissions(tx, order);
  }
  
  console.log('MLM order processing completed:', result);
  
  return {
    orderType: isFirst ? 'first_purchase' : 'repurchase',
    ...result
  };
}

export {
  COMMISSION_CONFIG,
  isFirstPurchase,
  checkSelfIncomeEligibility,
  getPlacementUplines,
  placeUserInMatrix,
  processFirstPurchaseCommissions,
  processRepurchaseCommissions,
  generateReferralCode
};
