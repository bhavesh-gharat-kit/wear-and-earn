import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

/**
 * Commission Reconciliation Job
 * Verifies ledger entries match wallet balances and detects discrepancies
 * Runs daily at 4 AM
 */
export async function performCommissionReconciliation() {
  const startTime = new Date()
  const jobId = `reconciliation-${Date.now()}`
  
  console.log(`[${jobId}] Starting commission reconciliation at ${startTime.toISOString()}`)
  
  let usersChecked = 0
  let discrepanciesFound = 0
  let autoCorrections = 0
  let totalDiscrepancyAmount = 0
  
  const reconciliationReport = {
    walletDiscrepancies: [],
    ledgerInconsistencies: [],
    commissionMismatches: [],
    autoCorrections: [],
    criticalIssues: [],
    summary: {}
  }

  try {
    // 1. Verify wallet balances against ledger totals
    console.log(`[${jobId}] Checking wallet vs ledger consistency...`)
    await checkWalletLedgerConsistency(reconciliationReport, jobId)

    // 2. Verify commission calculations
    console.log(`[${jobId}] Verifying commission calculations...`)
    await verifyCommissionCalculations(reconciliationReport, jobId)

    // 3. Check for orphaned transactions
    console.log(`[${jobId}] Checking for orphaned transactions...`)
    await checkOrphanedTransactions(reconciliationReport, jobId)

    // 4. Verify withdrawal consistency
    console.log(`[${jobId}] Checking withdrawal consistency...`)
    await checkWithdrawalConsistency(reconciliationReport, jobId)

    // 5. Perform automatic corrections
    console.log(`[${jobId}] Performing automatic corrections...`)
    const correctionResults = await performAutomaticCorrections(reconciliationReport, jobId)
    autoCorrections = correctionResults.corrections
    
    // Count totals
    usersChecked = reconciliationReport.walletDiscrepancies.length + 
                  (await prisma.user.count({ where: { role: 'user' } }))
    
    discrepanciesFound = reconciliationReport.walletDiscrepancies.length +
                        reconciliationReport.ledgerInconsistencies.length +
                        reconciliationReport.commissionMismatches.length
    
    totalDiscrepancyAmount = [...reconciliationReport.walletDiscrepancies, 
                            ...reconciliationReport.ledgerInconsistencies]
                            .reduce((sum, item) => sum + Math.abs(item.discrepancy || 0), 0)

    // Generate final report
    const finalReport = await generateReconciliationReport({
      jobId,
      reconciliationReport,
      usersChecked,
      discrepanciesFound,
      autoCorrections,
      totalDiscrepancyAmount,
      startTime,
      endTime: new Date()
    })

    // Create job log
    await createJobLog({
      jobId,
      jobType: 'commission_reconciliation',
      status: reconciliationReport.criticalIssues.length > 0 ? 'warning' : 'success',
      startTime,
      endTime: new Date(),
      metadata: {
        usersChecked,
        discrepanciesFound,
        autoCorrections,
        totalDiscrepancyAmount,
        criticalIssues: reconciliationReport.criticalIssues.length
      }
    })

    console.log(`[${jobId}] Reconciliation completed. Users: ${usersChecked}, Discrepancies: ${discrepanciesFound}, Auto-fixed: ${autoCorrections}`)

    // Send alert if significant discrepancies found
    if (discrepanciesFound > 10 || totalDiscrepancyAmount > 10000 || reconciliationReport.criticalIssues.length > 0) {
      await sendReconciliationAlert({
        jobId,
        discrepanciesFound,
        totalDiscrepancyAmount,
        criticalIssues: reconciliationReport.criticalIssues,
        report: finalReport
      })
    }

    return {
      success: true,
      usersChecked,
      discrepanciesFound,
      autoCorrections,
      totalDiscrepancyAmount,
      report: finalReport
    }

  } catch (error) {
    console.error(`[${jobId}] Critical error in reconciliation:`, error)
    
    await createJobLog({
      jobId,
      jobType: 'commission_reconciliation',
      status: 'failed',
      startTime,
      endTime: new Date(),
      error: error.message,
      metadata: {
        usersChecked,
        discrepanciesFound
      }
    })

    throw error
  }
}

/**
 * Check wallet balances against ledger totals
 */
async function checkWalletLedgerConsistency(report, jobId) {
  // Get all users with their wallet balances and calculate ledger totals
  const users = await prisma.user.findMany({
    where: {
      role: 'user'
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      walletBalance: true
    }
  })

  for (const user of users) {
    try {
      // Calculate total from ledger entries
      const ledgerTotal = await prisma.ledger.aggregate({
        where: {
          userId: user.id
        },
        _sum: {
          amount: true
        }
      })

      const calculatedBalance = ledgerTotal._sum.amount || 0
      const walletBalance = user.walletBalance || 0
      const discrepancy = walletBalance - calculatedBalance

      // Allow small rounding differences (₹0.01)
      if (Math.abs(discrepancy) > 0.01) {
        report.walletDiscrepancies.push({
          userId: user.id,
          userName: user.fullName,
          email: user.email,
          walletBalance,
          calculatedBalance,
          discrepancy,
          severity: Math.abs(discrepancy) > 100 ? 'high' : 'medium',
          type: 'wallet_ledger_mismatch'
        })

        if (Math.abs(discrepancy) > 1000) {
          report.criticalIssues.push({
            type: 'large_wallet_discrepancy',
            userId: user.id,
            discrepancy,
            severity: 'critical'
          })
        }
      }
    } catch (error) {
      console.error(`Error checking user ${user.id}:`, error)
      report.criticalIssues.push({
        type: 'calculation_error',
        userId: user.id,
        error: error.message,
        severity: 'high'
      })
    }
  }
}

/**
 * Verify commission calculations
 */
async function verifyCommissionCalculations(report, jobId) {
  // Check recent orders for correct commission calculations
  const recentOrders = await prisma.order.findMany({
    where: {
      status: 'completed',
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    include: {
      user: {
        include: {
          sponsor: true
        }
      },
      commissions: true
    }
  })

  for (const order of recentOrders) {
    try {
      // Calculate expected commissions
      const expectedCommissions = calculateExpectedCommissions(order)
      const actualCommissions = order.commissions

      // Compare expected vs actual
      for (let level = 1; level <= 5; level++) {
        const expected = expectedCommissions.find(c => c.level === level)
        const actual = actualCommissions.find(c => c.level === level)

        if (expected && !actual) {
          report.commissionMismatches.push({
            orderId: order.id,
            level,
            expectedAmount: expected.amount,
            actualAmount: 0,
            discrepancy: expected.amount,
            type: 'missing_commission',
            severity: 'high'
          })
        } else if (!expected && actual) {
          report.commissionMismatches.push({
            orderId: order.id,
            level,
            expectedAmount: 0,
            actualAmount: actual.amount,
            discrepancy: -actual.amount,
            type: 'unexpected_commission',
            severity: 'medium'
          })
        } else if (expected && actual && Math.abs(expected.amount - actual.amount) > 0.01) {
          report.commissionMismatches.push({
            orderId: order.id,
            level,
            expectedAmount: expected.amount,
            actualAmount: actual.amount,
            discrepancy: actual.amount - expected.amount,
            type: 'incorrect_commission_amount',
            severity: 'medium'
          })
        }
      }
    } catch (error) {
      console.error(`Error verifying commissions for order ${order.id}:`, error)
      report.criticalIssues.push({
        type: 'commission_verification_error',
        orderId: order.id,
        error: error.message,
        severity: 'medium'
      })
    }
  }
}

/**
 * Calculate expected commissions for an order
 */
function calculateExpectedCommissions(order) {
  const expectedCommissions = []
  const commissionRates = [0.10, 0.08, 0.06, 0.04, 0.02] // 10%, 8%, 6%, 4%, 2%
  
  // This is a simplified calculation - replace with your actual commission logic
  let currentUser = order.user
  
  for (let level = 1; level <= 5; level++) {
    if (currentUser?.sponsor) {
      const commissionAmount = order.totalAmount * commissionRates[level - 1]
      expectedCommissions.push({
        level,
        userId: currentUser.sponsor.id,
        amount: commissionAmount
      })
      currentUser = currentUser.sponsor
    } else {
      break
    }
  }
  
  return expectedCommissions
}

/**
 * Check for orphaned transactions
 */
async function checkOrphanedTransactions(report, jobId) {
  // Find ledger entries without corresponding users
  const orphanedLedgerEntries = await prisma.ledger.findMany({
    where: {
      user: null
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      type: true,
      description: true,
      createdAt: true
    }
  })

  report.ledgerInconsistencies.push(...orphanedLedgerEntries.map(entry => ({
    ledgerId: entry.id,
    userId: entry.userId,
    amount: entry.amount,
    type: entry.type,
    issue: 'Ledger entry references non-existent user',
    severity: 'high'
  })))

  // Find commissions without corresponding orders (where orderId is not null)
  const orphanedCommissions = await prisma.commission.findMany({
    where: {
      orderId: { not: null },
      order: null
    },
    select: {
      id: true,
      userId: true,
      orderId: true,
      amount: true,
      level: true
    }
  })

  report.ledgerInconsistencies.push(...orphanedCommissions.map(comm => ({
    commissionId: comm.id,
    userId: comm.userId,
    orderId: comm.orderId,
    amount: comm.amount,
    level: comm.level,
    issue: 'Commission references non-existent order',
    severity: 'critical'
  })))

  // Find withdrawals without corresponding ledger entries
  const withdrawalsWithoutLedger = await prisma.withdrawal.findMany({
    where: {
      status: 'approved'
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      processedAt: true
    }
  })

  for (const withdrawal of withdrawalsWithoutLedger) {
    const correspondingLedger = await prisma.ledger.findFirst({
      where: {
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: -withdrawal.amount,
        createdAt: {
          gte: new Date(withdrawal.processedAt.getTime() - 60000), // ±1 minute
          lte: new Date(withdrawal.processedAt.getTime() + 60000)
        }
      }
    })

    if (!correspondingLedger) {
      report.ledgerInconsistencies.push({
        withdrawalId: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        processedAt: withdrawal.processedAt,
        issue: 'Approved withdrawal without corresponding ledger entry',
        severity: 'high'
      })
    }
  }
}

/**
 * Check withdrawal consistency
 */
async function checkWithdrawalConsistency(report, jobId) {
  // Get all approved withdrawals from last 30 days
  const recentWithdrawals = await prisma.withdrawal.findMany({
    where: {
      status: 'approved',
      processedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          walletBalance: true
        }
      }
    }
  })

  for (const withdrawal of recentWithdrawals) {
    // Check if user's wallet was properly debited
    const withdrawalLedgerEntry = await prisma.ledger.findFirst({
      where: {
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: -withdrawal.amount,
        ref: {
          contains: withdrawal.id.toString()
        }
      }
    })

    if (!withdrawalLedgerEntry) {
      report.ledgerInconsistencies.push({
        withdrawalId: withdrawal.id,
        userId: withdrawal.userId,
        userName: withdrawal.user.fullName,
        amount: withdrawal.amount,
        issue: 'Withdrawal processed but no ledger debit entry found',
        severity: 'critical'
      })
    }
  }
}

/**
 * Perform automatic corrections for minor discrepancies
 */
async function performAutomaticCorrections(report, jobId) {
  let corrections = 0
  const maxAutoCorrection = 1.00 // Max ₹1 auto-correction

  for (const discrepancy of report.walletDiscrepancies) {
    // Only auto-correct small discrepancies
    if (Math.abs(discrepancy.discrepancy) <= maxAutoCorrection && 
        discrepancy.severity !== 'high') {
      
      try {
        await prisma.$transaction(async (tx) => {
          // Create corrective ledger entry
          await tx.ledger.create({
            data: {
              userId: discrepancy.userId,
              type: 'balance_correction',
              amount: discrepancy.discrepancy,
              description: `Automatic balance correction - reconciliation job`,
              ref: `AUTO_CORRECTION_${jobId}_${discrepancy.userId}`,
              metadata: {
                jobId,
                originalWalletBalance: discrepancy.walletBalance,
                calculatedBalance: discrepancy.calculatedBalance,
                correctionReason: 'automatic_reconciliation',
                approvedBy: 'system'
              }
            }
          })

          // Update wallet balance
          await tx.user.update({
            where: { id: discrepancy.userId },
            data: {
              walletBalance: discrepancy.calculatedBalance
            }
          })
        })

        report.autoCorrections.push({
          userId: discrepancy.userId,
          userName: discrepancy.userName,
          correctionAmount: discrepancy.discrepancy,
          previousBalance: discrepancy.walletBalance,
          newBalance: discrepancy.calculatedBalance,
          action: 'wallet_balance_corrected'
        })

        corrections++
        
        console.log(`[${jobId}] Auto-corrected ₹${discrepancy.discrepancy} for user ${discrepancy.userId}`)
        
      } catch (error) {
        console.error(`Failed to auto-correct user ${discrepancy.userId}:`, error)
        report.criticalIssues.push({
          type: 'auto_correction_failed',
          userId: discrepancy.userId,
          error: error.message,
          severity: 'medium'
        })
      }
    }
  }

  return { corrections }
}

/**
 * Generate comprehensive reconciliation report
 */
async function generateReconciliationReport(data) {
  const accuracy = data.discrepanciesFound === 0 ? 100 : 
                  ((data.usersChecked - data.discrepanciesFound) / data.usersChecked * 100)

  const report = {
    ...data,
    accuracy: Math.round(accuracy * 100) / 100,
    summary: {
      status: data.discrepanciesFound === 0 ? 'Clean' : 
              data.discrepanciesFound <= 5 ? 'Minor Issues' : 
              data.discrepanciesFound <= 20 ? 'Moderate Issues' : 'Significant Issues',
      recommendations: generateReconciliationRecommendations(data.reconciliationReport, data.discrepanciesFound),
      healthScore: Math.max(0, 100 - (data.discrepanciesFound * 2) - (data.totalDiscrepancyAmount / 100))
    }
  }

  // Store report in database
  try {
    await prisma.reconciliationReport.create({
      data: {
        jobId: data.jobId,
        usersChecked: data.usersChecked,
        discrepanciesFound: data.discrepanciesFound,
        autoCorrections: data.autoCorrections,
        totalDiscrepancyAmount: data.totalDiscrepancyAmount,
        accuracy: report.accuracy,
        reportData: report,
        createdAt: data.endTime
      }
    })
  } catch (error) {
    console.error('Failed to store reconciliation report:', error)
  }

  return report
}

/**
 * Generate recommendations based on findings
 */
function generateReconciliationRecommendations(reconciliationReport, discrepanciesFound) {
  const recommendations = []

  if (reconciliationReport.criticalIssues.length > 0) {
    recommendations.push('URGENT: Address critical data integrity issues immediately')
  }

  if (reconciliationReport.walletDiscrepancies.length > 10) {
    recommendations.push('Review wallet update procedures - multiple balance discrepancies detected')
  }

  if (reconciliationReport.commissionMismatches.length > 5) {
    recommendations.push('Audit commission calculation algorithm for accuracy')
  }

  if (reconciliationReport.ledgerInconsistencies.length > 0) {
    recommendations.push('Implement stricter data validation for financial transactions')
  }

  if (discrepanciesFound === 0) {
    recommendations.push('Financial data integrity is excellent - maintain current procedures')
  }

  return recommendations
}

/**
 * Send reconciliation alert to administrators
 */
async function sendReconciliationAlert({ jobId, discrepanciesFound, totalDiscrepancyAmount, criticalIssues, report }) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
    
    const emailData = {
      to: adminEmail,
      subject: `Financial Reconciliation Alert - ${discrepanciesFound} Discrepancies Found`,
      template: 'reconciliation-alert',
      data: {
        jobId,
        discrepanciesFound,
        totalDiscrepancyAmount,
        criticalIssueCount: criticalIssues.length,
        accuracy: report.accuracy,
        healthScore: report.summary.healthScore,
        status: report.summary.status,
        topCriticalIssues: criticalIssues.slice(0, 3),
        recommendations: report.summary.recommendations,
        usersChecked: report.usersChecked,
        autoCorrections: report.autoCorrections
      }
    }

    await sendEmail(emailData)
  } catch (error) {
    console.error('Failed to send reconciliation alert:', error)
  }
}

/**
 * Get reconciliation history and trends
 */
export async function getReconciliationHistory(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const history = await prisma.reconciliationReport.findMany({
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
      usersChecked: true,
      discrepanciesFound: true,
      autoCorrections: true,
      totalDiscrepancyAmount: true,
      accuracy: true,
      createdAt: true
    }
  })

  // Calculate trends
  const avgAccuracy = history.reduce((sum, r) => sum + r.accuracy, 0) / history.length
  const totalDiscrepancies = history.reduce((sum, r) => sum + r.discrepanciesFound, 0)
  const totalCorrections = history.reduce((sum, r) => sum + r.autoCorrections, 0)

  return {
    history,
    trends: {
      averageAccuracy: Math.round(avgAccuracy * 100) / 100,
      totalDiscrepancies,
      totalCorrections,
      improvementTrend: history.length >= 2 ? 
        history[0].accuracy - history[history.length - 1].accuracy : 0
    }
  }
}

/**
 * Manual reconciliation for specific user
 */
export async function reconcileUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      walletBalance: true
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const ledgerTotal = await prisma.ledger.aggregate({
    where: { userId },
    _sum: { amount: true }
  })

  const calculatedBalance = ledgerTotal._sum.amount || 0
  const discrepancy = user.walletBalance - calculatedBalance

  if (Math.abs(discrepancy) > 0.01) {
    // Create corrective transaction
    await prisma.$transaction(async (tx) => {
      await tx.ledger.create({
        data: {
          userId,
          type: 'manual_correction',
          amount: discrepancy,
          description: `Manual balance correction`,
          ref: `MANUAL_CORRECTION_${userId}_${Date.now()}`,
          metadata: {
            originalBalance: user.walletBalance,
            calculatedBalance,
            correctionAmount: discrepancy,
            correctedBy: 'admin'
          }
        }
      })

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: calculatedBalance }
      })
    })

    return {
      success: true,
      corrected: true,
      discrepancy,
      newBalance: calculatedBalance
    }
  }

  return {
    success: true,
    corrected: false,
    message: 'No discrepancy found'
  }
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
