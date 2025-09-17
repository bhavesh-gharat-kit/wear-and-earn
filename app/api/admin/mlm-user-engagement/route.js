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
      await limiter.check(20, `admin_engagement_${session.user.id}`)
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

    // Get user registration and purchase data
    const [
      totalRegistered,
      totalWithPurchases,
      newRegistrations,
      newPurchasers,
      activeReferrers,
      totalReferrals,
      successfulReferrals
    ] = await Promise.all([
      // Total registered users
      prisma.user.count({
        where: { role: 'user' }
      }),

      // Users who have made at least one purchase
      prisma.user.count({
        where: {
          role: 'user',
          orders: {
            some: {
              status: 'paid'
            }
          }
        }
      }),

      // New registrations in period
      prisma.user.count({
        where: {
          role: 'user',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // New purchasers in period
      prisma.user.count({
        where: {
          role: 'user',
          orders: {
            some: {
              status: 'paid',
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }),

      // Users who have active referrals
      prisma.user.count({
        where: {
          role: 'user',
          referralCode: {
            not: null
          },
          referredUsers: {
            some: {}
          }
        }
      }),

      // Total referrals made
      prisma.user.count({
        where: {
          role: 'user',
          referredBy: {
            not: null
          }
        }
      }),

      // Successful referrals (referred users who made purchases)
      prisma.user.count({
        where: {
          role: 'user',
          referredBy: {
            not: null
          },
          orders: {
            some: {
              status: 'paid'
            }
          }
        }
      })
    ])

    // Calculate conversion rates
    const conversionRate = totalRegistered > 0 ? (totalWithPurchases / totalRegistered * 100) : 0
    const referrerRate = totalRegistered > 0 ? (activeReferrers / totalRegistered * 100) : 0
    const referralSuccessRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals * 100) : 0

    // Get detailed referrer statistics
    const topReferrers = await prisma.user.findMany({
      where: {
        role: 'user',
        referralCode: {
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        referralCode: true,
        referredUsers: {
          select: {
            id: true,
            fullName: true,
            createdAt: true,
            orders: {
              where: {
                status: 'paid'
              },
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        referredUsers: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Process top referrers data
    const referrerStats = topReferrers.map(user => {
      const totalReferred = user.referredUsers.length
      const purchasedReferred = user.referredUsers.filter(ref => ref.orders.length > 0).length
      const conversionRate = totalReferred > 0 ? (purchasedReferred / totalReferred * 100) : 0

      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        referralCode: user.referralCode,
        totalReferred,
        purchasedReferred,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      }
    })

    // Get user activity trends
    const dailyRegistrations = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations
      FROM User 
      WHERE role = 'user'
        AND created_at >= ${startDate} 
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const dailyPurchases = await prisma.$queryRaw`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.user_id) as unique_purchasers,
        COUNT(*) as total_purchases
      FROM Order o
      WHERE o.status = 'paid'
        AND o.created_at >= ${startDate}
        AND o.created_at <= ${endDate}
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `

    // Get level distribution engagement
    const levelEngagement = await prisma.user.groupBy({
      by: ['level'],
      where: {
        role: 'user',
        level: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _avg: {
        totalTeams: true
      }
    })

    // Get recent user activities
    const recentActivities = await prisma.order.findMany({
      where: {
        status: 'paid',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            referredBy: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // Analyze first purchase timing
    const firstPurchaseAnalysis = await prisma.$queryRaw`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (first_order.created_at - u.created_at)) / 86400) as avg_days_to_first_purchase,
        COUNT(*) as users_with_purchases
      FROM User u
      JOIN (
        SELECT DISTINCT ON (user_id) user_id, created_at
        FROM Order
        WHERE status = 'paid'
        ORDER BY user_id, created_at ASC
      ) first_order ON u.id = first_order.user_id
      WHERE u.role = 'user'
        AND u.created_at >= ${startDate}
        AND u.created_at <= ${endDate}
    `

    const avgDaysToFirstPurchase = firstPurchaseAnalysis[0]?.avg_days_to_first_purchase || 0

    // Get retention metrics
    const retentionAnalysis = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT CASE WHEN order_count = 1 THEN user_id END) as one_time_buyers,
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as repeat_buyers,
        AVG(order_count) as avg_orders_per_user
      FROM (
        SELECT 
          user_id,
          COUNT(*) as order_count
        FROM Order
        WHERE status = 'paid'
        GROUP BY user_id
      ) user_orders
    `

    const retentionData = retentionAnalysis[0] || {}
    const totalBuyers = (retentionData.one_time_buyers || 0) + (retentionData.repeat_buyers || 0)
    const retentionRate = totalBuyers > 0 ? ((retentionData.repeat_buyers || 0) / totalBuyers * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRegistered,
          purchasedUsers: totalWithPurchases,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          newRegistrations,
          newPurchasers,
          periodConversionRate: newRegistrations > 0 ? parseFloat((newPurchasers / newRegistrations * 100).toFixed(2)) : 0
        },
        referrals: {
          activeReferrers,
          referrerRate: parseFloat(referrerRate.toFixed(2)),
          totalReferrals,
          successfulReferrals,
          referralSuccessRate: parseFloat(referralSuccessRate.toFixed(2)),
          topReferrers: referrerStats
        },
        engagement: {
          avgDaysToFirstPurchase: parseFloat(avgDaysToFirstPurchase.toFixed(1)),
          retentionRate: parseFloat(retentionRate.toFixed(2)),
          avgOrdersPerUser: parseFloat((retentionData.avg_orders_per_user || 0).toFixed(1)),
          oneTimeBuyers: retentionData.one_time_buyers || 0,
          repeatBuyers: retentionData.repeat_buyers || 0
        },
        levels: {
          distribution: levelEngagement.map(level => ({
            level: level.level,
            userCount: level._count.id,
            avgTeams: parseFloat((level._avg.totalTeams || 0).toFixed(1))
          }))
        },
        trends: {
          dailyRegistrations: dailyRegistrations.map(day => ({
            date: day.date,
            registrations: Number(day.registrations)
          })),
          dailyPurchases: dailyPurchases.map(day => ({
            date: day.date,
            uniquePurchasers: Number(day.unique_purchasers),
            totalPurchases: Number(day.total_purchases)
          }))
        },
        recentActivities: recentActivities.map(order => ({
          id: order.id,
          user: order.user.fullName,
          email: order.user.email,
          isReferred: !!order.user.referredBy,
          amount: order.totalAmount,
          createdAt: order.createdAt
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
    console.error('Error fetching user engagement metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
