import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils'


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const type = searchParams.get('type') // filter by transaction type
    const userId = searchParams.get('userId') // filter by user
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    let whereClause = {}
    
    if (type) {
      whereClause.type = type
    }
    
    if (userId) {
      whereClause.userId = parseInt(userId)
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

    // Get commission transactions
    const transactions = await prisma.ledger.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobileNo: true,
            referralCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalTransactions = await prisma.ledger.count({
      where: whereClause
    })

    // Get summary stats for the filtered transactions
    const summaryStats = await prisma.ledger.groupBy({
      by: ['type'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get total amount
    const totalAmount = await prisma.ledger.aggregate({
      where: whereClause,
      _sum: {
        amount: true
      }
    })

    const commissionData = {
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: {
          paisa: tx.amount,
          rupees: paisaToRupees(tx.amount)
        },
        levelDepth: tx.levelDepth,
        note: tx.note,
        reference: tx.ref,
        createdAt: tx.createdAt,
        user: tx.user ? {
          id: tx.user.id,
          fullName: tx.user.fullName,
          mobileNo: tx.user.mobileNo,
          referralCode: tx.user.referralCode
        } : null,
        isCredit: tx.amount > 0
      })),
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit)
      },
      summary: {
        totalAmount: {
          paisa: totalAmount._sum.amount || 0,
          rupees: paisaToRupees(totalAmount._sum.amount || 0)
        },
        byType: summaryStats.map(stat => ({
          type: stat.type,
          count: stat._count.id,
          amount: {
            paisa: stat._sum.amount || 0,
            rupees: paisaToRupees(stat._sum.amount || 0)
          }
        }))
      },
      filters: {
        type,
        userId,
        startDate,
        endDate
      }
    }

    return NextResponse.json(serializeBigInt(commissionData))

  } catch (error) {
    console.error('Error fetching commission data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
