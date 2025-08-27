import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

/**
 * Monthly Eligibility Sweep Job
 * Processes monthly eligibility checks and repurchase commission rollups
 * Runs on the 1st of every month at 2 AM
 */
export async function processMonthlyEligibilitySweep() {
  const startTime = new Date()
  const jobId = `monthly-sweep-${Date.now()}`
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  console.log(`[${jobId}] Starting monthly eligibility sweep for ${currentYear}-${currentMonth + 1}`)
  
  let eligibleUsers = 0
  let ineligibleUsers = 0
  let totalRolledUp = 0
  let processedUsers = 0
  const errors = []

  try {
    // Get all active users for eligibility check
    const users = await prisma.user.findMany({
      where: {
        role: 'user',
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        monthlyPurchase: true,
        lastMonthPurchase: true,
        isKycApproved: true,
        walletBalance: true,
        createdAt: true
      }
    })

    console.log(`[${jobId}] Processing ${users.length} active users`)

    // Process users in batches
    const batchSize = 100
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const result = await processUserEligibility(user, jobId, currentMonth, currentYear)
            if (result.eligible) {
              eligibleUsers++
            } else {
              ineligibleUsers++
              totalRolledUp += result.rolledUpAmount || 0
            }
            processedUsers++
          } catch (error) {
            errors.push({
              userId: user.id,
              error: error.message
            })
            console.error(`[${jobId}] Failed to process user ${user.id}:`, error)
          }
        })
      )

      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    // Update global monthly statistics
    await updateMonthlyStats({
      jobId,
      month: currentMonth + 1,
      year: currentYear,
      eligibleUsers,
      ineligibleUsers,
      totalRolledUp
    })

    // Create job execution log
    await createJobLog({
      jobId,
      jobType: 'monthly_eligibility_sweep',
      status: errors.length === 0 ? 'success' : 'partial_success',
      startTime,
      endTime: new Date(),
      metadata: {
        totalUsers: users.length,
        processed: processedUsers,
        eligible: eligibleUsers,
        ineligible: ineligibleUsers,
        totalRolledUp,
        month: `${currentYear}-${currentMonth + 1}`,
        errors: errors.slice(0, 10)
      }
    })

    console.log(`[${jobId}] Monthly sweep completed. Eligible: ${eligibleUsers}, Ineligible: ${ineligibleUsers}, Rolled up: ₹${totalRolledUp}`)

    // Send admin summary
    await sendMonthlySummary({
      jobId,
      month: currentMonth + 1,
      year: currentYear,
      eligibleUsers,
      ineligibleUsers,
      totalRolledUp,
      errors
    })

    return {
      success: true,
      eligible: eligibleUsers,
      ineligible: ineligibleUsers,
      totalRolledUp,
      errors
    }

  } catch (error) {
    console.error(`[${jobId}] Critical error in monthly sweep:`, error)
    
    await createJobLog({
      jobId,
      jobType: 'monthly_eligibility_sweep',
      status: 'failed',
      startTime,
      endTime: new Date(),
      error: error.message,
      metadata: {
        processed: processedUsers,
        eligible: eligibleUsers,
        ineligible: ineligibleUsers
      }
    })

    throw error
  }
}

/**
 * Process individual user eligibility
 */
async function processUserEligibility(user, jobId, currentMonth, currentYear) {
  const minMonthlyPurchase = 500 // ₹500 minimum requirement
  const isEligible = user.monthlyPurchase >= minMonthlyPurchase && user.isKycApproved
  
  let rolledUpAmount = 0

  await prisma.$transaction(async (tx) => {
    // If user is ineligible, rollup their month's repurchase commissions
    if (!isEligible) {
      // Get this month's repurchase commissions
      const monthStart = new Date(currentYear, currentMonth - 1, 1)
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

      const repurchaseCommissions = await tx.commission.findMany({
        where: {
          userId: user.id,
          type: 'repurchase',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          },
          status: 'pending' // Only rollup pending commissions
        }
      })

      rolledUpAmount = repurchaseCommissions.reduce((sum, comm) => sum + comm.amount, 0)

      if (rolledUpAmount > 0) {
        // Mark commissions as rolled up
        await tx.commission.updateMany({
          where: {
            id: {
              in: repurchaseCommissions.map(c => c.id)
            }
          },
          data: {
            status: 'rolled_up',
            processedAt: new Date(),
            metadata: {
              rolledUpReason: 'monthly_eligibility_failure',
              minPurchaseRequired: minMonthlyPurchase,
              actualPurchase: user.monthlyPurchase,
              kycApproved: user.isKycApproved,
              jobId
            }
          }
        })

        // Create company ledger entry for rolled up amount
        await tx.ledger.create({
          data: {
            userId: 1, // Company/system user ID
            type: 'commission_rollup',
            amount: rolledUpAmount,
            description: `Rolled up repurchase commissions from user ${user.id} - ineligible for month ${currentYear}-${currentMonth}`,
            ref: `ROLLUP_${user.id}_${currentYear}${currentMonth}`,
            metadata: {
              originalUserId: user.id,
              rolledUpCommissions: repurchaseCommissions.length,
              reason: 'monthly_eligibility_failure',
              month: `${currentYear}-${currentMonth}`,
              jobId
            }
          }
        })

        // Create rollup history entry
        await tx.commissionRollup.create({
          data: {
            userId: user.id,
            month: currentMonth,
            year: currentYear,
            rolledUpAmount,
            commissionCount: repurchaseCommissions.length,
            reason: 'monthly_eligibility_failure',
            eligibilityCheck: {
              monthlyPurchase: user.monthlyPurchase,
              requiredPurchase: minMonthlyPurchase,
              kycApproved: user.isKycApproved
            },
            jobId
          }
        })
      }
    }

    // Update user's monthly tracking
    await tx.user.update({
      where: { id: user.id },
      data: {
        lastMonthPurchase: user.monthlyPurchase,
        monthlyPurchase: 0, // Reset for new month
        lastEligibilityCheck: new Date(),
        isEligibleRepurchase: isEligible,
        eligibilityHistory: {
          push: {
            month: `${currentYear}-${currentMonth}`,
            eligible: isEligible,
            monthlyPurchase: user.monthlyPurchase,
            kycApproved: user.isKycApproved,
            rolledUpAmount,
            checkedAt: new Date()
          }
        }
      }
    })

    // Create eligibility log entry
    await tx.eligibilityLog.create({
      data: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
        isEligible,
        monthlyPurchase: user.monthlyPurchase,
        requiredPurchase: minMonthlyPurchase,
        kycApproved: user.isKycApproved,
        rolledUpAmount,
        jobId
      }
    })
  })

  // Send notification to ineligible users
  if (!isEligible && user.email) {
    try {
      await sendEligibilityNotification({
        user,
        eligible: false,
        month: currentMonth,
        year: currentYear,
        rolledUpAmount,
        minPurchaseRequired: minMonthlyPurchase
      })
    } catch (emailError) {
      console.warn(`[${jobId}] Failed to send eligibility email to user ${user.id}:`, emailError.message)
    }
  }

  console.log(`[${jobId}] Processed user ${user.id}: ${isEligible ? 'eligible' : 'ineligible'}, rolled up: ₹${rolledUpAmount}`)
  
  return {
    eligible: isEligible,
    rolledUpAmount
  }
}

/**
 * Update monthly statistics
 */
async function updateMonthlyStats({ jobId, month, year, eligibleUsers, ineligibleUsers, totalRolledUp }) {
  try {
    await prisma.monthlyStats.upsert({
      where: {
        monthYear: `${year}-${month.toString().padStart(2, '0')}`
      },
      update: {
        eligibleUsers,
        ineligibleUsers,
        totalRolledUpAmount: totalRolledUp,
        lastUpdated: new Date(),
        jobId
      },
      create: {
        month,
        year,
        monthYear: `${year}-${month.toString().padStart(2, '0')}`,
        eligibleUsers,
        ineligibleUsers,
        totalRolledUpAmount: totalRolledUp,
        jobId
      }
    })
  } catch (error) {
    console.error('Failed to update monthly stats:', error)
  }
}

/**
 * Send eligibility notification to user
 */
async function sendEligibilityNotification({ user, eligible, month, year, rolledUpAmount, minPurchaseRequired }) {
  const emailData = {
    to: user.email,
    subject: eligible ? 'Monthly Eligibility Confirmed' : 'Monthly Eligibility Requirements Not Met',
    template: 'eligibility-notification',
    data: {
      userName: user.fullName,
      eligible,
      month: new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      monthlyPurchase: user.monthlyPurchase,
      requiredPurchase: minPurchaseRequired,
      kycApproved: user.isKycApproved,
      rolledUpAmount,
      nextSteps: eligible ? [
        'Continue making monthly purchases',
        'Share referral link to earn commissions',
        'Check your wallet for credited amounts'
      ] : [
        'Complete KYC verification if pending',
        `Make at least ₹${minPurchaseRequired} purchase this month`,
        'Contact support if you need assistance'
      ]
    }
  }

  await sendEmail(emailData)
}

/**
 * Send monthly summary to admin
 */
async function sendMonthlySummary({ jobId, month, year, eligibleUsers, ineligibleUsers, totalRolledUp, errors }) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
    
    const emailData = {
      to: adminEmail,
      subject: `Monthly Eligibility Sweep Complete - ${year}-${month}`,
      template: 'admin-monthly-summary',
      data: {
        jobId,
        month: new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        eligibleUsers,
        ineligibleUsers,
        totalUsers: eligibleUsers + ineligibleUsers,
        eligibilityRate: ((eligibleUsers / (eligibleUsers + ineligibleUsers)) * 100).toFixed(1),
        totalRolledUp,
        errorCount: errors.length,
        topErrors: errors.slice(0, 5)
      }
    }

    await sendEmail(emailData)
  } catch (error) {
    console.error('Failed to send monthly summary:', error)
  }
}

/**
 * Generate monthly eligibility report
 */
export async function generateMonthlyReport(month, year) {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  // Get eligibility breakdown
  const eligibilityStats = await prisma.eligibilityLog.groupBy({
    by: ['isEligible'],
    where: {
      month,
      year
    },
    _count: {
      userId: true
    },
    _sum: {
      rolledUpAmount: true
    }
  })

  // Get top ineligible users by rolled up amount
  const topRollups = await prisma.eligibilityLog.findMany({
    where: {
      month,
      year,
      isEligible: false,
      rolledUpAmount: {
        gt: 0
      }
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      rolledUpAmount: 'desc'
    },
    take: 10
  })

  // Get purchase distribution
  const purchaseStats = await prisma.eligibilityLog.groupBy({
    by: ['monthlyPurchase'],
    where: {
      month,
      year
    },
    _count: {
      userId: true
    }
  })

  return {
    month: `${year}-${month}`,
    eligibilityStats,
    topRollups,
    purchaseStats,
    generatedAt: new Date()
  }
}

/**
 * Get monthly eligibility trends
 */
export async function getEligibilityTrends(months = 6) {
  const trends = await prisma.monthlyStats.findMany({
    orderBy: {
      year: 'desc',
      month: 'desc'
    },
    take: months
  })

  return trends.map(stat => ({
    month: `${stat.year}-${stat.month.toString().padStart(2, '0')}`,
    eligible: stat.eligibleUsers,
    ineligible: stat.ineligibleUsers,
    eligibilityRate: ((stat.eligibleUsers / (stat.eligibleUsers + stat.ineligibleUsers)) * 100).toFixed(1),
    rolledUpAmount: stat.totalRolledUpAmount
  }))
}

/**
 * Create job execution log
 */
async function createJobLog({ jobId, jobType, status, startTime, endTime, error, metadata }) {
  try {
    await prisma.jobLog.create({
      data: {
        jobId,
        jobType,
        status,
        startTime,
        endTime,
        duration: endTime - startTime,
        error,
        metadata
      }
    })
  } catch (logError) {
    console.error('Failed to create job log:', logError)
  }
}
