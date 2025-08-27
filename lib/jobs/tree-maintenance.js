import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

/**
 * Tree Health Check and Maintenance Job
 * Verifies and repairs MLM tree structure integrity
 * Runs daily at 3 AM
 */
export async function performTreeHealthCheck() {
  const startTime = new Date()
  const jobId = `tree-health-${Date.now()}`
  
  console.log(`[${jobId}] Starting tree health check at ${startTime.toISOString()}`)
  
  let issuesFound = 0
  let issuesFixed = 0
  let eligibilityUpdates = 0
  const healthReport = {
    orphanedUsers: [],
    invalidHierarchies: [],
    inconsistentPlacements: [],
    eligibilityViolations: [],
    fixedIssues: [],
    criticalErrors: []
  }

  try {
    // 1. Check for orphaned users (users without proper hierarchy)
    console.log(`[${jobId}] Checking for orphaned users...`)
    await checkOrphanedUsers(healthReport, jobId)

    // 2. Validate hierarchy table consistency
    console.log(`[${jobId}] Validating hierarchy consistency...`)
    await validateHierarchyConsistency(healthReport, jobId)

    // 3. Check matrix placement consistency
    console.log(`[${jobId}] Checking matrix placements...`)
    await checkMatrixPlacements(healthReport, jobId)

    // 4. Verify 3-3 rule eligibility
    console.log(`[${jobId}] Verifying 3-3 rule eligibility...`)
    await verify3x3RuleEligibility(healthReport, jobId)

    // 5. Check commission calculation integrity
    console.log(`[${jobId}] Checking commission integrity...`)
    await checkCommissionIntegrity(healthReport, jobId)

    // 6. Attempt automatic fixes for non-critical issues
    console.log(`[${jobId}] Attempting automatic fixes...`)
    const fixResults = await attemptAutomaticFixes(healthReport, jobId)
    issuesFixed = fixResults.fixed
    eligibilityUpdates = fixResults.eligibilityUpdates

    // Count total issues
    issuesFound = Object.values(healthReport).reduce((total, issues) => {
      return total + (Array.isArray(issues) ? issues.length : 0)
    }, 0)

    // Generate health score
    const healthScore = calculateHealthScore(healthReport)

    // Create comprehensive report
    const report = await generateHealthReport({
      jobId,
      healthReport,
      healthScore,
      issuesFound,
      issuesFixed,
      eligibilityUpdates,
      startTime,
      endTime: new Date()
    })

    // Create job log
    await createJobLog({
      jobId,
      jobType: 'tree_health_check',
      status: healthReport.criticalErrors.length > 0 ? 'warning' : 'success',
      startTime,
      endTime: new Date(),
      metadata: {
        healthScore,
        issuesFound,
        issuesFixed,
        eligibilityUpdates,
        criticalErrors: healthReport.criticalErrors.length
      }
    })

    console.log(`[${jobId}] Tree health check completed. Score: ${healthScore}%, Issues: ${issuesFound}, Fixed: ${issuesFixed}`)

    // Send alert if health score is low or critical errors found
    if (healthScore < 85 || healthReport.criticalErrors.length > 0) {
      await sendHealthAlert({
        jobId,
        healthScore,
        criticalErrors: healthReport.criticalErrors,
        report
      })
    }

    return {
      success: true,
      healthScore,
      issuesFound,
      issuesFixed,
      eligibilityUpdates,
      report
    }

  } catch (error) {
    console.error(`[${jobId}] Critical error in tree health check:`, error)
    
    await createJobLog({
      jobId,
      jobType: 'tree_health_check',
      status: 'failed',
      startTime,
      endTime: new Date(),
      error: error.message,
      metadata: {
        issuesFound,
        issuesFixed
      }
    })

    throw error
  }
}

/**
 * Check for orphaned users
 */
async function checkOrphanedUsers(healthReport, jobId) {
  // Find users who should have hierarchy entries but don't
  const usersWithoutHierarchy = await prisma.user.findMany({
    where: {
      role: 'user',
      isActive: true,
      sponsorId: { not: null },
      hierarchy: {
        none: {}
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      sponsorId: true,
      matrixLevel: true,
      matrixPosition: true,
      createdAt: true
    }
  })

  healthReport.orphanedUsers = usersWithoutHierarchy.map(user => ({
    userId: user.id,
    name: user.fullName,
    sponsorId: user.sponsorId,
    issue: 'Missing hierarchy entry',
    severity: 'medium'
  }))

  // Find hierarchy entries with invalid user references
  const invalidHierarchyEntries = await prisma.hierarchy.findMany({
    where: {
      OR: [
        { user: null },
        { sponsor: null }
      ]
    },
    include: {
      user: true,
      sponsor: true
    }
  })

  healthReport.orphanedUsers.push(...invalidHierarchyEntries.map(entry => ({
    hierarchyId: entry.id,
    userId: entry.userId,
    sponsorId: entry.sponsorId,
    issue: 'Invalid hierarchy reference',
    severity: 'high'
  })))
}

/**
 * Validate hierarchy table consistency
 */
async function validateHierarchyConsistency(healthReport, jobId) {
  // Check for circular references
  const hierarchyEntries = await prisma.hierarchy.findMany({
    include: {
      user: true,
      sponsor: true
    }
  })

  for (const entry of hierarchyEntries) {
    // Check if user is their own sponsor
    if (entry.userId === entry.sponsorId) {
      healthReport.invalidHierarchies.push({
        hierarchyId: entry.id,
        userId: entry.userId,
        issue: 'User is their own sponsor',
        severity: 'critical'
      })
    }

    // Check for inconsistent levels
    if (entry.level <= 0 || entry.level > 5) {
      healthReport.invalidHierarchies.push({
        hierarchyId: entry.id,
        userId: entry.userId,
        level: entry.level,
        issue: 'Invalid hierarchy level',
        severity: 'medium'
      })
    }
  }

  // Check for duplicate hierarchy entries
  const duplicates = await prisma.$queryRaw`
    SELECT user_id, sponsor_id, level, COUNT(*) as count
    FROM Hierarchy 
    GROUP BY user_id, sponsor_id, level 
    HAVING COUNT(*) > 1
  `

  healthReport.invalidHierarchies.push(...duplicates.map(dup => ({
    userId: dup.user_id,
    sponsorId: dup.sponsor_id,
    level: dup.level,
    count: dup.count,
    issue: 'Duplicate hierarchy entry',
    severity: 'medium'
  })))
}

/**
 * Check matrix placement consistency
 */
async function checkMatrixPlacements(healthReport, jobId) {
  // Check for users with invalid matrix positions
  const usersWithInvalidPositions = await prisma.user.findMany({
    where: {
      role: 'user',
      OR: [
        {
          matrixLevel: { not: null },
          matrixPosition: null
        },
        {
          matrixLevel: null,
          matrixPosition: { not: null }
        },
        {
          matrixLevel: { lt: 1 }
        },
        {
          matrixLevel: { gt: 5 }
        }
      ]
    },
    select: {
      id: true,
      fullName: true,
      matrixLevel: true,
      matrixPosition: true
    }
  })

  healthReport.inconsistentPlacements = usersWithInvalidPositions.map(user => ({
    userId: user.id,
    name: user.fullName,
    matrixLevel: user.matrixLevel,
    matrixPosition: user.matrixPosition,
    issue: 'Invalid matrix placement',
    severity: 'medium'
  }))

  // Check for duplicate matrix positions at same level
  const duplicatePositions = await prisma.$queryRaw`
    SELECT matrix_level, matrix_position, COUNT(*) as count
    FROM User 
    WHERE matrix_level IS NOT NULL AND matrix_position IS NOT NULL
    GROUP BY matrix_level, matrix_position 
    HAVING COUNT(*) > 1
  `

  healthReport.inconsistentPlacements.push(...duplicatePositions.map(dup => ({
    matrixLevel: dup.matrix_level,
    matrixPosition: dup.matrix_position,
    count: dup.count,
    issue: 'Duplicate matrix position',
    severity: 'high'
  })))
}

/**
 * Verify 3-3 rule eligibility
 */
async function verify3x3RuleEligibility(healthReport, jobId) {
  // Get users marked as eligible for repurchase
  const eligibleUsers = await prisma.user.findMany({
    where: {
      role: 'user',
      isEligibleRepurchase: true
    },
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

  for (const user of eligibleUsers) {
    // Check 3-3 rule compliance
    const qualifiedReferrals = user.referrals.filter(referral => 
      referral.orders.length >= 3 && referral.isActive
    ).length

    if (qualifiedReferrals < 3) {
      healthReport.eligibilityViolations.push({
        userId: user.id,
        name: user.fullName,
        qualifiedReferrals,
        totalReferrals: user.referrals.length,
        issue: '3-3 rule violation - marked eligible but insufficient qualified referrals',
        severity: 'medium'
      })
    }

    // Check KYC requirement
    if (!user.isKycApproved) {
      healthReport.eligibilityViolations.push({
        userId: user.id,
        name: user.fullName,
        issue: 'Marked eligible but KYC not approved',
        severity: 'high'
      })
    }

    // Check monthly purchase requirement
    if (user.monthlyPurchase < 500) {
      healthReport.eligibilityViolations.push({
        userId: user.id,
        name: user.fullName,
        monthlyPurchase: user.monthlyPurchase,
        issue: 'Marked eligible but insufficient monthly purchase',
        severity: 'medium'
      })
    }
  }
}

/**
 * Check commission calculation integrity
 */
async function checkCommissionIntegrity(healthReport, jobId) {
  // Check for commissions without corresponding orders
  const orphanedCommissions = await prisma.commission.findMany({
    where: {
      orderId: { not: null },
      order: null
    },
    select: {
      id: true,
      userId: true,
      orderId: true,
      amount: true
    }
  })

  healthReport.criticalErrors.push(...orphanedCommissions.map(comm => ({
    commissionId: comm.id,
    userId: comm.userId,
    orderId: comm.orderId,
    amount: comm.amount,
    issue: 'Commission references non-existent order',
    severity: 'critical'
  })))

  // Check for negative commission amounts
  const negativeCommissions = await prisma.commission.findMany({
    where: {
      amount: { lt: 0 }
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      type: true
    }
  })

  healthReport.criticalErrors.push(...negativeCommissions.map(comm => ({
    commissionId: comm.id,
    userId: comm.userId,
    amount: comm.amount,
    type: comm.type,
    issue: 'Negative commission amount',
    severity: 'critical'
  })))
}

/**
 * Attempt automatic fixes for identified issues
 */
async function attemptAutomaticFixes(healthReport, jobId) {
  let fixed = 0
  let eligibilityUpdates = 0

  try {
    // Fix orphaned users by creating missing hierarchy entries
    for (const orphan of healthReport.orphanedUsers) {
      if (orphan.sponsorId && orphan.userId) {
        try {
          await prisma.hierarchy.create({
            data: {
              userId: orphan.userId,
              sponsorId: orphan.sponsorId,
              level: 1 // Start with direct level
            }
          })
          
          healthReport.fixedIssues.push({
            type: 'orphaned_user',
            userId: orphan.userId,
            action: 'Created missing hierarchy entry'
          })
          fixed++
        } catch (error) {
          console.warn(`Failed to fix orphaned user ${orphan.userId}:`, error)
        }
      }
    }

    // Fix eligibility violations
    for (const violation of healthReport.eligibilityViolations) {
      if (violation.issue.includes('3-3 rule violation') || 
          violation.issue.includes('insufficient monthly purchase') ||
          violation.issue.includes('KYC not approved')) {
        try {
          await prisma.user.update({
            where: { id: violation.userId },
            data: { isEligibleRepurchase: false }
          })
          
          healthReport.fixedIssues.push({
            type: 'eligibility_violation',
            userId: violation.userId,
            action: 'Corrected eligibility status to false'
          })
          eligibilityUpdates++
        } catch (error) {
          console.warn(`Failed to fix eligibility for user ${violation.userId}:`, error)
        }
      }
    }

    // Remove duplicate hierarchy entries (keep the oldest)
    const duplicateGroups = healthReport.invalidHierarchies.filter(h => h.issue === 'Duplicate hierarchy entry')
    for (const group of duplicateGroups) {
      try {
        const duplicates = await prisma.hierarchy.findMany({
          where: {
            userId: group.userId,
            sponsorId: group.sponsorId,
            level: group.level
          },
          orderBy: { createdAt: 'asc' }
        })

        // Delete all but the first (oldest) entry
        if (duplicates.length > 1) {
          await prisma.hierarchy.deleteMany({
            where: {
              id: {
                in: duplicates.slice(1).map(d => d.id)
              }
            }
          })
          
          healthReport.fixedIssues.push({
            type: 'duplicate_hierarchy',
            userId: group.userId,
            action: `Removed ${duplicates.length - 1} duplicate entries`
          })
          fixed++
        }
      } catch (error) {
        console.warn(`Failed to fix duplicate hierarchy for user ${group.userId}:`, error)
      }
    }

  } catch (error) {
    console.error('Error during automatic fixes:', error)
  }

  return { fixed, eligibilityUpdates }
}

/**
 * Calculate overall tree health score
 */
function calculateHealthScore(healthReport) {
  let totalIssues = 0
  let weightedScore = 0

  // Weight issues by severity
  const severityWeights = { low: 1, medium: 3, high: 5, critical: 10 }

  Object.values(healthReport).forEach(issues => {
    if (Array.isArray(issues)) {
      issues.forEach(issue => {
        const weight = severityWeights[issue.severity] || 3
        totalIssues += weight
      })
    }
  })

  // Calculate score (100 - penalty, minimum 0)
  const penalty = Math.min(totalIssues * 2, 100) // Each weighted issue reduces score by 2%
  const score = Math.max(100 - penalty, 0)

  return Math.round(score)
}

/**
 * Generate comprehensive health report
 */
async function generateHealthReport(data) {
  const report = {
    ...data,
    summary: {
      overallHealth: data.healthScore >= 90 ? 'Excellent' : 
                    data.healthScore >= 75 ? 'Good' : 
                    data.healthScore >= 50 ? 'Fair' : 'Poor',
      recommendations: generateRecommendations(data.healthReport, data.healthScore)
    }
  }

  // Store report in database
  try {
    await prisma.treeHealthReport.create({
      data: {
        jobId: data.jobId,
        healthScore: data.healthScore,
        issuesFound: data.issuesFound,
        issuesFixed: data.issuesFixed,
        reportData: report,
        createdAt: data.endTime
      }
    })
  } catch (error) {
    console.error('Failed to store health report:', error)
  }

  return report
}

/**
 * Generate recommendations based on issues found
 */
function generateRecommendations(healthReport, healthScore) {
  const recommendations = []

  if (healthReport.criticalErrors.length > 0) {
    recommendations.push('URGENT: Address critical errors immediately - data integrity at risk')
  }

  if (healthReport.orphanedUsers.length > 5) {
    recommendations.push('Review user onboarding process - multiple orphaned users detected')
  }

  if (healthReport.eligibilityViolations.length > 10) {
    recommendations.push('Audit eligibility checking logic - multiple false positives detected')
  }

  if (healthReport.inconsistentPlacements.length > 0) {
    recommendations.push('Review matrix placement algorithm for consistency issues')
  }

  if (healthScore < 75) {
    recommendations.push('Schedule immediate manual review of MLM tree structure')
  }

  return recommendations
}

/**
 * Send health alert to administrators
 */
async function sendHealthAlert({ jobId, healthScore, criticalErrors, report }) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
    
    const emailData = {
      to: adminEmail,
      subject: `MLM Tree Health Alert - Score: ${healthScore}%`,
      template: 'tree-health-alert',
      data: {
        jobId,
        healthScore,
        healthStatus: healthScore >= 75 ? 'Warning' : 'Critical',
        criticalErrorCount: criticalErrors.length,
        topCriticalErrors: criticalErrors.slice(0, 3),
        issuesFound: report.issuesFound,
        issuesFixed: report.issuesFixed,
        recommendations: report.summary.recommendations
      }
    }

    await sendEmail(emailData)
  } catch (error) {
    console.error('Failed to send health alert:', error)
  }
}

/**
 * Get tree health history
 */
export async function getTreeHealthHistory(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const healthHistory = await prisma.treeHealthReport.findMany({
    where: {
      createdAt: {
        gte: since
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      jobId: true,
      healthScore: true,
      issuesFound: true,
      issuesFixed: true,
      createdAt: true
    }
  })

  return healthHistory
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
