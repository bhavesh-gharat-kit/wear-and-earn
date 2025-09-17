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

    // Rate limiting for admin overview
    try {
      await limiter.check(20, `admin_overview_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const days = parseInt(period)

    // Get date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Get overall statistics
    const [
      totalUsers,
      activeUsers,
      totalCommissions,
      pendingWithdrawals,
      totalWithdrawals,
      newUsersInPeriod,
      commissionsInPeriod,
      withdrawalsInPeriod
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { role: 'user' }
      }),
      
      // Active users (logged in last 30 days)
      prisma.user.count({
        where: {
          role: 'user',
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total commissions ever paid
      prisma.commission.aggregate({
        _sum: { amount: true },
        _count: true
      }),
      
      // Pending withdrawals
      prisma.withdrawal.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: true
      }),
      
      // Total withdrawals processed
      prisma.withdrawal.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true },
        _count: true
      }),
      
      // New users in period
      prisma.user.count({
        where: {
          role: 'user',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Commissions in period
      prisma.commission.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Withdrawals in period
      prisma.withdrawal.aggregate({
        where: {
          status: 'approved',
          approvedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true },
        _count: true
      })
    ])

    // Get top performers in the period
    const topEarners = await prisma.user.findMany({
      where: {
        role: 'user',
        commissions: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        commissions: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            amount: true
          }
        }
      },
      take: 10
    })

    // Calculate earnings for top performers
    const topPerformers = topEarners.map(user => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      totalEarnings: user.commissions.reduce((sum, commission) => sum + commission.amount, 0)
    })).sort((a, b) => b.totalEarnings - a.totalEarnings)

    // Get commission breakdown by level
    const commissionByLevel = await prisma.commission.groupBy({
      by: ['level'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    // Get daily statistics for the period
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COALESCE(SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END), 0) as users_count
      FROM User 
      WHERE created_at >= ${startDate} 
        AND created_at <= ${endDate}
        AND role = 'user'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Get daily commission stats
    const dailyCommissions = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as commission_count,
        SUM(amount) as total_amount
      FROM Commission 
      WHERE created_at >= ${startDate} 
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Matrix statistics
    const matrixStats = await prisma.user.groupBy({
      by: ['matrixLevel'],
      where: {
        role: 'user',
        matrixLevel: {
          not: null
        }
      },
      _count: true
    })

    // KYC statistics
    const kycStats = await prisma.user.aggregate({
      where: { role: 'user' },
      _count: {
        isKycApproved: true
      }
    })

    const kycApproved = await prisma.user.count({
      where: {
        role: 'user',
        isKycApproved: true
      }
    })

    const kycPending = await prisma.user.count({
      where: {
        role: 'user',
        isKycApproved: false
      }
    })

    // Recent activities
    const recentActivities = await prisma.commission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        fromUser: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersInPeriod,
          userGrowthRate: totalUsers > 0 ? ((newUsersInPeriod / totalUsers) * 100).toFixed(2) : 0
        },
        commissions: {
          totalAmount: totalCommissions._sum.amount || 0,
          totalCount: totalCommissions._count || 0,
          periodAmount: commissionsInPeriod._sum.amount || 0,
          periodCount: commissionsInPeriod._count || 0,
          byLevel: commissionByLevel.map(level => ({
            level: level.level,
            amount: level._sum.amount || 0,
            count: level._count
          }))
        },
        withdrawals: {
          pending: {
            amount: pendingWithdrawals._sum.amount || 0,
            count: pendingWithdrawals._count || 0
          },
          processed: {
            amount: totalWithdrawals._sum.amount || 0,
            count: totalWithdrawals._count || 0
          },
          periodProcessed: {
            amount: withdrawalsInPeriod._sum.amount || 0,
            count: withdrawalsInPeriod._count || 0
          }
        },
        kyc: {
          approved: kycApproved,
          pending: kycPending,
          approvalRate: totalUsers > 0 ? ((kycApproved / totalUsers) * 100).toFixed(2) : 0
        },
        matrix: {
          distribution: matrixStats.map(stat => ({
            level: stat.matrixLevel,
            count: stat._count
          }))
        },
        topPerformers: topPerformers.slice(0, 5),
        dailyStats: {
          users: dailyStats,
          commissions: dailyCommissions
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          type: 'commission',
          amount: activity.amount,
          level: activity.level,
          user: activity.user.fullName,
          fromUser: activity.fromUser?.fullName || 'System',
          createdAt: activity.createdAt
        })),
        period: {
          days,
          startDate,
          endDate
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Error fetching MLM overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
