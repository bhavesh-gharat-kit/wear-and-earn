import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma, { withConnection } from '@/lib/prisma';
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils';


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const type = searchParams.get('type') // filter by transaction type

    // Get user wallet info with connection handling
    const user = await withConnection(async (db) => {
      return await db.user.findUnique({
        where: { id: userId },
        select: {
          walletBalance: true,
          monthlyPurchase: true,
          lastMonthPurchase: true,
          isActive: true,
          kycStatus: true
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build where clause for transactions
    let whereClause = { userId: userId }
    if (type) {
      whereClause.type = type
    }

    // Get wallet transactions with error handling
    let transactions = [];
    let totalTransactions = 0;
    
    try {
      transactions = await withConnection(async (db) => {
        return await db.ledger.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            type: true,
            amount: true,
            levelDepth: true,
            note: true,
            ref: true,
            createdAt: true
          }
        });
      });
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      transactions = [];
    }

    try {
      totalTransactions = await withConnection(async (db) => {
        return await db.ledger.count({
          where: whereClause
        });
      });
    } catch (error) {
      console.error('Error counting wallet transactions:', error);
      totalTransactions = 0;
    }

    // Get pending self payouts with error handling
    let pendingPayouts = [];
    try {
      pendingPayouts = await withConnection(async (db) => {
        return await db.selfPayoutSchedule.findMany({
          where: { 
            userId: userId,
            status: 'scheduled'
          },
          orderBy: { dueAt: 'asc' },
          select: {
            id: true,
            amount: true,
            dueAt: true,
            status: true,
            orderId: true
          }
        });
      });
    } catch (error) {
      console.error('Error fetching pending payouts:', error);
      pendingPayouts = [];
    }

    // Calculate earnings summary with error handling
    let earningsSummary = [];
    try {
      earningsSummary = await withConnection(async (db) => {
        return await db.ledger.groupBy({
          by: ['type'],
          where: { userId: userId },
          _sum: {
            amount: true
          }
        });
      });
    } catch (error) {
      console.error('Error calculating earnings summary:', error);
      earningsSummary = [];
    }

    // Get monthly earnings for current month with error handling
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    let monthlyEarnings = { _sum: { amount: 0 } };
    try {
      monthlyEarnings = await withConnection(async (db) => {
        return await db.ledger.aggregate({
          where: {
            userId: userId,
            createdAt: { gte: currentMonth },
            type: {
              in: ['sponsor_commission', 'repurchase_commission', 'self_joining_instalment']
            }
          },
          _sum: {
            amount: true
          }
        });
      });
    } catch (error) {
      console.error('Error calculating monthly earnings:', error);
      monthlyEarnings = { _sum: { amount: 0 } };
    }

    // Format earnings by type
    const earningsByType = {}
    earningsSummary.forEach(earning => {
      earningsByType[earning.type] = {
        paisa: earning._sum.amount || 0,
        rupees: paisaToRupees(earning._sum.amount || 0)
      }
    })

    const walletData = {
      balance: {
        paisa: user.walletBalance,
        rupees: paisaToRupees(user.walletBalance)
      },
      monthlyPurchase: {
        current: {
          paisa: user.monthlyPurchase,
          rupees: paisaToRupees(user.monthlyPurchase)
        },
        lastMonth: {
          paisa: user.lastMonthPurchase,
          rupees: paisaToRupees(user.lastMonthPurchase)
        },
        required: {
          paisa: 50000, // ₹500
          rupees: paisaToRupees(50000)
        },
        isEligible: user.monthlyPurchase >= 50000
      },
      earnings: {
        total: {
          paisa: Object.values(earningsByType).reduce((sum, earning) => sum + earning.paisa, 0),
          rupees: Object.values(earningsByType).reduce((sum, earning) => sum + earning.rupees, 0)
        },
        monthly: {
          paisa: monthlyEarnings._sum.amount || 0,
          rupees: paisaToRupees(monthlyEarnings._sum.amount || 0)
        },
        byType: earningsByType
      },
      pendingPayouts: {
        count: pendingPayouts.length,
        totalAmount: {
          paisa: pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0),
          rupees: paisaToRupees(pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0))
        },
        list: pendingPayouts.map(payout => ({
          id: payout.id,
          amount: {
            paisa: payout.amount,
            rupees: paisaToRupees(payout.amount)
          },
          dueAt: payout.dueAt,
          status: payout.status,
          orderId: payout.orderId
        }))
      },
      transactions: {
        data: transactions.map(tx => ({
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
          isCredit: tx.amount > 0
        })),
        pagination: {
          page,
          limit,
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit)
        }
      },
      status: {
        isActive: user.isActive,
        kycStatus: user.kycStatus,
        canEarnCommissions: user.isActive && user.kycStatus === 'APPROVED' && user.monthlyPurchase >= 30000
      },
    }

    return NextResponse.json(serializeBigInt(walletData))

  } catch (error) {
    console.error('Error fetching wallet data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}
