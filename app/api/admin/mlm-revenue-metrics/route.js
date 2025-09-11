import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
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
      await limiter.check(20, `admin_revenue_${session.user.id}`)
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

    // Get all orders in the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'paid'
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    // Calculate revenue metrics
    let totalSales = 0
    let productRevenue = 0
    let mlmRevenue = 0
    let companyShare = 0
    let poolShare = 0

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productPrice = item.product.productPrice || 0
        const mlmPrice = item.product.mlmPrice || 0
        const quantity = item.quantity || 1

        // Calculate totals
        const itemProductRevenue = productPrice * quantity
        const itemMlmRevenue = mlmPrice * quantity

        productRevenue += itemProductRevenue
        mlmRevenue += itemMlmRevenue
        totalSales += itemProductRevenue + itemMlmRevenue

        // MLM revenue split (30% company, 70% pool)
        companyShare += Math.floor(itemMlmRevenue * 0.30)
        poolShare += Math.floor(itemMlmRevenue * 0.70)
      })
    })

    // Get product performance data
    const productPerformance = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'paid'
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    })

    // Get top selling products
    const topProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productPerformance.map(p => p.productId)
        }
      },
      select: {
        id: true,
        title: true,
        productPrice: true,
        mlmPrice: true,
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: startDate,
                lte: endDate
              },
              status: 'paid'
            }
          },
          select: {
            quantity: true
          }
        }
      }
    })

    // Calculate product metrics
    const productMetrics = topProducts.map(product => {
      const totalQuantity = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const productRev = (product.productPrice || 0) * totalQuantity
      const mlmRev = (product.mlmPrice || 0) * totalQuantity
      
      return {
        id: product.id,
        name: product.title,
        unitsSold: totalQuantity,
        productRevenue: productRev,
        mlmRevenue: mlmRev,
        totalRevenue: productRev + mlmRev
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Get daily revenue trends
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as order_count,
        SUM(COALESCE(p.product_price, 0) * COALESCE(oi.quantity, 1)) as product_revenue,
        SUM(COALESCE(p.mlm_price, 0) * COALESCE(oi.quantity, 1)) as mlm_revenue
      FROM Order o
      JOIN OrderItem oi ON o.id = oi.order_id
      JOIN Product p ON oi.product_id = p.id
      WHERE o.created_at >= ${startDate}
        AND o.created_at <= ${endDate}
        AND o.status = 'paid'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000))
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        },
        status: 'paid'
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    let previousTotalSales = 0
    let previousMlmRevenue = 0

    previousOrders.forEach(order => {
      order.orderItems.forEach(item => {
        const productPrice = item.product.productPrice || 0
        const mlmPrice = item.product.mlmPrice || 0
        const quantity = item.quantity || 1

        previousTotalSales += (productPrice + mlmPrice) * quantity
        previousMlmRevenue += mlmPrice * quantity
      })
    })

    const salesGrowthRate = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales * 100)
      : 0

    const mlmGrowthRate = previousMlmRevenue > 0
      ? ((mlmRevenue - previousMlmRevenue) / previousMlmRevenue * 100)
      : 0

    // Revenue distribution by time of day
    const hourlyDistribution = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM o.created_at) as hour,
        COUNT(*) as order_count,
        SUM(COALESCE(p.product_price, 0) * COALESCE(oi.quantity, 1) + COALESCE(p.mlm_price, 0) * COALESCE(oi.quantity, 1)) as total_revenue
      FROM Order o
      JOIN OrderItem oi ON o.id = oi.order_id
      JOIN Product p ON oi.product_id = p.id
      WHERE o.created_at >= ${startDate}
        AND o.created_at <= ${endDate}
        AND o.status = 'paid'
      GROUP BY EXTRACT(HOUR FROM o.created_at)
      ORDER BY hour ASC
    `

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSales,
          productRevenue,
          mlmRevenue,
          companyShare,
          poolShare,
          salesGrowthRate: parseFloat(salesGrowthRate.toFixed(2)),
          mlmGrowthRate: parseFloat(mlmGrowthRate.toFixed(2))
        },
        breakdown: {
          productRevenuePercentage: totalSales > 0 ? (productRevenue / totalSales * 100).toFixed(1) : 0,
          mlmRevenuePercentage: totalSales > 0 ? (mlmRevenue / totalSales * 100).toFixed(1) : 0,
          companySharePercentage: mlmRevenue > 0 ? (companyShare / mlmRevenue * 100).toFixed(1) : 0,
          poolSharePercentage: mlmRevenue > 0 ? (poolShare / mlmRevenue * 100).toFixed(1) : 0
        },
        productPerformance: productMetrics.slice(0, 10),
        trends: {
          daily: dailyRevenue.map(day => ({
            date: day.date,
            orderCount: Number(day.order_count),
            productRevenue: Number(day.product_revenue || 0),
            mlmRevenue: Number(day.mlm_revenue || 0),
            totalRevenue: Number(day.product_revenue || 0) + Number(day.mlm_revenue || 0)
          })),
          hourly: hourlyDistribution.map(hour => ({
            hour: Number(hour.hour),
            orderCount: Number(hour.order_count),
            totalRevenue: Number(hour.total_revenue || 0)
          }))
        },
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
    console.error('Error fetching revenue metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
