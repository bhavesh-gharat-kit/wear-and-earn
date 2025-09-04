import { PrismaClient } from '@prisma/client';
import { checkSelfIncomeEligibility } from '../../../../lib/mlm-new-system.js';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * Process weekly self income payouts for the NEW MLM SYSTEM
 * 
 * What it does:
 * 1. Find all due self-payout schedules (dueAt <= now, status = 'scheduled')
 * 2. Check eligibility: user must have 3 placement directs who have all made first purchase
 * 3. Credit eligible user wallets with the payout amounts
 * 4. Create ledger entries for audit trail
 * 5. Mark payouts as 'paid' or 'pending_eligibility'
 * 6. Ensure idempotency (safe to run multiple times)
 */
export async function POST(request) {
  const startTime = Date.now()
  
  try {
    // Optional: Add authorization check for production
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== NEW MLM SYSTEM: Starting weekly self income payout processing ===')

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      
      // Find all due scheduled payouts
      const duePayouts = await tx.selfPayoutSchedule.findMany({
        where: {
          status: 'scheduled',
          dueAt: {
            lte: now
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
        },
        orderBy: {
          dueAt: 'asc'
        }
      })

      console.log(`Found ${duePayouts.length} due payouts to process`)

      let processedCount = 0
      let eligibleCount = 0
      let pendingEligibilityCount = 0
      let totalPaidAmount = 0
      let errors = []

      for (const payout of duePayouts) {
        try {
          console.log(`Processing payout ${payout.id} for user ${payout.userId}`)
          
          // Check eligibility: user must have 3 placement directs with purchases
          const isEligible = await checkSelfIncomeEligibility(tx, payout.userId)
          
          if (isEligible) {
            // User is eligible - process the payout
            
            // Credit wallet
            await tx.user.update({
              where: { id: payout.userId },
              data: {
                walletBalance: {
                  increment: payout.amount
                }
              }
            })

            // Create ledger entry for the payout
            await tx.ledger.create({
              data: {
                userId: payout.userId,
                type: 'self_income_payout',
                amount: payout.amount,
                description: `Weekly self income payout - ${payout.description}`,
                ref: payout.ref,
                balanceAfter: payout.user.walletBalance + payout.amount
              }
            })

            // Mark payout as paid
            await tx.selfPayoutSchedule.update({
              where: { id: payout.id },
              data: {
                status: 'paid'
              }
            })

            eligibleCount++
            totalPaidAmount += payout.amount
            
            console.log(`✅ Paid ${payout.amount} paisa to user ${payout.userId}`)
            
          } else {
            // User is not eligible yet - mark as pending eligibility
            await tx.selfPayoutSchedule.update({
              where: { id: payout.id },
              data: {
                status: 'pending_eligibility',
                description: `${payout.description} - Pending: Need 3 placement directs with purchases`
              }
            })
            
            pendingEligibilityCount++
            
            console.log(`⏳ Payout ${payout.id} marked as pending eligibility for user ${payout.userId}`)
          }
          
          processedCount++
          
        } catch (error) {
          console.error(`Error processing payout ${payout.id}:`, error)
          errors.push({
            payoutId: payout.id,
            userId: payout.userId,
            error: error.message
          })
        }
      }

      // Summary statistics
      const summary = {
        totalDue: duePayouts.length,
        processed: processedCount,
        eligible: eligibleCount,
        pendingEligibility: pendingEligibilityCount,
        totalPaidAmount,
        totalPaidRupees: totalPaidAmount / 100,
        errors: errors.length,
        errorDetails: errors,
        processingTimeMs: Date.now() - startTime
      }

      console.log('=== Weekly payout processing summary ===')
      console.log(`Total due payouts: ${summary.totalDue}`)
      console.log(`Successfully processed: ${summary.processed}`)
      console.log(`Eligible and paid: ${summary.eligible}`)
      console.log(`Pending eligibility: ${summary.pendingEligibility}`)
      console.log(`Total amount paid: ₹${summary.totalPaidRupees}`)
      console.log(`Errors: ${summary.errors}`)
      console.log(`Processing time: ${summary.processingTimeMs}ms`)

      return summary
    }, {
      maxWait: 30000, // 30 seconds
      timeout: 120000 // 2 minutes
    })

    return NextResponse.json({
      success: true,
      message: 'Weekly self income payouts processed successfully',
      data: result
    })

  } catch (error) {
    console.error('Error in weekly payout processing:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process weekly payouts',
      details: error.message,
      processingTimeMs: Date.now() - startTime
    }, { status: 500 })
    
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Function to check and release pending eligibility payouts
 * Called when a user's eligibility status might have changed
 */
export async function processPendingEligibilityPayouts(userId) {
  try {
    console.log(`Checking pending eligibility payouts for user ${userId}`)
    
    const result = await prisma.$transaction(async (tx) => {
      // Check if user is now eligible
      const isEligible = await checkSelfIncomeEligibility(tx, userId)
      
      if (!isEligible) {
        console.log(`User ${userId} is still not eligible`)
        return { processed: 0, message: 'User still not eligible' }
      }
      
      // Find all pending eligibility payouts for this user
      const pendingPayouts = await tx.selfPayoutSchedule.findMany({
        where: {
          userId: userId,
          status: 'pending_eligibility',
          dueAt: {
            lte: new Date()
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
        },
        orderBy: {
          dueAt: 'asc'
        }
      })
      
      console.log(`Found ${pendingPayouts.length} pending payouts for user ${userId}`)
      
      let processedCount = 0
      let totalAmount = 0
      
      for (const payout of pendingPayouts) {
        // Credit wallet
        await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: {
              increment: payout.amount
            }
          }
        })
        
        // Create ledger entry
        await tx.ledger.create({
          data: {
            userId: userId,
            type: 'self_income_payout',
            amount: payout.amount,
            description: `Delayed self income payout - ${payout.description}`,
            ref: payout.ref
          }
        })
        
        // Mark as paid
        await tx.selfPayoutSchedule.update({
          where: { id: payout.id },
          data: {
            status: 'paid',
            description: `${payout.description} - Paid after eligibility achieved`
          }
        })
        
        processedCount++
        totalAmount += payout.amount
        
        console.log(`✅ Released pending payout ${payout.id} for ₹${payout.amount / 100}`)
      }
      
      return {
        processed: processedCount,
        totalAmount,
        totalRupees: totalAmount / 100,
        message: `Released ${processedCount} pending payouts totaling ₹${totalAmount / 100}`
      }
    })
    
    console.log(`Pending payout processing result for user ${userId}:`, result)
    return result
    
  } catch (error) {
    console.error(`Error processing pending payouts for user ${userId}:`, error)
    throw error
  }
}
