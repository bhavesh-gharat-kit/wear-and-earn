import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for admin eligibility checks
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting
    try {
      await limiter.check(20, `admin_eligibility_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const userId = parseInt(params.userId)

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sponsor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            matrixLevel: true,
            matrixPosition: true
          }
        },
        referrals: {
          select: {
            id: true,
            fullName: true,
            email: true,
            isActive: true,
            createdAt: true,
            orders: {
              where: {
                status: 'completed'
              },
              select: {
                id: true,
                totalAmount: true,
                createdAt: true
              }
            }
          }
        },
        orders: {
          where: {
            status: 'completed'
          },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true
          }
        },
        commissions: {
          select: {
            id: true,
            amount: true,
            level: true,
            type: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate eligibility based on 3-3 rule and other criteria
    const eligibilityResults = await calculateUserEligibility(user)

    // Get downline structure for matrix eligibility
    const downlineStructure = await getDownlineStructure(userId)

    // Get recent activity
    const recentActivity = await prisma.ledger.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true
      }
    })

    // Calculate matrix placement eligibility
    const matrixEligibility = await calculateMatrixEligibility(user, downlineStructure)

    // Calculate commission eligibility
    const commissionEligibility = calculateCommissionEligibility(user)

    // Calculate withdrawal eligibility
    const withdrawalEligibility = calculateWithdrawalEligibility(user)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          isKycApproved: user.isKycApproved,
          walletBalance: user.walletBalance,
          matrixLevel: user.matrixLevel,
          matrixPosition: user.matrixPosition,
          createdAt: user.createdAt,
          sponsor: user.sponsor
        },
        eligibility: {
          overall: eligibilityResults.overall,
          breakdown: {
            threeThreeRule: eligibilityResults.threeThreeRule,
            matrix: matrixEligibility,
            commission: commissionEligibility,
            withdrawal: withdrawalEligibility
          }
        },
        statistics: {
          totalReferrals: user.referrals.length,
          activeReferrals: user.referrals.filter(r => r.isActive).length,
          totalOrders: user.orders.length,
          totalOrderValue: user.orders.reduce((sum, order) => sum + order.totalAmount, 0),
          totalCommissions: user.commissions.reduce((sum, comm) => sum + comm.amount, 0),
          commissionByLevel: getLevelWiseCommissions(user.commissions)
        },
        downlineStructure: downlineStructure,
        recentActivity: recentActivity,
        recommendations: generateRecommendations(eligibilityResults, user)
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Error checking eligibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate user eligibility based on 3-3 rule
async function calculateUserEligibility(user) {
  const results = {
    overall: { eligible: false, score: 0, message: '' },
    threeThreeRule: {
      eligible: false,
      requirements: {
        minReferrals: 3,
        minOrdersPerReferral: 3,
        actualReferrals: 0,
        qualifiedReferrals: 0
      },
      details: []
    }
  }

  // Check 3-3 rule: User needs 3 direct referrals, each with at least 3 completed orders
  const referrals = user.referrals
  results.threeThreeRule.requirements.actualReferrals = referrals.length

  let qualifiedReferrals = 0
  
  for (const referral of referrals) {
    const completedOrders = referral.orders.length
    const isQualified = completedOrders >= 3 && referral.isActive
    
    if (isQualified) {
      qualifiedReferrals++
    }

    results.threeThreeRule.details.push({
      referralId: referral.id,
      name: referral.fullName,
      email: referral.email,
      completedOrders,
      isActive: referral.isActive,
      isQualified,
      joinedAt: referral.createdAt
    })
  }

  results.threeThreeRule.requirements.qualifiedReferrals = qualifiedReferrals
  results.threeThreeRule.eligible = qualifiedReferrals >= 3

  // Calculate overall eligibility score
  let score = 0

  // 3-3 rule (40 points)
  if (results.threeThreeRule.eligible) {
    score += 40
  } else {
    score += (qualifiedReferrals / 3) * 40
  }

  // KYC verification (20 points)
  if (user.isKycApproved) {
    score += 20
  }

  // Account activity (20 points)
  if (user.isActive) {
    score += 20
  }

  // Personal orders (20 points)
  const personalOrders = user.orders.length
  if (personalOrders >= 5) {
    score += 20
  } else {
    score += (personalOrders / 5) * 20
  }

  results.overall.score = Math.round(score)
  results.overall.eligible = score >= 80 // 80% threshold for full eligibility

  if (results.overall.eligible) {
    results.overall.message = 'User meets all eligibility criteria'
  } else if (score >= 60) {
    results.overall.message = 'User partially meets criteria, review recommended'
  } else {
    results.overall.message = 'User does not meet minimum eligibility criteria'
  }

  return results
}

// Helper function to get downline structure
async function getDownlineStructure(userId) {
  const downline = await prisma.hierarchy.findMany({
    where: {
      OR: [
        { userId: userId },
        { sponsorId: userId }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          matrixLevel: true,
          matrixPosition: true
        }
      },
      sponsor: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { level: 'asc' }
  })

  // Group by levels
  const structure = {}
  downline.forEach(entry => {
    if (!structure[entry.level]) {
      structure[entry.level] = []
    }
    structure[entry.level].push({
      id: entry.user.id,
      name: entry.user.fullName,
      email: entry.user.email,
      isActive: entry.user.isActive,
      matrixLevel: entry.user.matrixLevel,
      matrixPosition: entry.user.matrixPosition,
      sponsor: entry.sponsor
    })
  })

  return structure
}

// Helper function to calculate matrix eligibility
async function calculateMatrixEligibility(user, downlineStructure) {
  const eligibility = {
    canUpgrade: false,
    currentLevel: user.matrixLevel || 0,
    nextLevel: (user.matrixLevel || 0) + 1,
    requirements: {
      minDownlineSize: 0,
      actualDownlineSize: 0,
      minActiveMembers: 0,
      actualActiveMembers: 0
    },
    message: ''
  }

  // Calculate total downline size
  let totalDownline = 0
  let activeDownline = 0

  Object.values(downlineStructure).forEach(level => {
    level.forEach(member => {
      totalDownline++
      if (member.isActive) {
        activeDownline++
      }
    })
  })

  eligibility.requirements.actualDownlineSize = totalDownline
  eligibility.requirements.actualActiveMembers = activeDownline

  // Matrix upgrade requirements based on current level
  const upgradeRequirements = {
    1: { downline: 3, active: 2 },
    2: { downline: 9, active: 6 },
    3: { downline: 27, active: 18 },
    4: { downline: 81, active: 54 },
    5: { downline: 243, active: 162 }
  }

  const currentLevel = user.matrixLevel || 0
  if (currentLevel < 5) {
    const requirements = upgradeRequirements[currentLevel + 1]
    eligibility.requirements.minDownlineSize = requirements.downline
    eligibility.requirements.minActiveMembers = requirements.active

    eligibility.canUpgrade = totalDownline >= requirements.downline && 
                           activeDownline >= requirements.active

    if (eligibility.canUpgrade) {
      eligibility.message = `Eligible for upgrade to level ${currentLevel + 1}`
    } else {
      eligibility.message = `Need ${requirements.downline - totalDownline} more downline members and ${requirements.active - activeDownline} more active members`
    }
  } else {
    eligibility.message = 'Maximum matrix level reached'
  }

  return eligibility
}

// Helper function to calculate commission eligibility
function calculateCommissionEligibility(user) {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const recentCommissions = user.commissions.filter(c => c.createdAt >= lastMonth)
  const totalRecentCommissions = recentCommissions.reduce((sum, c) => sum + c.amount, 0)

  return {
    eligible: user.isActive && user.isKycApproved,
    monthlyEarnings: totalRecentCommissions,
    totalEarnings: user.commissions.reduce((sum, c) => sum + c.amount, 0),
    lastCommissionDate: user.commissions.length > 0 ? 
      Math.max(...user.commissions.map(c => c.createdAt)) : null,
    requirements: {
      isActive: user.isActive,
      isKycApproved: user.isKycApproved
    }
  }
}

// Helper function to calculate withdrawal eligibility
function calculateWithdrawalEligibility(user) {
  const minWithdrawalAmount = 500
  const hasMinBalance = user.walletBalance >= minWithdrawalAmount

  return {
    eligible: user.isKycApproved && hasMinBalance && user.isActive,
    currentBalance: user.walletBalance,
    minRequired: minWithdrawalAmount,
    requirements: {
      isKycApproved: user.isKycApproved,
      hasMinBalance: hasMinBalance,
      isActive: user.isActive
    },
    maxWithdrawable: Math.max(0, user.walletBalance - 50) // Keep ₹50 minimum
  }
}

// Helper function to get level-wise commission breakdown
function getLevelWiseCommissions(commissions) {
  const breakdown = {}
  commissions.forEach(commission => {
    if (!breakdown[commission.level]) {
      breakdown[commission.level] = { count: 0, amount: 0 }
    }
    breakdown[commission.level].count++
    breakdown[commission.level].amount += commission.amount
  })
  return breakdown
}

// Helper function to generate recommendations
function generateRecommendations(eligibilityResults, user) {
  const recommendations = []

  if (!user.isKycApproved) {
    recommendations.push({
      type: 'kyc',
      priority: 'high',
      message: 'Complete KYC verification to unlock all features',
      action: 'Approve KYC documents'
    })
  }

  if (!eligibilityResults.threeThreeRule.eligible) {
    const needed = 3 - eligibilityResults.threeThreeRule.requirements.qualifiedReferrals
    recommendations.push({
      type: 'referrals',
      priority: 'medium',
      message: `User needs ${needed} more qualified referrals for 3-3 rule`,
      action: 'Focus on referral quality and order completion'
    })
  }

  if (!user.isActive) {
    recommendations.push({
      type: 'activation',
      priority: 'high',
      message: 'Account is inactive',
      action: 'Investigate and reactivate account if appropriate'
    })
  }

  if (user.orders.length < 3) {
    recommendations.push({
      type: 'orders',
      priority: 'low',
      message: 'Encourage personal purchases to lead by example',
      action: 'Promote product usage'
    })
  }

  return recommendations
}
