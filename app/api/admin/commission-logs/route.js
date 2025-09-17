import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for admin endpoints
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting
    try {
      await limiter.check(30, `admin_commission_logs_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Filters
    const userId = searchParams.get('userId')
    const level = searchParams.get('level')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search') // Search by user name or email

    // Build where clause
    let whereClause = {}

    if (userId) {
      whereClause.userId = parseInt(userId)
    }

    if (level) {
      whereClause.level = parseInt(level)
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    if (minAmount || maxAmount) {
      whereClause.amount = {}
      if (minAmount) {
        whereClause.amount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        whereClause.amount.lte = parseFloat(maxAmount)
      }
    }

    // Handle search by user name or email
    if (search) {
      whereClause.OR = [
        {
          user: {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          fromUser: {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          fromUser: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Get total count
    const totalCount = await prisma.commission.count({
      where: whereClause
    })

    // Get commission logs with detailed information
    const commissions = await prisma.commission.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            matrixLevel: true,
            matrixPosition: true,
            walletBalance: true
          }
        },
        fromUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            matrixLevel: true,
            matrixPosition: true
          }
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    // Get summary statistics for current filters
    const summaryStats = await prisma.commission.aggregate({
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      _avg: {
        amount: true
      }
    })

    // Get level-wise breakdown for current filters
    const levelBreakdown = await prisma.commission.groupBy({
      by: ['level'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        level: 'asc'
      }
    })

    // Get top earners for current filters
    const topEarners = await prisma.commission.groupBy({
      by: ['userId'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    })

    // Get user details for top earners
    const topEarnersWithDetails = await Promise.all(
      topEarners.map(async (earner) => {
        const user = await prisma.user.findUnique({
          where: { id: earner.userId },
          select: {
            id: true,
            fullName: true,
            email: true,
            matrixLevel: true
          }
        })
        return {
          user,
          totalAmount: earner._sum.amount,
          commissionCount: earner._count.id
        }
      })
    )

    // Format commission logs for response
    const formattedCommissions = commissions.map(commission => ({
      id: commission.id,
      amount: commission.amount,
      level: commission.level,
      type: commission.type,
      description: commission.description,
      createdAt: commission.createdAt,
      user: {
        id: commission.user.id,
        name: commission.user.fullName,
        email: commission.user.email,
        phone: commission.user.phone,
        matrixLevel: commission.user.matrixLevel,
        matrixPosition: commission.user.matrixPosition,
        walletBalance: commission.user.walletBalance
      },
      fromUser: commission.fromUser ? {
        id: commission.fromUser.id,
        name: commission.fromUser.fullName,
        email: commission.fromUser.email,
        phone: commission.fromUser.phone,
        matrixLevel: commission.fromUser.matrixLevel,
        matrixPosition: commission.fromUser.matrixPosition
      } : null,
      order: commission.order ? {
        id: commission.order.id,
        totalAmount: commission.order.totalAmount,
        status: commission.order.status,
        createdAt: commission.order.createdAt,
        productName: commission.order.product?.name,
        productPrice: commission.order.product?.price
      } : null,
      metadata: commission.metadata
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        commissions: formattedCommissions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        summary: {
          totalAmount: summaryStats._sum.amount || 0,
          totalCommissions: summaryStats._count.id || 0,
          averageAmount: summaryStats._avg.amount || 0
        },
        levelBreakdown: levelBreakdown.map(level => ({
          level: level.level,
          totalAmount: level._sum.amount || 0,
          count: level._count.id || 0
        })),
        topEarners: topEarnersWithDetails,
        filters: {
          userId,
          level,
          startDate,
          endDate,
          minAmount,
          maxAmount,
          search
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60' // Cache for 1 minute
      }
    })

  } catch (error) {
    console.error('Error fetching commission logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
