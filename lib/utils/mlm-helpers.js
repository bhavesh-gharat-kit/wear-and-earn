import prisma from "@/lib/prisma"

/**
 * MLM Helper Utilities
 * Comprehensive utility functions for MLM operations
 */

// ===========================================
// MONEY UTILITIES
// ===========================================

/**
 * Convert paisa to formatted rupees display
 * @param {number} paisa - Amount in paisa (1 rupee = 100 paisa)
 * @returns {string} Formatted currency string
 */
export function formatPaisa(paisa) {
  if (typeof paisa !== 'number' || isNaN(paisa)) {
    return '₹0.00'
  }
  
  const rupees = paisa / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees)
}

/**
 * Convert rupees to paisa for database storage
 * @param {number} rupees - Amount in rupees
 * @returns {number} Amount in paisa
 */
export function parsePaisa(rupees) {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    return 0
  }
  
  // Round to avoid floating point precision issues
  return Math.round(rupees * 100)
}

/**
 * Calculate commission amount with proper rounding
 * @param {number} amount - Base amount
 * @param {number} percentage - Commission percentage (e.g., 0.1 for 10%)
 * @returns {number} Commission amount rounded to 2 decimal places
 */
export function calculateCommission(amount, percentage) {
  if (typeof amount !== 'number' || typeof percentage !== 'number') {
    return 0
  }
  
  if (amount < 0 || percentage < 0 || percentage > 1) {
    return 0
  }
  
  const commission = amount * percentage
  return Math.round(commission * 100) / 100 // Round to 2 decimal places
}

/**
 * Format amount for display with Indian number system
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
export function formatIndianCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0'
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

// ===========================================
// VALIDATION UTILITIES
// ===========================================

/**
 * Check if referral code is valid and available
 * @param {string} code - Referral code to validate
 * @returns {Promise<boolean>} True if valid and exists
 */
export async function isValidReferralCode(code) {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return false
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { 
        referralCode: code.trim().toUpperCase(),
        role: 'user',
        isActive: true
      },
      select: { id: true }
    })
    
    return !!user
  } catch (error) {
    console.error('Error validating referral code:', error)
    return false
  }
}

/**
 * Check if user can withdraw specified amount
 * @param {number} userId - User ID
 * @param {number} amount - Withdrawal amount
 * @returns {Promise<boolean>} True if withdrawal is allowed
 */
export async function canUserWithdraw(userId, amount) {
  if (!userId || !amount || amount <= 0) {
    return false
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        isActive: true,
        isKycApproved: true
      }
    })
    
    if (!user || !user.isActive || !user.isKycApproved) {
      return false
    }
    
    // Check minimum withdrawal amount
    if (!validateMinimumWithdrawal(amount)) {
      return false
    }
    
    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      return false
    }
    
    // Check for pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        userId: userId,
        status: {
          in: ['pending', 'processing']
        }
      },
      _sum: {
        amount: true
      }
    })
    
    const pendingAmount = pendingWithdrawals._sum.amount || 0
    const availableBalance = user.walletBalance - pendingAmount
    
    return availableBalance >= amount
    
  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error)
    return false
  }
}

/**
 * Validate minimum withdrawal amount
 * @param {number} amount - Withdrawal amount
 * @returns {boolean} True if amount meets minimum requirement
 */
export function validateMinimumWithdrawal(amount) {
  const MIN_WITHDRAWAL = 500 // ₹500 minimum
  return typeof amount === 'number' && amount >= MIN_WITHDRAWAL
}

/**
 * Validate if user meets KYC requirements
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if KYC is complete
 */
export async function isKycComplete(userId) {
  if (!userId) return false
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isKycApproved: true }
    })
    
    return user?.isKycApproved || false
  } catch (error) {
    console.error('Error checking KYC status:', error)
    return false
  }
}

// ===========================================
// TREE UTILITIES
// ===========================================

/**
 * Get comprehensive tree statistics for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Tree statistics
 */
export async function getUserTreeStats(userId) {
  if (!userId) {
    throw new Error('User ID is required')
  }
  
  try {
    // Get user's position in tree
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        matrixLevel: true,
        matrixPosition: true,
        sponsorId: true
      }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Get team size
    const teamSize = await calculateTeamSize(userId)
    
    // Get direct referrals
    const directReferrals = await getDirectReferrals(userId)
    
    // Get level-wise distribution
    const levelDistribution = await getLevelWiseDistribution(userId)
    
    // Get active vs inactive breakdown
    const activeBreakdown = await getActiveBreakdown(userId)
    
    return {
      userId,
      matrixLevel: user.matrixLevel,
      matrixPosition: user.matrixPosition,
      sponsorId: user.sponsorId,
      teamSize,
      directReferrals: directReferrals.length,
      levelDistribution,
      activeBreakdown,
      treeHealth: calculateTreeHealth(levelDistribution, activeBreakdown)
    }
    
  } catch (error) {
    console.error('Error getting tree stats:', error)
    throw error
  }
}

/**
 * Calculate total team size for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Total team size
 */
export async function calculateTeamSize(userId) {
  if (!userId) return 0
  
  try {
    const teamCount = await prisma.hierarchy.count({
      where: {
        sponsorId: userId
      }
    })
    
    return teamCount
  } catch (error) {
    console.error('Error calculating team size:', error)
    return 0
  }
}

/**
 * Get direct referrals for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of direct referral users
 */
export async function getDirectReferrals(userId) {
  if (!userId) return []
  
  try {
    const referrals = await prisma.user.findMany({
      where: {
        sponsorId: userId,
        role: 'user'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true,
        matrixLevel: true,
        matrixPosition: true,
        walletBalance: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return referrals
  } catch (error) {
    console.error('Error getting direct referrals:', error)
    return []
  }
}

/**
 * Get level-wise distribution of team
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Level-wise team distribution
 */
async function getLevelWiseDistribution(userId) {
  try {
    const distribution = await prisma.hierarchy.groupBy({
      by: ['level'],
      where: {
        sponsorId: userId
      },
      _count: {
        userId: true
      },
      orderBy: {
        level: 'asc'
      }
    })
    
    const result = {}
    distribution.forEach(level => {
      result[`level${level.level}`] = level._count.userId
    })
    
    return result
  } catch (error) {
    console.error('Error getting level distribution:', error)
    return {}
  }
}

/**
 * Get active vs inactive breakdown
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Active/inactive breakdown
 */
async function getActiveBreakdown(userId) {
  try {
    const breakdown = await prisma.user.groupBy({
      by: ['isActive'],
      where: {
        sponsorId: userId,
        role: 'user'
      },
      _count: {
        id: true
      }
    })
    
    const result = { active: 0, inactive: 0 }
    breakdown.forEach(group => {
      if (group.isActive) {
        result.active = group._count.id
      } else {
        result.inactive = group._count.id
      }
    })
    
    return result
  } catch (error) {
    console.error('Error getting active breakdown:', error)
    return { active: 0, inactive: 0 }
  }
}

/**
 * Calculate tree health score
 * @param {Object} levelDistribution - Level-wise distribution
 * @param {Object} activeBreakdown - Active/inactive breakdown
 * @returns {number} Health score (0-100)
 */
function calculateTreeHealth(levelDistribution, activeBreakdown) {
  const totalMembers = activeBreakdown.active + activeBreakdown.inactive
  
  if (totalMembers === 0) return 100
  
  // Calculate activity rate (40% weight)
  const activityRate = (activeBreakdown.active / totalMembers) * 100
  
  // Calculate distribution balance (30% weight)
  const levels = Object.keys(levelDistribution).length
  const distributionScore = Math.min(levels * 20, 100) // More levels = better distribution
  
  // Calculate growth potential (30% weight)
  const level1Count = levelDistribution.level1 || 0
  const growthScore = Math.min(level1Count * 10, 100) // More direct referrals = better growth
  
  const healthScore = (activityRate * 0.4) + (distributionScore * 0.3) + (growthScore * 0.3)
  
  return Math.round(healthScore)
}

// ===========================================
// COMMISSION UTILITIES
// ===========================================

/**
 * Get commission history for a user
 * @param {number} userId - User ID
 * @param {number} months - Number of months to fetch (default: 6)
 * @returns {Promise<Array>} Commission history
 */
export async function getCommissionHistory(userId, months = 6) {
  if (!userId) return []
  
  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const commissions = await prisma.commission.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        fromUser: {
          select: {
            fullName: true,
            email: true
          }
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return commissions.map(commission => ({
      id: commission.id,
      amount: commission.amount,
      level: commission.level,
      type: commission.type,
      description: commission.description,
      createdAt: commission.createdAt,
      fromUser: commission.fromUser,
      order: commission.order,
      formattedAmount: formatIndianCurrency(commission.amount)
    }))
    
  } catch (error) {
    console.error('Error getting commission history:', error)
    return []
  }
}

/**
 * Calculate monthly earnings for a user
 * @param {number} userId - User ID
 * @param {number} month - Month (1-12), if not provided uses current month
 * @returns {Promise<number>} Total earnings for the month
 */
export async function calculateMonthlyEarnings(userId, month = null) {
  if (!userId) return 0
  
  try {
    const now = new Date()
    const targetMonth = month || (now.getMonth() + 1)
    const year = now.getFullYear()
    
    const monthRange = getMonthRange(`${year}-${targetMonth.toString().padStart(2, '0')}`)
    
    const earnings = await prisma.commission.aggregate({
      where: {
        userId: userId,
        createdAt: {
          gte: monthRange.start,
          lte: monthRange.end
        }
      },
      _sum: {
        amount: true
      }
    })
    
    return earnings._sum.amount || 0
    
  } catch (error) {
    console.error('Error calculating monthly earnings:', error)
    return 0
  }
}

/**
 * Check user's eligibility status for commissions
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Eligibility status object
 */
export async function checkEligibilityStatus(userId) {
  if (!userId) {
    return {
      isEligible: false,
      reason: 'Invalid user ID'
    }
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          include: {
            orders: {
              where: {
                status: 'completed'
              }
            }
          }
        }
      }
    })
    
    if (!user) {
      return {
        isEligible: false,
        reason: 'User not found'
      }
    }
    
    // Check basic requirements
    if (!user.isActive) {
      return {
        isEligible: false,
        reason: 'Account is inactive',
        details: { isActive: false }
      }
    }
    
    if (!user.isKycApproved) {
      return {
        isEligible: false,
        reason: 'KYC not approved',
        details: { isKycApproved: false }
      }
    }
    
    // Check monthly purchase requirement
    const minMonthlyPurchase = 500
    if (user.monthlyPurchase < minMonthlyPurchase) {
      return {
        isEligible: false,
        reason: `Monthly purchase requirement not met (₹${user.monthlyPurchase}/₹${minMonthlyPurchase})`,
        details: {
          monthlyPurchase: user.monthlyPurchase,
          required: minMonthlyPurchase
        }
      }
    }
    
    // Check 3-3 rule
    const qualifiedReferrals = user.referrals.filter(referral => 
      referral.orders.length >= 3 && referral.isActive
    )
    
    if (qualifiedReferrals.length < 3) {
      return {
        isEligible: false,
        reason: `3-3 rule not satisfied (${qualifiedReferrals.length}/3 qualified referrals)`,
        details: {
          qualifiedReferrals: qualifiedReferrals.length,
          totalReferrals: user.referrals.length,
          referralDetails: user.referrals.map(ref => ({
            name: ref.fullName,
            orders: ref.orders.length,
            isActive: ref.isActive,
            qualified: ref.orders.length >= 3 && ref.isActive
          }))
        }
      }
    }
    
    return {
      isEligible: true,
      reason: 'All eligibility criteria met',
      details: {
        isActive: user.isActive,
        isKycApproved: user.isKycApproved,
        monthlyPurchase: user.monthlyPurchase,
        qualifiedReferrals: qualifiedReferrals.length,
        totalReferrals: user.referrals.length
      }
    }
    
  } catch (error) {
    console.error('Error checking eligibility status:', error)
    return {
      isEligible: false,
      reason: 'Error checking eligibility',
      error: error.message
    }
  }
}

// ===========================================
// DATE UTILITIES
// ===========================================

/**
 * Generate weekly due dates for 4-week payout schedule
 * @param {Date} startDate - Starting date
 * @returns {Array<Date>} Array of due dates
 */
export function getWeeklyDueDates(startDate) {
  if (!startDate || !(startDate instanceof Date)) {
    startDate = new Date()
  }
  
  const dueDates = []
  
  for (let week = 1; week <= 4; week++) {
    const dueDate = new Date(startDate)
    dueDate.setDate(startDate.getDate() + (week * 7))
    dueDates.push(dueDate)
  }
  
  return dueDates
}

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month string
 */
export function getCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get start and end dates for a given month
 * @param {string} month - Month in YYYY-MM format
 * @returns {Object} Object with start and end dates
 */
export function getMonthRange(month) {
  if (!month || typeof month !== 'string') {
    throw new Error('Month must be in YYYY-MM format')
  }
  
  const [year, monthNum] = month.split('-').map(Number)
  
  if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
    throw new Error('Invalid month format. Use YYYY-MM')
  }
  
  const start = new Date(year, monthNum - 1, 1) // Month is 0-indexed
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999) // Last day of month
  
  return { start, end }
}

/**
 * Get week number of the year
 * @param {Date} date - Date to get week number for
 * @returns {number} Week number
 */
export function getWeekNumber(date = new Date()) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

/**
 * Check if date is within current month
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in current month
 */
export function isCurrentMonth(date) {
  if (!date || !(date instanceof Date)) {
    return false
  }
  
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

/**
 * Get next Monday from given date
 * @param {Date} date - Starting date
 * @returns {Date} Next Monday
 */
export function getNextMonday(date = new Date()) {
  const nextMonday = new Date(date)
  const daysUntilMonday = (1 + 7 - date.getDay()) % 7 || 7
  nextMonday.setDate(date.getDate() + daysUntilMonday)
  nextMonday.setHours(6, 0, 0, 0) // 6 AM
  return nextMonday
}

/**
 * Format date for Indian locale
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatIndianDate(date, options = {}) {
  if (!date || !(date instanceof Date)) {
    return 'Invalid Date'
  }
  
  const defaultOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }
  
  return date.toLocaleDateString('en-IN', { ...defaultOptions, ...options })
}

// ===========================================
// HELPER CONSTANTS
// ===========================================

export const MLM_CONSTANTS = {
  MIN_WITHDRAWAL: 500,
  COMMISSION_RATES: [0.10, 0.08, 0.06, 0.04, 0.02], // Level 1-5 rates
  MIN_MONTHLY_PURCHASE: 500,
  MIN_QUALIFIED_REFERRALS: 3,
  MIN_ORDERS_PER_REFERRAL: 3,
  MAX_MATRIX_LEVEL: 5,
  PAYOUT_SCHEDULE_WEEKS: 4,
  KYC_BONUS_AMOUNT: 50
}

export const COMMISSION_TYPES = {
  DIRECT: 'direct',
  LEVEL: 'level',
  MATRIX: 'matrix',
  REPURCHASE: 'repurchase',
  BONUS: 'bonus',
  SELF_PAYOUT: 'self_payout'
}

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
}

// Export type definitions for better IDE support
export const TYPES = {
  TreeStats: {
    userId: 'number',
    matrixLevel: 'number',
    matrixPosition: 'number',
    sponsorId: 'number',
    teamSize: 'number',
    directReferrals: 'number',
    levelDistribution: 'object',
    activeBreakdown: 'object',
    treeHealth: 'number'
  },
  EligibilityStatus: {
    isEligible: 'boolean',
    reason: 'string',
    details: 'object'
  }
}
