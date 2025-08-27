import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 15 requests per minute per user
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
})

export async function GET(request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    try {
      await limiter.check(15, ip) // 15 requests per minute
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
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100) // Max 100
    const type = searchParams.get('type') // sponsor_commission, repurchase_commission
    const level = searchParams.get('level') // filter by level (1-5)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    let whereClause = {
      userId: userId,
      type: {
        in: ['sponsor_commission', 'repurchase_commission']
      }
    }

    if (type) {
      whereClause.type = type
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

    // Get commission history
    const commissions = await prisma.ledger.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
        ref: true,
        metadata: true
      }
    })

    // Get total commission count
    const totalCommissions = await prisma.ledger.count({
      where: whereClause
    })

    // Get commission summary
    const totalEarnings = await prisma.ledger.aggregate({
      where: whereClause,
      _sum: {
        amount: true
      }
    })

    // Get monthly breakdown
    const monthlyBreakdown = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM Ledger 
      WHERE userId = ${userId}
        AND type IN ('sponsor_commission', 'repurchase_commission')
        AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), type
      ORDER BY month DESC
    `

    // Get level-wise breakdown (from metadata)
    const levelBreakdown = await prisma.$queryRaw`
      SELECT 
        JSON_EXTRACT(metadata, '$.level') as level,
        SUM(amount) as total,
        COUNT(*) as count
      FROM Ledger 
      WHERE userId = ${userId}
        AND type IN ('sponsor_commission', 'repurchase_commission')
        AND JSON_EXTRACT(metadata, '$.level') IS NOT NULL
      GROUP BY JSON_EXTRACT(metadata, '$.level')
      ORDER BY level
    `

    // Get recent high earners from user's network
    const networkEarnings = await prisma.$queryRaw`
      SELECT 
        h.childId,
        u.fullName,
        u.referralCode,
        SUM(l.amount) as totalEarned,
        COUNT(l.id) as transactionCount
      FROM Hierarchy h
      JOIN User u ON h.childId = u.id
      JOIN Ledger l ON h.childId = l.userId
      WHERE h.parentId = ${userId}
        AND l.type IN ('sponsor_commission', 'repurchase_commission')
        AND l.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY h.childId, u.fullName, u.referralCode
      ORDER BY totalEarned DESC
      LIMIT 10
    `

    // Process commission data
    const processedCommissions = commissions.map(commission => {
      const metadata = commission.metadata || {}
      
      return {
        id: commission.id,
        type: commission.type,
        amount: commission.amount,
        description: commission.description,
        date: commission.createdAt,
        reference: commission.ref,
        level: metadata.level || null,
        sourceOrderId: metadata.orderId || null,
        sourceUserId: metadata.sourceUserId || null,
        sourceUserName: metadata.sourceUserName || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        commissions: processedCommissions,
        summary: {
          totalEarnings: totalEarnings._sum.amount || 0,
          totalTransactions: totalCommissions,
          averagePerTransaction: totalCommissions > 0 
            ? (totalEarnings._sum.amount || 0) / totalCommissions 
            : 0
        },
        analytics: {
          monthlyBreakdown: monthlyBreakdown.map(row => ({
            month: row.month,
            type: row.type,
            total: Number(row.total),
            count: Number(row.count)
          })),
          levelBreakdown: levelBreakdown.map(row => ({
            level: Number(row.level),
            total: Number(row.total),
            count: Number(row.count)
          })),
          topEarners: networkEarnings.map(row => ({
            userId: row.childId,
            name: row.fullName,
            referralCode: row.referralCode,
            totalEarned: Number(row.totalEarned),
            transactionCount: Number(row.transactionCount)
          }))
        },
        pagination: {
          page,
          limit,
          total: totalCommissions,
          totalPages: Math.ceil(totalCommissions / limit)
        },
        filters: {
          type,
          level,
          startDate,
          endDate
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60' // Cache for 1 minute
      }
    })

  } catch (error) {
    console.error('Error fetching commission history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
