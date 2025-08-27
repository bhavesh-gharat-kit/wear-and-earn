import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth/next'


/**
 * Admin Withdrawal Management API
 * 
 * GET /api/admin/withdrawals - Get all withdrawal requests
 * POST /api/admin/withdrawals/[id]/approve - Approve withdrawal
 * POST /api/admin/withdrawals/[id]/reject - Reject withdrawal
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
    const status = searchParams.get('status') // pending, approved, rejected
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause = {}
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause.status = status
    }

    // Get withdrawal requests with user details
    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: whereClause,
        orderBy: { requestedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              walletBalance: true
            }
          }
        }
      }),
      prisma.withdrawalRequest.count({
        where: whereClause
      })
    ])

    // Get summary statistics
    const stats = await prisma.withdrawalRequest.groupBy({
      by: ['status'],
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })

    const summaryStats = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 }
    }

    stats.forEach(stat => {
      summaryStats[stat.status] = {
        count: stat._count._all,
        amount: stat._sum.amount || 0
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
        summary: summaryStats
      }
    })

  } catch (error) {
    console.error('Admin withdrawals fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch withdrawal requests',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
