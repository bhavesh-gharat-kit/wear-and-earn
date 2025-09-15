import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth/next'


/**
 * User Withdrawal Request API
 * 
 * POST /api/wallet/withdraw
 * - Allows authenticated users to request withdrawals from their wallet
 * - Creates withdrawal request with 'pending' status
 * - Validates sufficient balance and minimum amount
 * - Creates ledger entry for tracking
 */

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get request data
    const { amount, method, details } = await request.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid withdrawal amount' },
        { status: 400 }
      )
    }

    const withdrawalAmount = parseFloat(amount)
    const minWithdrawal = 300 // Minimum withdrawal amount - updated to ₹300

    if (withdrawalAmount < minWithdrawal) {
      return NextResponse.json(
        { success: false, message: `Minimum withdrawal amount is ₹${minWithdrawal}` },
        { status: 400 }
      )
    }

    if (!method || !['bank_transfer', 'upi', 'paytm'].includes(method)) {
      return NextResponse.json(
        { success: false, message: 'Invalid withdrawal method' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check wallet balance
    if (user.walletBalance < withdrawalAmount) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient balance. Available: ₹${user.walletBalance}` 
        },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const withdrawal = await prisma.$transaction(async (tx) => {
      // Create withdrawal record
      const newWithdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: withdrawalAmount,
          method,
          details: details || {},
          status: 'pending',
          requestedAt: new Date()
        }
      })

      // Deduct from wallet balance (pending withdrawal)
      await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: {
            decrement: withdrawalAmount
          }
        }
      })

      // Create ledger entry
      await tx.ledger.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL_REQUEST',
          amount: -withdrawalAmount,
          description: `Withdrawal request #${newWithdrawal.id} - ${method}`,
          referenceId: newWithdrawal.id.toString(),
          balanceAfter: user.walletBalance - withdrawalAmount
        }
      })

      return newWithdrawal
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawalId: withdrawal.id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    })

  } catch (error) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process withdrawal request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get User Withdrawal History
 * 
 * GET /api/wallet/withdraw
 * - Returns paginated list of user's withdrawal requests
 * - Shows status, amounts, and timestamps
 */

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 50)
    const offset = (page - 1) * limit

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get withdrawal requests
    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId: user.id },
        orderBy: { requestedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          requestedAt: true,
          processedAt: true,
          adminNotes: true
        }
      }),
      prisma.withdrawalRequest.count({
        where: { userId: user.id }
      })
    ])

    // Calculate summary stats
    const stats = await prisma.withdrawalRequest.aggregate({
      where: { userId: user.id },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })

    const pendingSum = await prisma.withdrawalRequest.aggregate({
      where: { 
        userId: user.id,
        status: 'pending'
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        summary: {
          totalWithdrawn: stats._sum.amount || 0,
          totalRequests: stats._count._all || 0,
          pendingAmount: pendingSum._sum.amount || 0
        }
      }
    })

  } catch (error) {
    console.error('Get withdrawals error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch withdrawal history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
