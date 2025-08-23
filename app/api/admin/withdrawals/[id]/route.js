import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'

const prisma = new PrismaClient()

/**
 * Admin Withdrawal Approval/Rejection API
 * 
 * POST /api/admin/withdrawals/[id]/approve - Approve withdrawal
 * POST /api/admin/withdrawals/[id]/reject - Reject withdrawal
 */

export async function POST(request, { params }) {
  try {
    // Get user session
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const withdrawalId = parseInt(params.id)
    const { action, adminNotes, transactionId } = await request.json()

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Find withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletBalance: true
          }
        }
      }
    })

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Withdrawal request is already ${withdrawal.status}` 
        },
        { status: 400 }
      )
    }

    // Process approval or rejection
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'approve') {
        // Approve withdrawal
        const updatedWithdrawal = await tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: 'approved',
            processedAt: new Date(),
            processedBy: adminUser.id,
            adminNotes: adminNotes || 'Approved by admin',
            transactionId: transactionId || null
          }
        })

        // Create ledger entry for successful withdrawal
        await tx.ledger.create({
          data: {
            userId: withdrawal.user.id,
            type: 'WITHDRAWAL_APPROVED',
            amount: -withdrawal.amount,
            description: `Withdrawal #${withdrawalId} approved - ${withdrawal.method}`,
            referenceId: withdrawalId.toString(),
            balanceAfter: withdrawal.user.walletBalance
          }
        })

        return updatedWithdrawal

      } else {
        // Reject withdrawal - refund to wallet
        const updatedWithdrawal = await tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: 'rejected',
            processedAt: new Date(),
            processedBy: adminUser.id,
            adminNotes: adminNotes || 'Rejected by admin'
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
            description: `Withdrawal #${withdrawalId} rejected - amount refunded`,
            referenceId: withdrawalId.toString(),
            balanceAfter: withdrawal.user.walletBalance + withdrawal.amount
          }
        })

        return updatedWithdrawal
      }
    })

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${action}d successfully`,
      data: {
        withdrawalId: result.id,
        status: result.status,
        amount: result.amount,
        processedAt: result.processedAt,
        adminNotes: result.adminNotes
      }
    })

  } catch (error) {
    console.error('Withdrawal process error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to ${action || 'process'} withdrawal request`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get specific withdrawal details
 * 
 * GET /api/admin/withdrawals/[id]
 */

export async function GET(request, { params }) {
  try {
    // Get user session
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const withdrawalId = parseInt(params.id)

    // Get withdrawal details
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            walletBalance: true,
            referralCode: true
          }
        },
        processedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: withdrawal
    })

  } catch (error) {
    console.error('Get withdrawal details error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch withdrawal details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
