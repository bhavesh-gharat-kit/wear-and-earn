import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check repurchase eligibility based on 3-3 rule
 * User must have:
 * 1. At least 3 direct referrals
 * 2. At least 3 of those directs must each have 3+ directs themselves
 */
export async function isRepurchaseEligible(tx, userId) {
  console.log('Checking repurchase eligibility for user:', userId);
  
  // Get user's direct referrals (level 1)
  const directReferrals = await tx.user.findMany({
    where: { sponsorId: userId },
    select: { id: true }
  });
  
  console.log(`User ${userId} has ${directReferrals.length} direct referrals`);
  
  if (directReferrals.length < 3) {
    console.log('Not eligible: Less than 3 direct referrals');
    return false;
  }
  
  // Check how many of the directs have 3+ referrals themselves
  let qualifiedDirects = 0;
  
  for (const direct of directReferrals) {
    const directsOfDirect = await tx.user.count({
      where: { sponsorId: direct.id }
    });
    
    if (directsOfDirect >= 3) {
      qualifiedDirects++;
    }
    
    // Early exit if we already found 3 qualified directs
    if (qualifiedDirects >= 3) {
      break;
    }
  }
  
  console.log(`User ${userId} has ${qualifiedDirects} directs with 3+ referrals`);
  
  const isEligible = qualifiedDirects >= 3;
  
  // Update user's eligibility flag
  await tx.user.update({
    where: { id: userId },
    data: { isEligibleRepurchase: isEligible }
  });
  
  console.log(`User ${userId} repurchase eligibility: ${isEligible}`);
  return isEligible;
}


export async function bfsFindOpenSlot(rootUserId) {
  const queue = [rootUserId];
  
  while (queue.length > 0) {
    const userId = queue.shift();
    
    const children = await prisma.matrixNode.findMany({
      where: { parentId: userId },
      orderBy: { position: 'asc' }
    });
    
    if (children.length < 3) {
      const usedPositions = new Set(children.map(c => c.position).filter(Boolean));
      const availablePosition = [1, 2, 3].find(p => !usedPositions.has(p));
      
      return { 
        parentId: userId, 
        position: availablePosition 
      };
    }
    
    // Add children to queue for next level search
    queue.push(...children.map(c => c.userId));
  }
  
  // Fallback - should never happen if tree exists
  return { parentId: rootUserId, position: 1 };
}

/**
 * Get or create global root user (company user)
 */
export async function getGlobalRootId(tx = prisma) {
  // Check for existing root user
  let rootUser = await tx.user.findFirst({
    where: { 
      role: 'admin',
      referralCode: { not: null }
    }
  });
  
  if (!rootUser) {
    // Create a system root user if none exists
    rootUser = await tx.user.create({
      data: {
        fullName: 'System Root',
        email: 'root@wearandearn.com',
        mobileNo: '0000000000',
        role: 'admin',
        isActive: true,
        referralCode: 'ROOT0001'
      }
    });
    
    // Create matrix node for root
    await tx.matrixNode.create({
      data: {
        userId: rootUser.id,
        parentId: null,
        position: null
      }
    });
  }
  
  return rootUser.id;
}

/**
 * Place user in matrix and build hierarchy
 */
export async function placeUserInMatrix(tx, newUserId, parentUserId, position) {
  // Create matrix node
  await tx.matrixNode.create({
    data: { 
      userId: newUserId, 
      parentId: parentUserId, 
      position: position || null 
    }
  });
  
  // Build closure table up to 5 ancestors (as per MLM specification)
  let currentNode = await tx.matrixNode.findUnique({ 
    where: { userId: parentUserId }
  });
  
  let depth = 1;
  
  while (currentNode && depth <= 5) {
    await tx.hierarchy.create({
      data: { 
        ancestorId: currentNode.userId, 
        descendantId: newUserId, 
        depth 
      }
    });
    
    if (currentNode.parentId) {
      currentNode = await tx.matrixNode.findUnique({ 
        where: { userId: currentNode.parentId }
      });
    } else {
      currentNode = null;
    }
    
    depth++;
  }
}

/**
 * Check if user meets 3-3 rule for repurchase eligibility
 */

/**
 * Generate unique referral code
 */
export function generateReferralCode() {
  return `WE${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

/**
 * Get uplines up to specified depth
 */
export async function getUplines(userId, maxDepth = 7) {
  return await prisma.hierarchy.findMany({
    where: { 
      descendantId: userId,
      depth: { lte: maxDepth }
    },
    include: {
      ancestor: true
    },
    orderBy: { depth: 'asc' }
  });
}

/**
 * Get downlines up to specified depth
 */
export async function getDownlines(tx = prisma, userId, maxDepth = 7) {
  return await tx.hierarchy.findMany({
    where: { 
      ancestorId: userId,
      depth: { lte: maxDepth }
    },
    include: {
      descendant: true
    },
    orderBy: { depth: 'asc' }
  });
}

/**
 * Get direct referrals count (level 1 only)
 */
export async function getDirectReferrals(tx = prisma, userId) {
  const directReferrals = await tx.hierarchy.count({
    where: { 
      ancestorId: userId,
      depth: 1
    }
  });
  return directReferrals;
}

/**
 * Get total team size across all levels
 */
export async function getTotalTeamSize(tx = prisma, userId) {
  const totalTeam = await tx.hierarchy.count({
    where: { 
      ancestorId: userId,
      depth: { lte: 7 }
    }
  });
  return totalTeam;
}
