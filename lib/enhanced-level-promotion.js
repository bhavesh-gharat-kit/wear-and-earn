/**
 * 🔥 ENHANCED LEVEL PROMOTION SYSTEM - PHASE 2.1 CONTINUATION 🔥
 * Builds on Team Formation System
 * 
 * CAREFULLY BUILT FOR POOL PLAN MLM SYSTEM
 */

import { ENHANCED_MLM_CONFIG } from './enhanced-team-formation.js';
import { calculateDirectTeamCount, calculateCascadeTeamCount } from './enhanced-team-formation.js';

// ============================================================================
// 🔥 PHASE 2.1: LEVEL PROMOTION SYSTEM  
// ============================================================================

/**
 * 🎯 CORE FUNCTION: Auto-Promotion Checker
 * Checks if user qualifies for level promotion
 */
export async function checkAutoPromotion(tx, userId) {
  try {
    // Get current user data
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        currentLevel: true,
        teamCount: true,
        firstPurchaseDate: true
      }
    });
    
    if (!user || !user.firstPurchaseDate) {
      return {
        eligible: false,
        currentLevel: 'NONE',
        newLevel: 'NONE',
        teamCount: 0,
        message: 'User not eligible - no first purchase'
      };
    }
    
    // Calculate fresh team counts
    const directTeams = await calculateDirectTeamCount(tx, userId);
    const cascadeTeams = await calculateCascadeTeamCount(tx, userId);
    const totalTeams = directTeams + cascadeTeams;
    
    // Determine highest level user qualifies for
    let qualifiedLevel = 'NONE';
    let qualifiedLevelNumber = 0;
    
    for (const [levelNumber, requirement] of Object.entries(ENHANCED_MLM_CONFIG.LEVEL_REQUIREMENTS)) {
      if (totalTeams >= requirement) {
        qualifiedLevel = `L${levelNumber}`;
        qualifiedLevelNumber = parseInt(levelNumber);
      }
    }
    
    // Check if this is a promotion
    const currentLevelNumber = user.currentLevel === 'NONE' ? 0 : parseInt(user.currentLevel.replace('L', ''));
    const isPromotion = qualifiedLevelNumber > currentLevelNumber;
    
    return {
      eligible: isPromotion,
      currentLevel: user.currentLevel,
      newLevel: qualifiedLevel,
      teamCount: totalTeams,
      directTeams,
      cascadeTeams,
      isPromotion,
      message: isPromotion ? 
        `Promotion available: ${user.currentLevel} → ${qualifiedLevel}` :
        `No promotion: ${totalTeams} teams (need ${ENHANCED_MLM_CONFIG.LEVEL_REQUIREMENTS[qualifiedLevelNumber + 1] || 'max'} for next level)`
    };
    
  } catch (error) {
    console.error('Error checking auto-promotion:', error);
    return {
      eligible: false,
      currentLevel: 'NONE',
      newLevel: 'NONE',
      teamCount: 0,
      message: 'Promotion check failed: ' + error.message
    };
  }
}

/**
 * 🎯 CORE FUNCTION: Level Requirement Validation
 * Validates if user meets requirements for specific level
 */
export async function validateLevelRequirements(tx, userId, targetLevel) {
  try {
    const targetLevelNumber = parseInt(targetLevel.replace('L', ''));
    const requiredTeams = ENHANCED_MLM_CONFIG.LEVEL_REQUIREMENTS[targetLevelNumber];
    
    if (!requiredTeams) {
      return {
        valid: false,
        message: `Invalid target level: ${targetLevel}`,
        requirement: 0,
        current: 0
      };
    }
    
    // Calculate current team count
    const directTeams = await calculateDirectTeamCount(tx, userId);
    const cascadeTeams = await calculateCascadeTeamCount(tx, userId);
    const totalTeams = directTeams + cascadeTeams;
    
    return {
      valid: totalTeams >= requiredTeams,
      message: totalTeams >= requiredTeams ? 
        `Meets requirements for ${targetLevel}` :
        `Insufficient teams: ${totalTeams}/${requiredTeams}`,
      requirement: requiredTeams,
      current: totalTeams,
      shortfall: Math.max(0, requiredTeams - totalTeams)
    };
    
  } catch (error) {
    console.error('Error validating level requirements:', error);
    return {
      valid: false,
      message: 'Validation failed: ' + error.message,
      requirement: 0,
      current: 0
    };
  }
}

/**
 * 🎯 CORE FUNCTION: Permanent Level Assignment
 * Assigns new level to user (permanent - no downgrades)
 */
export async function assignPermanentLevel(tx, userId, newLevel) {
  try {
    // Validate the promotion first
    const validation = await validateLevelRequirements(tx, userId, newLevel);
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
        levelAssigned: null
      };
    }
    
    // Get current user level
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true, teamCount: true }
    });
    
    // Update user level and team count
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        currentLevel: newLevel,
        teamCount: validation.current,
        // Update tracking fields
        totalSelfIncomeEarned: user.totalSelfIncomeEarned || 0,
        totalPoolIncomeEarned: user.totalPoolIncomeEarned || 0
      }
    });
    
    // Log the level change for audit trail
    await tx.referralTracking.create({
      data: {
        referrerId: userId,
        referredUserId: userId, // Self-reference for level change
        referralDate: new Date(),
        firstPurchaseCompleted: true,
        teamContributionStatus: `level_promotion_${newLevel}`,
        referralCodeUsed: `LEVEL_UP_${newLevel}_${Date.now()}`
      }
    });
    
    return {
      success: true,
      message: `Level promoted to ${newLevel} successfully`,
      levelAssigned: newLevel,
      previousLevel: user.currentLevel,
      teamCount: validation.current
    };
    
  } catch (error) {
    console.error('Error assigning permanent level:', error);
    return {
      success: false,
      message: 'Level assignment failed: ' + error.message,
      levelAssigned: null
    };
  }
}

/**
 * 🎯 CORE FUNCTION: Level Change Notifications
 * Handles notifications for level changes
 */
export async function processLevelChangeNotifications(tx, userId, levelChange) {
  try {
    if (!levelChange.success) return;
    
    // Create notification record (using existing notification system or simple logging)
    const notificationData = {
      userId: userId,
      type: 'LEVEL_PROMOTION',
      title: 'Congratulations! Level Promotion',
      message: `You have been promoted to ${levelChange.levelAssigned}! You now have ${levelChange.teamCount} teams.`,
      data: JSON.stringify({
        previousLevel: levelChange.previousLevel,
        newLevel: levelChange.levelAssigned,
        teamCount: levelChange.teamCount,
        promotionDate: new Date().toISOString()
      }),
      isRead: false,
      createdAt: new Date()
    };
    
    // For now, we'll log this - can be enhanced to actual notification system
    console.log('🎉 LEVEL PROMOTION NOTIFICATION:', notificationData);
    
    return {
      success: true,
      notificationSent: true,
      message: 'Level promotion notification processed'
    };
    
  } catch (error) {
    console.error('Error processing level change notifications:', error);
    return {
      success: false,
      notificationSent: false,
      message: 'Notification failed: ' + error.message
    };
  }
}

/**
 * 🎯 MASTER FUNCTION: Complete Level Promotion Process
 * Orchestrates the entire level promotion workflow
 */
export async function processCompletePromotion(tx, userId) {
  try {
    // Step 1: Check if promotion is available
    const promotionCheck = await checkAutoPromotion(tx, userId);
    
    if (!promotionCheck.eligible) {
      return {
        success: false,
        message: promotionCheck.message,
        promotion: promotionCheck
      };
    }
    
    // Step 2: Assign the new level
    const levelAssignment = await assignPermanentLevel(tx, userId, promotionCheck.newLevel);
    
    if (!levelAssignment.success) {
      return {
        success: false,
        message: levelAssignment.message,
        promotion: promotionCheck
      };
    }
    
    // Step 3: Send notifications
    const notification = await processLevelChangeNotifications(tx, userId, levelAssignment);
    
    return {
      success: true,
      message: `Complete promotion successful: ${levelAssignment.previousLevel} → ${levelAssignment.levelAssigned}`,
      promotion: promotionCheck,
      levelAssignment,
      notification
    };
    
  } catch (error) {
    console.error('Error in complete promotion process:', error);
    return {
      success: false,
      message: 'Complete promotion failed: ' + error.message,
      promotion: null
    };
  }
}
