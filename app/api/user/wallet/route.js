import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils'

// Rate limiting: 20 requests per minute per user
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
})

export async function GET(request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    try {
      await limiter.check(20, ip) // 20 requests per minute
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100) // Max 100

    // Get user wallet info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        monthlyPurchase: true,
        isActive: true,
        isKycApproved: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get wallet transaction history
    const transactions = await prisma.ledger.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
        ref: true
      }
    })

    // Get total transaction count
    const totalTransactions = await prisma.ledger.count({
      where: { userId: userId }
    })

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: userId,
        status: 'pending'
      },
      select: {
        id: true,
        amount: true,
        method: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get total pending withdrawal amount
    const pendingAmount = await prisma.withdrawal.aggregate({
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

    // Get next scheduled payout
    const nextPayout = await prisma.selfPayoutSchedule.findFirst({
      where: {
        userId: userId,
        status: 'active'
      },
      orderBy: {
        nextPayoutDate: 'asc'
      },
      select: {
        nextPayoutDate: true,
        amount: true,
        installmentsPaid: true,
        totalInstallments: true
      }
    })

    // Calculate available balance (wallet balance - pending withdrawals)
    const availableBalance = user.walletBalance - (pendingAmount._sum.amount || 0)

    return NextResponse.json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
        availableBalance: Math.max(0, availableBalance),
        pendingWithdrawals: pendingAmount._sum.amount || 0,
        monthlyPurchase: user.monthlyPurchase || 0,
        isActive: user.isActive,
        isKycApproved: user.isKycApproved,
        nextPayout: nextPayout ? {
          date: nextPayout.nextPayoutDate,
          amount: nextPayout.amount,
          progress: `${nextPayout.installmentsPaid}/${nextPayout.totalInstallments}`
        } : null,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.createdAt,
          reference: t.ref,
          isCredit: t.amount > 0
        })),
        pagination: {
          page,
          limit,
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit)
        },
        pendingRequests: pendingWithdrawals.map(w => ({
          id: w.id,
          amount: w.amount,
          method: w.method,
          requestDate: w.createdAt,
          status: w.status
        }))
      }
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Error fetching wallet data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
