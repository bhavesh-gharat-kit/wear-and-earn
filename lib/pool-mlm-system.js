import prisma from './prisma.js';

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
        console.log(`🎯 Processing FIRST purchase for user ${purchase.userId} - Team formation will be triggered`);
        const result = await processFirstPurchase(tx, purchase, productPoolShare);
        results.push(result);
      } else {
        // Repurchase: 100% to turnover pool
        console.log(`🔄 Processing REPURCHASE for user ${purchase.userId} - No team formation`);
        const result = await processRepurchase(tx, purchase, productPoolShare);
        results.push(result);
      }
    }
    
    // Always ensure user has referral code after any successful payment
    // This guarantees immediate referral code generation after Razorpay payment
    console.log('🎟️ Ensuring referral code exists after successful Razorpay payment...');
    await generateReferralCodeIfNeeded(tx, order.userId);
    
    // Create hierarchy entries for team tracking (only if user has sponsor)
    console.log('🌳 Creating hierarchy entries for team tracking...');
    await createHierarchyEntries(tx, order.userId);
    
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
  
  console.log(`🔍 First purchase check for user ${userId}: ${existingPurchases} existing purchases`);
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
        amount: installmentAmount,
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
  console.log(`[DEBUG] === STARTING addToTurnoverPool ===`);
  console.log(`[DEBUG] Amount to add: ${amount} paisa (₹${amount/100})`);
  if (!amount || amount <= 0) {
    console.error(`[DEBUG] Invalid amount: ${amount}`);
    return;
  }
  let currentPool = await tx.turnoverPool.findFirst({
    where: { distributed: false },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`[DEBUG] Current pool before update:`, currentPool);
  if (!currentPool) {
    currentPool = await tx.turnoverPool.create({
      data: { totalAmount: 0 }
    });
    console.log(`[DEBUG] Created new turnover pool with id: ${currentPool.id}`);
  }
  // Calculate level amounts
  const l1Amount = Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[1]);
  const l2Amount = Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[2]);
  const l3Amount = Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[3]);
  const l4Amount = Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[4]);
  const l5Amount = Math.floor(amount * MLM_CONFIG.POOL_DISTRIBUTION[5]);
  console.log(`[DEBUG] Level amounts:`, {
    l1Amount, l2Amount, l3Amount, l4Amount, l5Amount
  });
  // Update pool amounts
  const updatedPool = await tx.turnoverPool.update({
    where: { id: currentPool.id },
    data: {
      totalAmount: { increment: amount },
      l1Amount: { increment: l1Amount },
      l2Amount: { increment: l2Amount },
      l3Amount: { increment: l3Amount },
      l4Amount: { increment: l4Amount },
      l5Amount: { increment: l5Amount }
    }
  });
  console.log(`[DEBUG] Pool after update:`, updatedPool);
  console.log(`[DEBUG] Added ₹${amount/100} to turnover pool (poolId: ${currentPool.id})`);
  console.log(`[DEBUG] === ENDING addToTurnoverPool ===`);
}

/**
 * Update team formation when user makes first purchase
 */
async function updateTeamFormation(tx, userId) {
  console.log(`🏗️ Team formation called for user ${userId}`);
  
  // Get user's sponsor
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true, fullName: true }
  });
  
  console.log(`👥 User ${userId} (${user?.fullName}) sponsor: ${user?.sponsorId}`);
  
  if (!user.sponsorId) {
    console.log(`❌ User ${userId} has no sponsor, skipping team formation`);
    return;
  }
  
  // Check if sponsor has a FORMING team (incomplete team)
  let team = await tx.team.findFirst({
    where: { 
      teamLeaderId: user.sponsorId,
      status: 'FORMING'
    },
    include: { members: true }
  });

  console.log(`🔍 Existing FORMING team for sponsor ${user.sponsorId}:`, team ? `Team ID: ${team.id}, Members: ${team.members.length}` : 'No forming team found');

  if (!team) {
    // Create new team for sponsor
    console.log(`🆕 Creating new team for sponsor ${user.sponsorId}`);
    team = await tx.team.create({
      data: {
        teamLeaderId: user.sponsorId,
        status: 'FORMING'
      }
    });
    console.log(`✅ Created team ID: ${team.id}`);
    
    // Refresh team data with members
    team = await tx.team.findUnique({
      where: { id: team.id },
      include: { members: true }
    });
  }
  
  // Check if user is already in any team for this sponsor
  const existingMembership = await tx.teamMember.findFirst({
    where: {
      userId: userId,
      team: {
        teamLeaderId: user.sponsorId
      }
    }
  });
  
  if (existingMembership) {
    console.log(`⚠️ User ${userId} already in a team for sponsor ${user.sponsorId}, skipping`);
    return;
  }
  
  // Add user to team
  console.log(`👥 Adding user ${userId} to team ${team.id}`);
  await tx.teamMember.create({
    data: {
      teamId: team.id,
      userId: userId
    }
  });
  
  // Get updated member count
  const newMemberCount = await tx.teamMember.count({
    where: { teamId: team.id }
  });
  
  console.log(`📊 Team ${team.id} new size: ${newMemberCount}/${MLM_CONFIG.TEAM_SIZE}`);
  
  // Update team status and member references
  const updateData = {
    status: newMemberCount >= MLM_CONFIG.TEAM_SIZE ? 'COMPLETE' : 'FORMING',
    completedAt: newMemberCount >= MLM_CONFIG.TEAM_SIZE ? new Date() : null
  };
  
  // Update member references for the team record
  const members = await tx.teamMember.findMany({
    where: { teamId: team.id },
    orderBy: { joinedAt: 'asc' },
    take: 3
  });
  
  if (members.length >= 1) updateData.member1Id = members[0].userId;
  if (members.length >= 2) updateData.member2Id = members[1].userId;
  if (members.length >= 3) updateData.member3Id = members[2].userId;
  
  await tx.team.update({
    where: { id: team.id },
    data: updateData
  });
  
  console.log(`🏆 Team ${team.id} status: ${updateData.status}`);
  
  // If team is complete, cascade upward
  if (newMemberCount >= MLM_CONFIG.TEAM_SIZE) {
    console.log(`🎯 Team ${team.id} is complete! Cascading for sponsor ${user.sponsorId}`);
    await cascadeTeamCompletion(tx, user.sponsorId);
  }
}

/**
 * Cascade team completion upward in sponsor chain
 */
async function cascadeTeamCompletion(tx, userId) {
  console.log(`🔼 Cascading team completion for user ${userId}`);
  
  // Update team count for this user
  const completedTeams = await tx.team.count({
    where: { 
      teamLeaderId: userId,
      status: 'COMPLETE'
    }
  });
  
  // Get cascaded teams from downline
  const downlineTeams = await getCascadedTeamCount(tx, userId);
  const totalTeams = completedTeams + downlineTeams;
  
  console.log(`📊 User ${userId}: Direct teams: ${completedTeams}, Cascade teams: ${downlineTeams}, Total: ${totalTeams}`);
  
  // Determine new level
  let newLevel = 0;
  for (const [level, requirement] of Object.entries(MLM_CONFIG.LEVEL_REQUIREMENTS)) {
    if (totalTeams >= requirement) {
      newLevel = parseInt(level);
    }
  }
  
  // Update user's team count and level
  await tx.user.update({
    where: { id: userId },
    data: { 
      directTeams: completedTeams,
      teamCount: totalTeams,
      level: newLevel
    }
  });
  
  console.log(`📈 User ${userId} updated: Teams: ${totalTeams}, Level: L${newLevel}`);
  
  // Continue cascading upward
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true }
  });
  
  if (user.sponsorId) {
    console.log(`⬆️ Continuing cascade to sponsor ${user.sponsorId}`);
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
 * Create hierarchy entries for team tracking (safe implementation)
 * Only creates entries if they don't already exist
 */
async function createHierarchyEntries(tx, userId) {
  try {
    // Get user with sponsor information
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, sponsorId: true, fullName: true }
    });

    if (!user || !user.sponsorId) {
      console.log(`ℹ️ User ${userId} has no sponsor - skipping hierarchy creation`);
      return;
    }

    console.log(`🔗 Creating hierarchy entries for user ${userId} (${user.fullName}) under sponsor ${user.sponsorId}`);

    // Check if hierarchy entries already exist for this user
    const existingHierarchy = await tx.hierarchy.findFirst({
      where: { descendantId: userId }
    });

    if (existingHierarchy) {
      console.log(`✅ Hierarchy entries already exist for user ${userId} - skipping`);
      return;
    }

    // Get all uplines (sponsors chain) up to 7 levels
    const uplines = [];
    let currentSponsorId = user.sponsorId;
    let depth = 1;

    while (currentSponsorId && depth <= 7) {
      const sponsor = await tx.user.findUnique({
        where: { id: currentSponsorId },
        select: { id: true, sponsorId: true, fullName: true }
      });

      if (sponsor) {
        uplines.push({
          ancestorId: sponsor.id,
          descendantId: userId,
          depth: depth
        });
        
        console.log(`📊 Level ${depth}: ${sponsor.fullName} (${sponsor.id}) -> ${user.fullName} (${userId})`);
        
        currentSponsorId = sponsor.sponsorId;
        depth++;
      } else {
        break;
      }
    }

    // Create hierarchy entries in batch (safe and efficient)
    if (uplines.length > 0) {
      await tx.hierarchy.createMany({
        data: uplines,
        skipDuplicates: true // Prevents errors if entries somehow exist
      });

      console.log(`✅ Created ${uplines.length} hierarchy entries for user ${userId}`);

      // Update totalTeams for all uplines (safe increment)
      for (const upline of uplines) {
        await tx.user.update({
          where: { id: upline.ancestorId },
          data: {
            totalTeams: {
              increment: 1
            }
          }
        });
      }

      console.log(`📈 Updated totalTeams for ${uplines.length} upline users`);
    }

  } catch (error) {
    console.error('❌ Error creating hierarchy entries:', error);
    // Don't throw error - let the order processing continue
    console.log('⚠️ Continuing with order processing despite hierarchy error');
  }
}

/**
 * Distribute ALL available turnover pools to users by level
 * This is called manually by admin and processes all undistributed pools
 */
export async function distributeAllAvailablePools() {
  console.log(`💸 Distributing all available turnover pools`);
  
  return await prisma.$transaction(async (tx) => {
    // Get all undistributed pools
    const availablePools = await tx.turnoverPool.findMany({
      where: { distributed: false },
      orderBy: { createdAt: 'asc' }
    });
    
    if (availablePools.length === 0) {
      throw new Error('No pools available for distribution');
    }
    
    console.log(`📊 Found ${availablePools.length} pools to distribute`);
    
    // Calculate total amounts by level from all pools
    const levelTotals = {
      L1: 0, L2: 0, L3: 0, L4: 0, L5: 0
    };
    
    let grandTotalAmount = 0;
    
    availablePools.forEach(pool => {
      levelTotals.L1 += pool.l1Amount || 0;
      levelTotals.L2 += pool.l2Amount || 0;
      levelTotals.L3 += pool.l3Amount || 0;
      levelTotals.L4 += pool.l4Amount || 0;
      levelTotals.L5 += pool.l5Amount || 0;
      grandTotalAmount += pool.totalAmount || 0;
    });
    
    console.log(`💰 Total amounts by level:`, levelTotals);
    
    let distributionResults = [];
    let totalUsersRewarded = 0;
    
    // Distribute to each level
    for (let level = 1; level <= 5; level++) {
      const levelAmount = levelTotals[`L${level}`];
      
      if (levelAmount <= 0) {
        console.log(`⚠️ No amount for level L${level}, skipping`);
        continue;
      }
      
      // Get active users at this level (only those eligible for pool distribution)
      const levelUsers = await tx.user.findMany({
        where: { 
          level: level,
          isActive: true
        },
        select: { 
          id: true, 
          fullName: true, 
          email: true,
          teamCount: true 
        }
      });
      
      console.log(`👥 Level L${level}: ${levelUsers.length} eligible users, Amount: ₹${levelAmount/100}`);
      
      if (levelUsers.length === 0) {
        console.log(`❌ No users at level L${level}, amount ₹${levelAmount/100} goes back to company`);
        // Record this amount as company retained amount
        distributionResults.push({
          level: level,
          amount: levelAmount,
          amountRupees: (levelAmount/100).toFixed(2),
          isCompanyRetained: true,
          reason: 'No eligible users at this level'
        });
        continue;
      }
      
      // Divide equally among users at this level
      const perUserAmount = Math.floor(levelAmount / levelUsers.length);
      const remainderAmount = levelAmount - (perUserAmount * levelUsers.length);
      
      console.log(`💱 L${level} distribution: ₹${perUserAmount/100} per user, remainder: ₹${remainderAmount/100}`);
      
      // Prepare batch operations for this level
      const walletEntries = [];
      const userUpdates = [];
      
      // Distribute to each user
      for (let i = 0; i < levelUsers.length; i++) {
        const user = levelUsers[i];
        const userAmount = perUserAmount + (i === 0 ? remainderAmount : 0);
        
        if (userAmount <= 0) continue;
        
        // Prepare wallet entry
        walletEntries.push({
          userId: user.id,
          type: 'pool_distribution',
          amount: userAmount,
          status: 'completed',
          reference: `pool_dist_${Date.now()}_${user.id}`,
          description: `Level L${level} pool distribution - ₹${(userAmount/100).toFixed(2)}`
        });
        
        // Prepare user update
        userUpdates.push({
          userId: user.id,
          walletIncrement: userAmount,
          poolIncomeIncrement: userAmount/100
        });
        
        distributionResults.push({
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          level: level,
          amount: userAmount,
          amountRupees: (userAmount/100).toFixed(2),
          teamCount: user.teamCount
        });
        
        totalUsersRewarded++;
      }
      
      // Execute batch operations for this level
      if (walletEntries.length > 0) {
        await tx.wallet.createMany({
          data: walletEntries
        });
        
        // Update users individually (createMany doesn't support increment)
        for (const update of userUpdates) {
          await tx.user.update({
            where: { id: update.userId },
            data: {
              walletBalance: { increment: update.walletIncrement },
              totalPoolIncomeEarned: { increment: update.poolIncomeIncrement }
            }
          });
        }
      }
    }
    
    // Create a single distribution record for this admin action
    const distributionRecord = await tx.poolDistribution.create({
      data: {
        poolId: availablePools[0].id, // Use first pool as reference
        adminId: null, // Will be set by the calling function
        distributedAt: new Date(),
        distributionType: 'POOL_PLAN',
        totalAmount: grandTotalAmount,
        l1Amount: levelTotals.L1,
        l1UserCount: distributionResults.filter(d => d.level === 1).length,
        l2Amount: levelTotals.L2, 
        l2UserCount: distributionResults.filter(d => d.level === 2).length,
        l3Amount: levelTotals.L3,
        l3UserCount: distributionResults.filter(d => d.level === 3).length,
        l4Amount: levelTotals.L4,
        l4UserCount: distributionResults.filter(d => d.level === 4).length,
        l5Amount: levelTotals.L5,
        l5UserCount: distributionResults.filter(d => d.level === 5).length,
        status: 'COMPLETED'
      }
    });
    
    // Mark all pools as distributed
    await tx.turnoverPool.updateMany({
      where: { 
        id: { in: availablePools.map(p => p.id) }
      },
      data: {
        distributed: true,
        distributedAt: new Date()
      }
    });
    
    console.log(`✅ Distribution completed: ₹${grandTotalAmount/100} distributed to ${totalUsersRewarded} users`);
    
    return {
      success: true,
      poolsProcessed: availablePools.length,
      totalAmountDistributed: grandTotalAmount,
      totalAmountRupees: (grandTotalAmount/100).toFixed(2),
      usersRewarded: totalUsersRewarded,
      distributionId: distributionRecord.id,
      levelBreakdown: {
        L1: { users: distributionResults.filter(d => d.level === 1).length, amount: levelTotals.L1 },
        L2: { users: distributionResults.filter(d => d.level === 2).length, amount: levelTotals.L2 },
        L3: { users: distributionResults.filter(d => d.level === 3).length, amount: levelTotals.L3 },
        L4: { users: distributionResults.filter(d => d.level === 4).length, amount: levelTotals.L4 },
        L5: { users: distributionResults.filter(d => d.level === 5).length, amount: levelTotals.L5 }
      },
      distributions: distributionResults,
      message: `Successfully distributed ₹${(grandTotalAmount/100).toFixed(2)} to ${totalUsersRewarded} users across ${availablePools.length} pools`
    };
  }, {
    timeout: 60000, // 60 seconds timeout for large operations
    maxWait: 10000, // Maximum wait time to acquire a connection
    isolationLevel: 'ReadCommitted' // Reduce lock contention
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
