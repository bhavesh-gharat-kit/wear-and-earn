import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NEW POOL-BASED MLM SYSTEM
// Based on the new specification in mlm-logic.md

// System Configuration
const MLM_CONFIG = {
  // Company vs Pool share split
  COMPANY_SHARE: 0.30,  // 30% to company
  POOL_SHARE: 0.70,     // 70% for MLM pool and self income
  
  // Self income configuration (only for first purchase)
  SELF_INCOME_PERCENTAGE: 0.20,  // 20% of pool share for self income
  SELF_INCOME_INSTALLMENTS: 4,   // 4 weekly installments
  
  // Pool share after self income (80% of pool share goes to global pool)
  TURNOVER_POOL_PERCENTAGE: 0.80, // 80% of pool share goes to turnover pool
  
  // Level promotion requirements (teams needed)
  LEVEL_REQUIREMENTS: {
    1: 1,    // L1: 1 team
    2: 9,    // L2: 9 teams  
    3: 27,   // L3: 27 teams
    4: 81,   // L4: 81 teams
    5: 243   // L5: 243 teams
  },
  
  // Pool distribution percentages by level
  POOL_DISTRIBUTION: {
    1: 0.30,  // L1: 30%
    2: 0.20,  // L2: 20%
    3: 0.20,  // L3: 20%
    4: 0.15,  // L4: 15%
    5: 0.15   // L5: 15%
  },
  
  // Team formation requirement
  TEAM_SIZE: 3,  // 3 first purchases needed to form a team
  
  // Withdrawal limits
  MIN_WITHDRAWAL_AMOUNT: 30000, // ₹300 in paisa (30000 paisa = ₹300)
};

/**
 * Process a purchase in the new pool-based MLM system
 * @param {Object} tx - Database transaction
 * @param {Object} order - Order object with user and products
 * @returns {Object} Processing result
 */
export async function processPoolMLMOrder(tx, order) {
  console.log(`🏊 Processing Pool MLM for order ${order.id}, user ${order.userId}`);
  
  try {
    // Get order products with MLM prices
    const orderProducts = await tx.orderProducts.findMany({
      where: { orderId: order.id },
      include: { product: true }
    });
    
    let totalMlmAmount = 0;
    let purchases = [];
    
    // Calculate total MLM amount and create purchase records
    for (const orderProduct of orderProducts) {
      const product = orderProduct.product;
      const mlmPrice = product.mlmPrice || 0;
      console.log(`[POOL-MLM] Product ID: ${product.id}, Name: ${product.name}, mlmPrice: ${mlmPrice}, Quantity: ${orderProduct.quantity}`);
      
      if (mlmPrice > 0) {
        const mlmAmountPaisa = Math.floor(mlmPrice * 100); // Convert to paisa
        const quantity = orderProduct.quantity || 1;
        const totalProductMlm = mlmAmountPaisa * quantity;
        
        totalMlmAmount += totalProductMlm;
        
        // Determine if this is first purchase or repurchase
        const isFirstPurchase = await checkIfFirstPurchase(tx, order.userId);
        
        // Create purchase record
        const purchase = await tx.purchase.create({
          data: {
            userId: order.userId,
            productId: product.id,
            orderId: order.id,
            type: isFirstPurchase ? 'first' : 'repurchase',
            mlmAmount: totalProductMlm
          }
        });
        
        purchases.push({ ...purchase, isFirstPurchase });
      } else {
        console.warn(`[POOL-MLM] Product ID ${product.id} has no valid mlmPrice, skipping for pool calculation.`);
      }
    }
    
    if (totalMlmAmount === 0) {
      console.log('No MLM amount found for this order');
      return { totalMlmAmount: 0, message: 'No MLM products in order' };
    }
    
    // Process MLM logic
    const companyShare = Math.floor(totalMlmAmount * MLM_CONFIG.COMPANY_SHARE);
    const poolShare = totalMlmAmount - companyShare;
    
    let results = [];
    
    for (const purchase of purchases) {
      const productPoolShare = Math.floor((purchase.mlmAmount / totalMlmAmount) * poolShare);
      
      if (purchase.isFirstPurchase) {
        // First Purchase: 20% self income + 80% to turnover pool
        const result = await processFirstPurchase(tx, purchase, productPoolShare);
        results.push(result);
      } else {
        // Repurchase: 100% to turnover pool
        const result = await processRepurchase(tx, purchase, productPoolShare);
        results.push(result);
      }
    }
    
    // Always ensure user has referral code after any successful payment
    // This guarantees immediate referral code generation after Razorpay payment
    console.log('🎟️ Ensuring referral code exists after successful Razorpay payment...');
    await generateReferralCodeIfNeeded(tx, order.userId);
    
    return {
      totalMlmAmount,
      companyShare,
      poolShare,
      purchases: results,
      message: 'Pool MLM processing completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error processing Pool MLM order:', error);
    throw error;
  }
}

/**
 * Check if this is the user's first purchase
 */
/**
 * Check if this is user's first MLM purchase (before creating new purchase)
 */
async function checkIfFirstPurchase(tx, userId) {
  const existingPurchases = await tx.purchase.count({
    where: { userId: userId }
  });
  
  return existingPurchases === 0;
}

/**
 * Process first purchase: Self income + pool contribution
 */
async function processFirstPurchase(tx, purchase, poolShare) {
  console.log(`💰 Processing FIRST PURCHASE for user ${purchase.userId}`);
  
  // Calculate self income and turnover pool amounts
  const selfIncomeAmount = Math.floor(poolShare * MLM_CONFIG.SELF_INCOME_PERCENTAGE);
  const turnoverPoolAmount = poolShare - selfIncomeAmount;
  
  // Create self income installments (4 weekly payments)
  const weeklyAmount = Math.floor(selfIncomeAmount / MLM_CONFIG.SELF_INCOME_INSTALLMENTS);
  const remainingAmount = selfIncomeAmount - (weeklyAmount * 3); // Add remainder to last installment
  
  const now = new Date();
  
  for (let week = 1; week <= MLM_CONFIG.SELF_INCOME_INSTALLMENTS; week++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (week * 7)); // Each week
    
    const installmentAmount = week === 4 ? remainingAmount : weeklyAmount;
    
    await tx.selfIncomeInstallment.create({
      data: {
        userId: purchase.userId,
        purchaseId: purchase.id,
        totalAmount: installmentAmount,
        weekNumber: week,
        dueDate: dueDate
      }
    });
  }
  
  // Add to turnover pool
  await addToTurnoverPool(tx, turnoverPoolAmount);
  
  // Update team formation
  await updateTeamFormation(tx, purchase.userId);
  
  // Update user level if needed
  await updateUserLevel(tx, purchase.userId);
  
  return {
    type: 'first_purchase',
    selfIncomeAmount,
    turnoverPoolAmount,
    weeklyInstallments: MLM_CONFIG.SELF_INCOME_INSTALLMENTS
  };
}

/**
 * Process repurchase: 100% to turnover pool
 */
async function processRepurchase(tx, purchase, poolShare) {
  console.log(`🔄 Processing REPURCHASE for user ${purchase.userId}`);
  
  // 100% of pool share goes to turnover pool
  await addToTurnoverPool(tx, poolShare);
  
  return {
    type: 'repurchase',
    turnoverPoolAmount: poolShare
  };
}

/**
 * Add amount to the global turnover pool
 */
async function addToTurnoverPool(tx, amount) {
  // Get or create current active pool
  let currentPool = await tx.turnoverPool.findFirst({
    where: { distributed: false },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!currentPool) {
    currentPool = await tx.turnoverPool.create({
      data: { totalAmount: 0 }
    });
    console.log(`[POOL-MLM] Created new turnover pool with id: ${currentPool.id}`);
  }
  
  // Update pool amounts
  await tx.turnoverPool.update({
    where: { id: currentPool.id },
    data: {
      totalAmount: { increment: amount },
      // Pre-calculate level amounts for distribution
      l1Amount: { increment: Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[1]) },
      l2Amount: { increment: Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[2]) },
      l3Amount: { increment: Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[3]) },
      l4Amount: { increment: Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[4]) },
      l5Amount: { increment: Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[5]) }
    }
  });
  
  console.log(`[POOL-MLM] Added ₹${amount/100} to turnover pool (poolId: ${currentPool.id})`);
}

/**
 * Update team formation when user makes first purchase
 */
async function updateTeamFormation(tx, userId) {
  // Get user's sponsor
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true }
  });
  
  if (!user.sponsorId) return;
  
  // Check if sponsor has a team for this user
  let team = await tx.team.findFirst({
    where: { 
      userId: user.sponsorId,
      isComplete: false
    },
    include: { members: true }
  });
  
  if (!team) {
    // Create new team for sponsor
    team = await tx.team.create({
      data: {
        userId: user.sponsorId,
        teamSize: 0
      },
      include: { members: true }
    });
  }
  
  // Add user to team
  await tx.teamMember.create({
    data: {
      teamId: team.id,
      userId: userId
    }
  });
  
  // Update team size
  const newTeamSize = team.members.length + 1;
  
  await tx.team.update({
    where: { id: team.id },
    data: {
      teamSize: newTeamSize,
      isComplete: newTeamSize >= MLM_CONFIG.TEAM_SIZE,
      completedAt: newTeamSize >= MLM_CONFIG.TEAM_SIZE ? new Date() : null
    }
  });
  
  // If team is complete, cascade upward
  if (newTeamSize >= MLM_CONFIG.TEAM_SIZE) {
    await cascadeTeamCompletion(tx, user.sponsorId);
  }
}

/**
 * Cascade team completion upward in sponsor chain
 */
async function cascadeTeamCompletion(tx, userId) {
  // Update team count for this user
  const completedTeams = await tx.team.count({
    where: { 
      userId: userId,
      isComplete: true
    }
  });
  
  // Get cascaded teams from downline
  const downlineTeams = await getCascadedTeamCount(tx, userId);
  const totalTeams = completedTeams + downlineTeams;
  
  // Update user's team count
  await tx.user.update({
    where: { id: userId },
    data: { 
      directTeams: completedTeams,
      teamCount: totalTeams
    }
  });
  
  // Continue cascading upward
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true }
  });
  
  if (user.sponsorId) {
    await cascadeTeamCompletion(tx, user.sponsorId);
  }
}

/**
 * Get cascaded team count from downline users
 */
async function getCascadedTeamCount(tx, userId) {
  const downlineUsers = await tx.user.findMany({
    where: { sponsorId: userId },
    select: { teamCount: true }
  });
  
  return downlineUsers.reduce((total, user) => total + user.teamCount, 0);
}

/**
 * Update user level based on team count
 */
async function updateUserLevel(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { teamCount: true, level: true }
  });
  
  let newLevel = 0;
  
  // Determine new level based on team count
  for (const [level, requirement] of Object.entries(MLM_CONFIG.LEVEL_REQUIREMENTS)) {
    if (user.teamCount >= requirement) {
      newLevel = parseInt(level);
    }
  }
  
  // Update level if it has increased (levels are permanent)
  if (newLevel > user.level) {
    await tx.user.update({
      where: { id: userId },
      data: { level: newLevel }
    });
    
    console.log(`🎉 User ${userId} promoted to level ${newLevel}`);
  }
}

/**
 * Generate referral code if user doesn't have one
 */
async function generateReferralCodeIfNeeded(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { referralCode: true }
  });
  
  if (user.referralCode) {
    console.log(`✅ User ${userId} already has referral code: ${user.referralCode}`);
    return user.referralCode;
  }
  
  // Generate unique referral code
  let referralCode;
  let attempts = 0;
  
  do {
    referralCode = `WE${userId.toString().padStart(4, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const existing = await tx.user.findUnique({
      where: { referralCode }
    });
    
    if (!existing) break;
    
    attempts++;
  } while (attempts < 10);
  
  if (attempts >= 10) {
    throw new Error('Failed to generate unique referral code');
  }
  
  // Update user with referral code
  await tx.user.update({
    where: { id: userId },
    data: { 
      referralCode,
      isActive: true
    }
  });
  
  console.log(`🎟️ Generated referral code ${referralCode} for user ${userId} after successful Razorpay payment`);
  
  return referralCode;
}

/**
 * Distribute turnover pool to users by level
 * This is called manually by admin
 */
export async function distributeTurnoverPool(poolId) {
  console.log(`💸 Distributing turnover pool ${poolId}`);
  
  return await prisma.$transaction(async (tx) => {
    // Get pool to distribute
    const pool = await tx.turnoverPool.findUnique({
      where: { id: poolId }
    });
    
    if (!pool || pool.distributed) {
      throw new Error('Pool not found or already distributed');
    }
    
    let distributionResults = [];
    
    // Distribute to each level
    for (let level = 1; level <= 5; level++) {
      const levelAmount = pool[`l${level}Amount`];
      
      if (levelAmount <= 0) continue;
      
      // Get users at this level
      const levelUsers = await tx.user.findMany({
        where: { level: level },
        select: { id: true, fullName: true }
      });
      
      if (levelUsers.length === 0) {
        console.log(`No users at level ${level}, amount goes back to company`);
        continue;
      }
      
      // Divide equally among users at this level
      const perUserAmount = Math.floor(levelAmount / levelUsers.length);
      const remainderAmount = levelAmount - (perUserAmount * levelUsers.length);
      
      // Note: Remainder goes to first user to handle paisa precision
      for (let i = 0; i < levelUsers.length; i++) {
        const user = levelUsers[i];
        const userAmount = perUserAmount + (i === 0 ? remainderAmount : 0);
        
        // Create pool distribution record
        await tx.poolDistribution.create({
          data: {
            userId: user.id,
            level: level,
            amount: userAmount,
            poolId: poolId
          }
        });
        
        // Add to wallet (amount already in paisa)
        await tx.wallet.create({
          data: {
            userId: user.id,
            type: 'pool_distribution',
            amount: userAmount,
            status: 'completed',
            reference: `pool_${poolId}`,
            description: `Level ${level} pool distribution`
          }
        });
        
        // Update user wallet balance
        await tx.user.update({
          where: { id: user.id },
          data: {
            walletBalance: { increment: userAmount }
          }
        });
        
        distributionResults.push({
          userId: user.id,
          userName: user.fullName,
          level: level,
          amount: userAmount
        });
      }
    }
    
    // Mark pool as distributed
    await tx.turnoverPool.update({
      where: { id: poolId },
      data: {
        distributed: true,
        distributedAt: new Date()
      }
    });
    
    return {
      poolId,
      totalDistributed: pool.totalAmount,
      distributions: distributionResults,
      message: 'Pool distributed successfully'
    };
  });
}

/**
 * Process weekly self income installments (cron job)
 * Note: Self income is automatically given on first purchase, no eligibility check needed
 */
export async function processWeeklySelfIncome() {
  console.log('⏰ Processing weekly self income installments');
  
  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    
    // Get due installments
    const dueInstallments = await tx.selfIncomeInstallment.findMany({
      where: {
        status: 'scheduled',
        dueDate: { lte: now }
      },
      include: { user: true }
    });
    
    let processedCount = 0;
    
    for (const installment of dueInstallments) {
      // Create wallet entry (amount is already in paisa)
      await tx.wallet.create({
        data: {
          userId: installment.userId,
          type: 'self_income',
          amount: installment.amount,
          status: 'completed',
          reference: `installment_${installment.id}`,
          description: `Self income week ${installment.weekNumber}/4`
        }
      });
      
      // Update user wallet balance
      await tx.user.update({
        where: { id: installment.userId },
        data: {
          walletBalance: { increment: installment.amount }
        }
      });
      
      // Mark installment as paid
      await tx.selfIncomeInstallment.update({
        where: { id: installment.id },
        data: {
          status: 'paid',
          paidAt: new Date()
        }
      });
      
      processedCount++;
    }
    
    return {
      processedCount,
      message: `Processed ${processedCount} self income installments`
    };
  });
}

export {
  MLM_CONFIG,
  checkIfFirstPurchase,
  processFirstPurchase,
  processRepurchase,
  addToTurnoverPool,
  updateTeamFormation,
  updateUserLevel,
  generateReferralCodeIfNeeded
};
