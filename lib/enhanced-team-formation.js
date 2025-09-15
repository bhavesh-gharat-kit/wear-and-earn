/**
 * 🔥 ENHANCED TEAM FORMATION SYSTEM - PHASE 2.1 🔥
 * Hybrid Implementation: Uses existing logic + New schema
 * 
 * CAREFULLY BUILT FOR POOL PLAN MLM SYSTEM
 */

import prisma from './prisma.js';

// 🎯 ENHANCED MLM CONFIGURATION - CORRECTED LEVEL REQUIREMENTS
const ENHANCED_MLM_CONFIG = {
  // Revenue split (matches existing + our spec)
  COMPANY_SHARE: 0.30,      // 30% to company
  POOL_SHARE: 0.70,         // 70% for MLM pool and self income
  
  // Self income configuration (first purchase only)
  SELF_INCOME_PERCENTAGE: 0.20,  // 20% of pool share
  SELF_INCOME_INSTALLMENTS: 4,   // 4 weekly installments
  
  // Pool configuration
  TURNOVER_POOL_PERCENTAGE: 0.80, // 80% of pool → turnover pool
  
  // 🔥 CORRECTED LEVEL REQUIREMENTS (OUR SPEC)
  LEVEL_REQUIREMENTS: {
    1: 1,   // L1: 1 team (3 referrals) ✅
    2: 3,   // L2: 3 teams (9 referrals) ✅
    3: 9,   // L3: 9 teams (27 referrals) ✅
    4: 27,  // L4: 27 teams (81 referrals) ✅
    5: 81   // L5: 81 teams (243 referrals) ✅
  },
  
  // Pool distribution percentages by level  
  POOL_DISTRIBUTION: {
    1: 0.30,  // L1: 30%
    2: 0.20,  // L2: 20%
    3: 0.20,  // L3: 20%
    4: 0.15,  // L4: 15%
    5: 0.15   // L5: 15%
  },
  
  // Team configuration
  TEAM_SIZE: 3,                    // 3 first purchases needed
  MIN_WITHDRAWAL_AMOUNT: 300.00,   // ₹300 minimum withdrawal
};

// ============================================================================
// 🔥 PHASE 2.1: TEAM FORMATION SYSTEM
// ============================================================================

/**
 * 🎯 CORE FUNCTION: Direct Team Counting
 * Counts teams directly formed by a user (as team leader)
 */
export async function calculateDirectTeamCount(tx, userId) {
  try {
    const directTeams = await tx.team.count({
      where: { 
        teamLeaderId: userId,
        status: 'COMPLETE' // Only count completed teams (3 members)
      }
    });
    
    return directTeams;
  } catch (error) {
    console.error('Error calculating direct team count:', error);
    return 0;
  }
}

/**
 * 🎯 CORE FUNCTION: Cascade Team Counting (Recursive)
 * Counts all teams in the downline cascade
 */
export async function calculateCascadeTeamCount(tx, userId) {
  try {
    // Get all direct referrals of this user
    const directReferrals = await tx.user.findMany({
      where: { sponsorId: userId },
      select: { id: true, teamCount: true }
    });
    
    let cascadeTotal = 0;
    
    // Sum up all team counts from direct referrals
    for (const referral of directReferrals) {
      cascadeTotal += referral.teamCount || 0;
    }
    
    return cascadeTotal;
  } catch (error) {
    console.error('Error calculating cascade team count:', error);
    return 0;
  }
}

/**
 * 🎯 CORE FUNCTION: Team Formation Validation
 * Validates if a team can be formed
 */
export async function validateTeamFormation(tx, teamLeaderId) {
  try {
    // Get user's completed first purchases (referrals)
    const completedReferrals = await tx.referralTracking.count({
      where: {
        referrerId: teamLeaderId,
        firstPurchaseCompleted: true,
        teamContributionStatus: 'pending' // Not yet assigned to a team
      }
    });
    
    // Check if user has existing incomplete team
    const incompleteTeam = await tx.team.findFirst({
      where: {
        teamLeaderId: teamLeaderId,
        status: 'FORMING'
      }
    });
    
    return {
      canFormTeam: completedReferrals >= ENHANCED_MLM_CONFIG.TEAM_SIZE,
      availableReferrals: completedReferrals,
      hasIncompleteTeam: !!incompleteTeam,
      incompleteTeamId: incompleteTeam?.id || null
    };
  } catch (error) {
    console.error('Error validating team formation:', error);
    return {
      canFormTeam: false,
      availableReferrals: 0,
      hasIncompleteTeam: false,
      incompleteTeamId: null
    };
  }
}

/**
 * 🎯 CORE FUNCTION: Team Formation Process
 * Forms a team when 3 referrals complete first purchase
 */
export async function processTeamFormation(tx, teamLeaderId) {
  try {
    const validation = await validateTeamFormation(tx, teamLeaderId);
    
    if (!validation.canFormTeam) {
      return {
        success: false,
        message: `Need ${ENHANCED_MLM_CONFIG.TEAM_SIZE} referrals, have ${validation.availableReferrals}`,
        teamId: null
      };
    }
    
    // Get the first 3 available referrals
    const availableReferrals = await tx.referralTracking.findMany({
      where: {
        referrerId: teamLeaderId,
        firstPurchaseCompleted: true,
        teamContributionStatus: 'pending'
      },
      take: 3,
      orderBy: { firstPurchaseDate: 'asc' }, // First come, first served
      select: { referredUserId: true, id: true }
    });
    
    if (availableReferrals.length < 3) {
      return {
        success: false,
        message: 'Insufficient available referrals',
        teamId: null
      };
    }
    
    // Create or update team
    let team;
    if (validation.hasIncompleteTeam) {
      // Complete existing team
      team = await tx.team.update({
        where: { id: validation.incompleteTeamId },
        data: {
          member1Id: availableReferrals[0].referredUserId,
          member2Id: availableReferrals[1].referredUserId,
          member3Id: availableReferrals[2].referredUserId,
          completedAt: new Date(),
          status: 'COMPLETE'
        }
      });
    } else {
      // Create new complete team
      team = await tx.team.create({
        data: {
          teamLeaderId: teamLeaderId,
          member1Id: availableReferrals[0].referredUserId,
          member2Id: availableReferrals[1].referredUserId,
          member3Id: availableReferrals[2].referredUserId,
          completedAt: new Date(),
          status: 'COMPLETE',
          teamSequenceNumber: await getNextTeamSequence(tx, teamLeaderId)
        }
      });
    }
    
    // Update referral tracking status
    await tx.referralTracking.updateMany({
      where: {
        id: { in: availableReferrals.map(r => r.id) }
      },
      data: {
        teamContributionStatus: 'contributed',
        teamFormationTriggered: true
      }
    });
    
    // Create TeamMember records for backward compatibility
    for (const referral of availableReferrals) {
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: referral.referredUserId
        }
      });
    }
    
    return {
      success: true,
      message: 'Team formed successfully',
      teamId: team.id,
      members: availableReferrals.map(r => r.referredUserId)
    };
    
  } catch (error) {
    console.error('Error processing team formation:', error);
    return {
      success: false,
      message: 'Team formation failed: ' + error.message,
      teamId: null
    };
  }
}

/**
 * 🎯 HELPER FUNCTION: Get next team sequence number
 */
async function getNextTeamSequence(tx, teamLeaderId) {
  const lastTeam = await tx.team.findFirst({
    where: { teamLeaderId },
    orderBy: { teamSequenceNumber: 'desc' },
    select: { teamSequenceNumber: true }
  });
  
  return (lastTeam?.teamSequenceNumber || 0) + 1;
}

/**
 * 🎯 CORE FUNCTION: Team Disbanding Logic (for refunds)
 * Handles team disbanding when needed
 */
export async function processTeamDisbanding(tx, teamId, reason = 'refund') {
  try {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      include: {
        members: true
      }
    });
    
    if (!team) {
      return {
        success: false,
        message: 'Team not found'
      };
    }
    
    // Mark team as disbanded
    await tx.team.update({
      where: { id: teamId },
      data: {
        status: 'DISBANDED'
      }
    });
    
    // Update referral tracking back to pending
    if (team.member1Id || team.member2Id || team.member3Id) {
      const memberIds = [team.member1Id, team.member2Id, team.member3Id].filter(Boolean);
      
      await tx.referralTracking.updateMany({
        where: {
          referrerId: team.teamLeaderId,
          referredUserId: { in: memberIds }
        },
        data: {
          teamContributionStatus: 'pending',
          teamFormationTriggered: false
        }
      });
    }
    
    return {
      success: true,
      message: `Team disbanded successfully (${reason})`,
      affectedMembers: team.members.length
    };
    
  } catch (error) {
    console.error('Error disbanding team:', error);
    return {
      success: false,
      message: 'Team disbanding failed: ' + error.message
    };
  }
}

export { ENHANCED_MLM_CONFIG };
