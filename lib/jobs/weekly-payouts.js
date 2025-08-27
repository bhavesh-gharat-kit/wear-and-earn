import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

/**
 * Weekly Self-Payout Job
 * Processes scheduled self-payouts for eligible users
 * Runs every Monday at 6 AM
 */
export async function processWeeklyPayouts() {
  const startTime = new Date()
  const jobId = `weekly-payout-${Date.now()}`
  
  console.log(`[${jobId}] Starting weekly payout job at ${startTime.toISOString()}`)
  
  let processedCount = 0
  let failedCount = 0
  let totalAmount = 0
  const errors = []

  try {
    // Get all due self-payout schedules
    const duePayouts = await prisma.selfPayoutSchedule.findMany({
      where: {
        payoutDate: {
          lte: new Date()
        },
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            walletBalance: true,
            isActive: true,
            isKycApproved: true
          }
        }
      },
      orderBy: {
        payoutDate: 'asc'
      }
    })

    console.log(`[${jobId}] Found ${duePayouts.length} due payouts`)

    // Process each payout in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < duePayouts.length; i += batchSize) {
      const batch = duePayouts.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (payout) => {
          try {
            await processSinglePayout(payout, jobId)
            processedCount++
            totalAmount += payout.amount
          } catch (error) {
            failedCount++
            errors.push({
              payoutId: payout.id,
              userId: payout.userId,
              error: error.message
            })
            console.error(`[${jobId}] Failed to process payout ${payout.id}:`, error)
          }
        })
      )

      // Small delay between batches to prevent database overload
      if (i + batchSize < duePayouts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Create job execution log
    await createJobLog({
      jobId,
      jobType: 'weekly_payout',
      status: errors.length === 0 ? 'success' : 'partial_success',
      startTime,
      endTime: new Date(),
      metadata: {
        totalScheduled: duePayouts.length,
        processed: processedCount,
        failed: failedCount,
        totalAmount,
        errors: errors.slice(0, 10) // Limit error details
      }
    })

    console.log(`[${jobId}] Job completed. Processed: ${processedCount}, Failed: ${failedCount}, Total: ₹${totalAmount}`)

    // Send admin notification if there were failures
    if (failedCount > 0) {
      await sendAdminNotification({
        type: 'payout_failures',
        jobId,
        failedCount,
        errors: errors.slice(0, 5)
      })
    }

    return {
      success: true,
      processed: processedCount,
      failed: failedCount,
      totalAmount,
      errors
    }

  } catch (error) {
    console.error(`[${jobId}] Critical error in weekly payout job:`, error)
    
    await createJobLog({
      jobId,
      jobType: 'weekly_payout',
      status: 'failed',
      startTime,
      endTime: new Date(),
      error: error.message,
      metadata: {
        processed: processedCount,
        failed: failedCount
      }
    })

    // Send critical error notification
    await sendAdminNotification({
      type: 'job_failure',
      jobId,
      error: error.message
    })

    throw error
  }
}

/**
 * Process a single payout transaction
 */
async function processSinglePayout(payout, jobId) {
  const { user } = payout
  
  // Validate user eligibility
  if (!user.isActive) {
    throw new Error(`User ${user.id} is not active`)
  }

  if (!user.isKycApproved) {
    // Mark as failed due to KYC
    await prisma.selfPayoutSchedule.update({
      where: { id: payout.id },
      data: {
        status: 'failed',
        failureReason: 'KYC not approved',
        processedAt: new Date()
      }
    })
    throw new Error(`User ${user.id} KYC not approved`)
  }

  // Process payout in transaction
  await prisma.$transaction(async (tx) => {
    // Credit user wallet
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        walletBalance: {
          increment: payout.amount
        }
      }
    })

    // Create ledger entry
    await tx.ledger.create({
      data: {
        userId: user.id,
        type: 'self_payout',
        amount: payout.amount,
        description: `Weekly self-payout - ${payout.description || 'Repurchase income'}`,
        ref: `SELF_PAYOUT_${payout.id}`,
        metadata: {
          scheduleId: payout.id,
          jobId,
          payoutWeek: payout.payoutDate.toISOString().slice(0, 10),
          previousBalance: user.walletBalance,
          newBalance: updatedUser.walletBalance
        }
      }
    })

    // Mark payout as completed
    await tx.selfPayoutSchedule.update({
      where: { id: payout.id },
      data: {
        status: 'paid',
        processedAt: new Date(),
        actualAmount: payout.amount
      }
    })

    // Create payout history entry
    await tx.payoutHistory.create({
      data: {
        userId: user.id,
        amount: payout.amount,
        type: 'self_payout',
        status: 'completed',
        description: `Weekly self-payout processed`,
        metadata: {
          scheduleId: payout.id,
          jobId,
          processedBy: 'system'
        }
      }
    })
  })

  // Send payment notification email
  try {
    await sendPaymentNotification({
      user,
      amount: payout.amount,
      type: 'self_payout',
      payoutDate: payout.payoutDate
    })
  } catch (emailError) {
    console.warn(`[${jobId}] Failed to send email to user ${user.id}:`, emailError.message)
    // Don't fail the payout for email errors
  }

  console.log(`[${jobId}] Processed payout ${payout.id} for user ${user.id}: ₹${payout.amount}`)
}

/**
 * Handle retry logic for failed payouts
 */
export async function retryFailedPayouts() {
  const jobId = `retry-payouts-${Date.now()}`
  console.log(`[${jobId}] Starting retry for failed payouts`)

  try {
    // Get failed payouts that are eligible for retry
    const failedPayouts = await prisma.selfPayoutSchedule.findMany({
      where: {
        status: 'failed',
        retryCount: {
          lt: 3 // Max 3 retries
        },
        payoutDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
        }
      },
      include: {
        user: true
      }
    })

    let retryCount = 0
    for (const payout of failedPayouts) {
      try {
        // Reset status for retry
        await prisma.selfPayoutSchedule.update({
          where: { id: payout.id },
          data: {
            status: 'pending',
            retryCount: {
              increment: 1
            }
          }
        })

        await processSinglePayout(payout, jobId)
        retryCount++
      } catch (error) {
        console.error(`[${jobId}] Retry failed for payout ${payout.id}:`, error)
        
        // Mark as permanently failed after 3 retries
        if (payout.retryCount >= 2) {
          await prisma.selfPayoutSchedule.update({
            where: { id: payout.id },
            data: {
              status: 'permanently_failed',
              failureReason: `Max retries exceeded: ${error.message}`
            }
          })
        }
      }
    }

    console.log(`[${jobId}] Retry completed. Successfully retried: ${retryCount}`)
    return { success: true, retried: retryCount }

  } catch (error) {
    console.error(`[${jobId}] Critical error in retry job:`, error)
    throw error
  }
}

/**
 * Send payment notification email to user
 */
async function sendPaymentNotification({ user, amount, type, payoutDate }) {
  const emailData = {
    to: user.email,
    subject: 'Payment Credited to Your Wallet',
    template: 'payment-notification',
    data: {
      userName: user.fullName,
      amount: amount,
      paymentType: type === 'self_payout' ? 'Self Payout' : 'Commission Payment',
      payoutDate: payoutDate.toLocaleDateString('en-IN'),
      walletBalance: user.walletBalance + amount,
      transactionId: `SP_${Date.now()}`
    }
  }

  await sendEmail(emailData)
}

/**
 * Send notification to admin about job status
 */
async function sendAdminNotification({ type, jobId, failedCount, errors, error }) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wearandearn.com'
    
    let subject, message
    if (type === 'payout_failures') {
      subject = `Weekly Payout Job - ${failedCount} Failures`
      message = `Job ${jobId} completed with ${failedCount} failures.\n\nFirst 5 errors:\n${errors.map(e => `User ${e.userId}: ${e.error}`).join('\n')}`
    } else if (type === 'job_failure') {
      subject = `Critical: Weekly Payout Job Failed`
      message = `Job ${jobId} failed completely.\n\nError: ${error}`
    }

    await sendEmail({
      to: adminEmail,
      subject,
      text: message
    })
  } catch (emailError) {
    console.error('Failed to send admin notification:', emailError)
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

/**
 * Get payout statistics for monitoring
 */
export async function getPayoutStats(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const stats = await prisma.selfPayoutSchedule.aggregate({
    where: {
      processedAt: {
        gte: since
      }
    },
    _sum: {
      amount: true
    },
    _count: {
      status: true
    }
  })

  const statusBreakdown = await prisma.selfPayoutSchedule.groupBy({
    by: ['status'],
    where: {
      processedAt: {
        gte: since
      }
    },
    _count: {
      status: true
    },
    _sum: {
      amount: true
    }
  })

  return {
    totalAmount: stats._sum.amount || 0,
    totalCount: stats._count.status || 0,
    statusBreakdown
  }
}
