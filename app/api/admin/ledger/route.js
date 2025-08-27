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
      await limiter.check(30, `admin_ledger_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
    const offset = (page - 1) * limit

    // Filters
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search')
    const transactionType = searchParams.get('transactionType') // 'credit', 'debit', 'all'

    // Build where clause
    let whereClause = {}

    if (userId) {
      whereClause.userId = parseInt(userId)
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

    // Amount filter
    if (minAmount || maxAmount || transactionType) {
      const amountFilter = {}
      
      if (transactionType === 'credit') {
        amountFilter.gt = 0
      } else if (transactionType === 'debit') {
        amountFilter.lt = 0
      }

      if (minAmount) {
        if (transactionType === 'debit') {
          amountFilter.gte = -Math.abs(parseFloat(minAmount))
        } else {
          amountFilter.gte = parseFloat(minAmount)
        }
      }

      if (maxAmount) {
        if (transactionType === 'debit') {
          amountFilter.lte = -Math.abs(parseFloat(maxAmount))
        } else {
          amountFilter.lte = parseFloat(maxAmount)
        }
      }

      if (Object.keys(amountFilter).length > 0) {
        whereClause.amount = amountFilter
      }
    }

    // Search in description or reference
    if (search) {
      whereClause.OR = [
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          ref: {
            contains: search,
            mode: 'insensitive'
          }
        },
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
        }
      ]
    }

    // Get total count
    const totalCount = await prisma.ledger.count({
      where: whereClause
    })

    // Get ledger entries
    const ledgerEntries = await prisma.ledger.findMany({
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
            walletBalance: true,
            matrixLevel: true,
            matrixPosition: true
          }
        }
      }
    })

    // Get summary statistics
    const summaryStats = await prisma.ledger.aggregate({
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get credit/debit breakdown
    const creditSum = await prisma.ledger.aggregate({
      where: {
        ...whereClause,
        amount: { gt: 0 }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    const debitSum = await prisma.ledger.aggregate({
      where: {
        ...whereClause,
        amount: { lt: 0 }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get transaction type breakdown
    const typeBreakdown = await prisma.ledger.groupBy({
      by: ['type'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get daily transaction summary for the period
    let dailySummary = []
    if (startDate && endDate) {
      dailySummary = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transaction_count,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as credit_amount,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as debit_amount,
          SUM(amount) as net_amount
        FROM Ledger 
        WHERE created_at >= ${new Date(startDate)} 
          AND created_at <= ${new Date(endDate)}
          ${userId ? `AND user_id = ${parseInt(userId)}` : ''}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    }

    // Format ledger entries
    const formattedEntries = ledgerEntries.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      user: {
        id: entry.user.id,
        name: entry.user.fullName,
        email: entry.user.email,
        phone: entry.user.phone,
        currentBalance: entry.user.walletBalance,
        matrixLevel: entry.user.matrixLevel,
        matrixPosition: entry.user.matrixPosition
      },
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      reference: entry.ref,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      transactionType: entry.amount > 0 ? 'credit' : 'debit',
      absoluteAmount: Math.abs(entry.amount)
    }))

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        entries: formattedEntries,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        summary: {
          totalTransactions: summaryStats._count.id || 0,
          netAmount: summaryStats._sum.amount || 0,
          totalCredits: creditSum._sum.amount || 0,
          totalDebits: Math.abs(debitSum._sum.amount || 0),
          creditCount: creditSum._count.id || 0,
          debitCount: debitSum._count.id || 0
        },
        breakdown: {
          byType: typeBreakdown.map(type => ({
            type: type.type,
            amount: type._sum.amount || 0,
            count: type._count.id || 0,
            transactionType: type._sum.amount > 0 ? 'credit' : 'debit'
          })),
          daily: dailySummary
        },
        filters: {
          userId,
          type,
          startDate,
          endDate,
          minAmount,
          maxAmount,
          search,
          transactionType
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30' // Cache for 30 seconds
      }
    })

  } catch (error) {
    console.error('Error fetching ledger:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for creating manual ledger entries (admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting for manual ledger entries
    try {
      await limiter.check(10, `admin_ledger_post_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { userId, type, amount, description, reference, reason } = await request.json()

    // Validate input
    if (!userId || !type || !amount || !description || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount, description, reason' },
        { status: 400 }
      )
    }

    const userIdInt = parseInt(userId)
    const amountFloat = parseFloat(amount)

    if (isNaN(userIdInt) || isNaN(amountFloat)) {
      return NextResponse.json(
        { error: 'Invalid userId or amount' },
        { status: 400 }
      )
    }

    if (amountFloat === 0) {
      return NextResponse.json(
        { error: 'Amount cannot be zero' },
        { status: 400 }
      )
    }

    // Validate ledger entry type
    const validTypes = [
      'manual_credit', 'manual_debit', 'adjustment', 'refund', 
      'bonus', 'penalty', 'correction', 'admin_action'
    ]
    
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userIdInt },
        select: {
          id: true,
          fullName: true,
          email: true,
          walletBalance: true,
          isActive: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if debit would make balance negative
      if (amountFloat < 0 && (user.walletBalance + amountFloat) < 0) {
        throw new Error(`Insufficient balance. Current: ₹${user.walletBalance}, Requested debit: ₹${Math.abs(amountFloat)}`)
      }

      // Create ledger entry
      const ledgerEntry = await tx.ledger.create({
        data: {
          userId: userIdInt,
          type: type,
          amount: amountFloat,
          description: description,
          ref: reference || `ADMIN_${Date.now()}_${userIdInt}`,
          metadata: {
            adminId: session.user.id,
            adminName: session.user.name,
            reason: reason,
            manualEntry: true,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
          }
        }
      })

      // Update user wallet balance
      const updatedUser = await tx.user.update({
        where: { id: userIdInt },
        data: {
          walletBalance: {
            increment: amountFloat
          }
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          walletBalance: true
        }
      })

      // Create admin action log
      await tx.adminAction.create({
        data: {
          adminId: session.user.id,
          action: 'manual_ledger_entry',
          targetUserId: userIdInt,
          details: {
            type: type,
            amount: amountFloat,
            description: description,
            reference: reference,
            reason: reason,
            previousBalance: user.walletBalance,
            newBalance: updatedUser.walletBalance
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return {
        ledgerEntry,
        user: updatedUser,
        previousBalance: user.walletBalance
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Manual ledger entry created successfully',
      data: {
        entryId: result.ledgerEntry.id,
        user: {
          id: result.user.id,
          name: result.user.fullName,
          email: result.user.email,
          previousBalance: result.previousBalance,
          newBalance: result.user.walletBalance,
          balanceChange: amountFloat
        },
        entry: {
          type: type,
          amount: amountFloat,
          description: description,
          reference: result.ledgerEntry.ref,
          createdAt: result.ledgerEntry.createdAt
        },
        admin: {
          id: session.user.id,
          name: session.user.name
        },
        reason: reason
      }
    })

  } catch (error) {
    console.error('Error creating manual ledger entry:', error)
    
    if (error.message.includes('User not found') || 
        error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
