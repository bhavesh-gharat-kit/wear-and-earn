import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import { getServerSession } from 'next-auth/next'

/**
 * Bulk Withdrawal Processing API
 * POST /api/admin/withdrawals/bulk
 * 
 * Handles bulk approval/rejection of multiple withdrawal requests
 * Supports batch processing with transaction safety
 */

export async function POST(request) {
  try {
    // Authentication check
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin authorization check
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, fullName: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { withdrawalIds, action, adminNotes } = await request.json()

    // Validation
    if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid withdrawal IDs array' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (withdrawalIds.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Maximum 50 withdrawals can be processed at once' },
        { status: 400 }
      )
    }

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      const results = {
        processed: [],
        failed: [],
        summary: {
          total: withdrawalIds.length,
          successful: 0,
          failed: 0,
          totalAmount: 0
        }
      }

      for (const withdrawalId of withdrawalIds) {
        try {
          const id = parseInt(withdrawalId)
          
          // Find withdrawal request
          const withdrawal = await tx.withdrawalRequest.findUnique({
            where: { id },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  walletBalance: true,
                  isKycApproved: true
                }
              }
            }
          })

          if (!withdrawal) {
            results.failed.push({
              id,
              reason: 'Withdrawal request not found'
            })
            continue
          }

          if (withdrawal.status !== 'pending') {
            results.failed.push({
              id,
              reason: `Withdrawal already ${withdrawal.status}`
            })
            continue
          }

          // Additional validation for approval
          if (action === 'approve') {
            if (!withdrawal.user.isKycApproved) {
              results.failed.push({
                id,
                reason: 'User KYC not approved'
              })
              continue
            }

            if (withdrawal.amount < 30000) { // ₹300 minimum
              results.failed.push({
                id,
                reason: 'Amount below minimum withdrawal limit'
              })
              continue
            }
          }

          // Process the withdrawal
          if (action === 'approve') {
            // Approve withdrawal
            const updatedWithdrawal = await tx.withdrawalRequest.update({
              where: { id },
              data: {
                status: 'approved',
                processedAt: new Date(),
                processedBy: adminUser.id,
                adminNotes: adminNotes || `Bulk approved by ${adminUser.fullName}`
              }
            })

            // Create ledger entry for successful withdrawal
            await tx.ledger.create({
              data: {
                userId: withdrawal.user.id,
                type: 'WITHDRAWAL_APPROVED',
                amount: -withdrawal.amount,
                description: `Withdrawal #${id} bulk approved`,
                referenceId: id.toString(),
                balanceAfter: withdrawal.user.walletBalance
              }
            })

            results.processed.push({
              id,
              status: 'approved',
              amount: withdrawal.amount,
              user: withdrawal.user.fullName
            })

          } else {
            // Reject withdrawal - refund to wallet
            const updatedWithdrawal = await tx.withdrawalRequest.update({
              where: { id },
              data: {
                status: 'rejected',
                processedAt: new Date(),
                processedBy: adminUser.id,
                adminNotes: adminNotes || `Bulk rejected by ${adminUser.fullName}`
              }
            })

            // Refund amount back to user wallet
            await tx.user.update({
              where: { id: withdrawal.user.id },
              data: {
                walletBalance: {
                  increment: withdrawal.amount
                }
              }
            })

            // Create ledger entry for refund
            await tx.ledger.create({
              data: {
                userId: withdrawal.user.id,
                type: 'WITHDRAWAL_REFUND',
                amount: withdrawal.amount,
                description: `Withdrawal #${id} bulk rejected - amount refunded`,
                referenceId: id.toString(),
                balanceAfter: withdrawal.user.walletBalance + withdrawal.amount
              }
            })

            results.processed.push({
              id,
              status: 'rejected',
              amount: withdrawal.amount,
              user: withdrawal.user.fullName
            })
          }

          results.summary.successful++
          results.summary.totalAmount += withdrawal.amount

        } catch (error) {
          console.error(`Error processing withdrawal ${withdrawalId}:`, error)
          results.failed.push({
            id: withdrawalId,
            reason: error.message || 'Processing error'
          })
        }
      }

      results.summary.failed = results.failed.length

      return results
    })

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed. ${result.summary.successful} successful, ${result.summary.failed} failed.`,
      data: result
    })

  } catch (error) {
    console.error('Bulk withdrawal processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process bulk withdrawal action',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
