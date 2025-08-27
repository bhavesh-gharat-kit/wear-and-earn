import prisma from './prisma';
import { placeNewUserInMLMTree, getUplineAncestors, getMatrixStats } from './mlm-tree';
import { distributeJoiningCommission } from './mlm-utils';

/**
 * Integration function: Register new user and place in MLM tree
 * This combines user registration with MLM tree placement
 * @param userData - User registration data
 * @param sponsorReferralCode - Sponsor's referral code (optional)
 * @returns Promise<User> - Created user with MLM placement
 */
export async function registerUserWithMLMPlacement(
  userData: {
    fullName: string;
    email?: string;
    mobileNo: string;
    password?: string;
    gender?: string;
  },
  sponsorReferralCode?: string
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    try {
      // Find sponsor if referral code provided
      let sponsorId = null;
      if (sponsorReferralCode) {
        const sponsor = await tx.user.findUnique({
          where: { referralCode: sponsorReferralCode }
        });
        
        if (sponsor) {
          sponsorId = sponsor.id;
        } else {
          console.warn(`Sponsor with referral code ${sponsorReferralCode} not found`);
        }
      }
      
      // Generate unique referral code
      const referralCode = await generateUniqueReferralCode();
      
      // Create user
      const newUser = await tx.user.create({
        data: {
          ...userData,
          sponsorId,
          referralCode,
          isActive: false, // Will be activated on first purchase
          role: 'user'
        }
      });
      
      // Place user in MLM tree (using the separate transaction-safe functions)
      // Note: This will be handled separately to avoid nested transactions
      
      return newUser;
      
    } catch (error) {
      console.error('Error in registerUserWithMLMPlacement:', error);
      throw error;
    }
  });
}

/**
 * Activate user in MLM system on first purchase
 * @param userId - User ID to activate
 * @param orderId - Order ID that triggers activation
 * @returns Promise<void>
 */
export async function activateUserInMLMSystem(userId: number, orderId: number): Promise<void> {
  return await prisma.$transaction(async (tx) => {
    try {
      // Get user details
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, sponsorId: true, isActive: true }
      });
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      if (user.isActive) {
        console.log(`User ${userId} is already active`);
        return;
      }
      
      // Activate user
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      
      // Mark order as joining order
      await tx.order.update({
        where: { id: orderId },
        data: { isJoiningOrder: true }
      });
      
      console.log(`User ${userId} activated with joining order ${orderId}`);
      
    } catch (error) {
      console.error('Error in activateUserInMLMSystem:', error);
      throw error;
    }
  });
}

/**
 * Place user in matrix tree after registration
 * This should be called after user registration
 * @param userId - User ID to place
 * @param sponsorId - Sponsor ID (optional)
 * @returns Promise<any> - Placement result
 */
export async function placeUserAfterRegistration(userId: number, sponsorId?: number): Promise<any> {
  try {
    // Place user in MLM tree
    const placement = await placeNewUserInMLMTree(userId, sponsorId);
    
    console.log(`User ${userId} placed in matrix: Parent ${placement.parentId}, Position ${placement.position}`);
    
    return placement;
    
  } catch (error) {
    console.error('Error placing user after registration:', error);
    throw error;
  }
}

/**
 * Complete user onboarding process
 * @param userData - User registration data
 * @param sponsorReferralCode - Sponsor's referral code (optional)
 * @returns Promise<any> - Complete onboarding result
 */
export async function completeUserOnboarding(
  userData: {
    fullName: string;
    email?: string;
    mobileNo: string;
    password?: string;
    gender?: string;
  },
  sponsorReferralCode?: string
): Promise<{
  user: any;
  placement: any;
  upline: any[];
}> {
  try {
    // Step 1: Register user
    const user = await registerUserWithMLMPlacement(userData, sponsorReferralCode);
    
    // Step 2: Place in matrix tree
    const placement = await placeUserAfterRegistration(user.id, user.sponsorId);
    
    // Step 3: Get upline information
    const upline = await getUplineAncestors(user.id);
    
    console.log(`User onboarding completed for ${user.fullName} (ID: ${user.id})`);
    
    return {
      user,
      placement,
      upline
    };
    
  } catch (error) {
    console.error('Error in completeUserOnboarding:', error);
    throw error;
  }
}

/**
 * Process joining order and distribute commissions
 * @param userId - User ID making the purchase
 * @param orderId - Order ID
 * @param commissionAmount - Total commission amount in paisa
 * @returns Promise<void>
 */
export async function processJoiningOrderWithCommissions(
  userId: number,
  orderId: number,
  commissionAmount: number
): Promise<void> {
  try {
    // Activate user if not already active
    await activateUserInMLMSystem(userId, orderId);
    
    // Distribute joining commissions
    await distributeJoiningCommission(userId, orderId, commissionAmount);
    
    console.log(`Joining order processed for user ${userId}, order ${orderId}`);
    
  } catch (error) {
    console.error('Error processing joining order:', error);
    throw error;
  }
}

/**
 * Get user's MLM dashboard data
 * @param userId - User ID
 * @returns Promise<any> - Dashboard data
 */
export async function getUserMLMDashboard(userId: number): Promise<{
  user: any;
  matrixStats: any;
  upline: any[];
  recentCommissions: any[];
}> {
  try {
    const [user, matrixStats, upline, recentCommissions] = await Promise.all([
      // User details
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          referralCode: true,
          isActive: true,
          isKycApproved: true,
          walletBalance: true,
          monthlyPurchase: true,
          createdAt: true
        }
      }),
      
      // Matrix statistics
      getMatrixStats(userId),
      
      // Upline ancestors
      getUplineAncestors(userId),
      
      // Recent commissions
      prisma.ledger.findMany({
        where: {
          userId: userId,
          type: {
            in: ['sponsor_commission', 'repurchase_commission']
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    
    return {
      user,
      matrixStats,
      upline,
      recentCommissions
    };
    
  } catch (error) {
    console.error('Error getting MLM dashboard:', error);
    throw error;
  }
}

/**
 * Generate unique referral code
 * @returns Promise<string> - Unique referral code
 */
async function generateUniqueReferralCode(): Promise<string> {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Check if code already exists
    const existingUser = await prisma.user.findUnique({
      where: { referralCode: code }
    });
    
    if (!existingUser) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique referral code after maximum attempts');
}
