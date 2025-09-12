import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma, { withConnection } from "@/lib/prisma";
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils'


export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Get user MLM data with connection handling
    const user = await withConnection(async (db) => {
      return await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          isActive: true,
          referralCode: true,
          sponsorId: true,
          kycStatus: true,
          walletBalance: true,
          monthlyPurchase: true,
          lastMonthPurchase: true,
          isEligibleRepurchase: true,
          teamCount: true,
          directTeams: true,
          createdAt: true,
          sponsor: {
            select: {
              id: true,
              fullName: true,
              referralCode: true
            }
          }
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get total team count from user record (already calculated)
    const teamCount = user.teamCount || 0

    // Get direct referrals count with error handling
    let directReferrals = 0;
    try {
      directReferrals = await withConnection(async (db) => {
        return await db.user.count({
          where: { sponsorId: userId }
        });
      });
    } catch (error) {
      console.error('Error counting direct referrals:', error);
      // Use fallback from user record if available
      directReferrals = user.directTeams || 0;
    }

    // Get wallet transactions for recent activity with error handling
    let recentTransactions = [];
    try {
      recentTransactions = await withConnection(async (db) => {
        return await db.ledger.findMany({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            note: true,
            createdAt: true,
            levelDepth: true
          }
        });
      });
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      recentTransactions = [];
    }

    // Get pending self payouts with error handling
    let pendingPayouts = [];
    try {
      pendingPayouts = await withConnection(async (db) => {
        return await db.selfPayoutSchedule.findMany({
          where: { 
            userId: userId,
            status: 'scheduled',
            dueAt: { lte: new Date() }
          },
          orderBy: { dueAt: 'asc' },
          take: 5
        });
      });
    } catch (error) {
      console.error('Error fetching pending payouts:', error);
      pendingPayouts = [];
    }

    // Calculate total commission earned with error handling
    let commissionStats = { _sum: { amount: 0 } };
    try {
      commissionStats = await withConnection(async (db) => {
        return await db.ledger.aggregate({
          where: {
            userId: userId,
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
      console.error('Error calculating commission stats:', error);
      commissionStats = { _sum: { amount: 0 } };
    }

    // Get current month's commission with error handling
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    let monthlyCommission = { _sum: { amount: 0 } };
    try {
      monthlyCommission = await withConnection(async (db) => {
        return await db.ledger.aggregate({
          where: {
            userId: userId,
            type: {
              in: ['sponsor_commission', 'repurchase_commission', 'self_joining_instalment']
            },
            createdAt: { gte: currentMonth }
          },
          _sum: {
            amount: true
          }
        });
      });
    } catch (error) {
      console.error('Error calculating monthly commission:', error);
      monthlyCommission = { _sum: { amount: 0 } };
    }

    // Format response data
  const origin = req?.nextUrl?.origin || process.env.NEXTAUTH_URL;
  const mlmData = {
      user: {
        id: user.id,
        fullName: user.fullName,
        isActive: user.isActive,
        referralCode: user.referralCode,
  referralLink: (user.referralCode && origin) ? `${origin}/login-register?spid=${user.id}` : null,
        kycStatus: user.kycStatus,
        walletBalance: {
          paisa: user.walletBalance,
          rupees: paisaToRupees(user.walletBalance)
        },
        monthlyPurchase: {
          paisa: user.monthlyPurchase,
          rupees: paisaToRupees(user.monthlyPurchase)
        },
        lastMonthPurchase: {
          paisa: user.lastMonthPurchase,
          rupees: paisaToRupees(user.lastMonthPurchase)
        },
        isEligibleRepurchase: user.isEligibleRepurchase,
        createdAt: user.createdAt,
        sponsor: user.sponsor ? {
          id: user.sponsor.id,
          fullName: user.sponsor.fullName,
          referralCode: user.sponsor.referralCode
        } : null
      },
      team: {
        totalMembers: teamCount,
        directReferrals: directReferrals
      },
      wallet: {
        balance: {
          paisa: user.walletBalance,
          rupees: paisaToRupees(user.walletBalance)
        },
        totalEarned: {
          paisa: commissionStats._sum.amount || 0,
          rupees: paisaToRupees(commissionStats._sum.amount || 0)
        },
        monthlyEarnings: {
          paisa: monthlyCommission._sum.amount || 0,
          rupees: paisaToRupees(monthlyCommission._sum.amount || 0)
        },
        pendingPayouts: pendingPayouts.map(payout => ({
          id: payout.id,
          amount: {
            paisa: payout.amount,
            rupees: paisaToRupees(payout.amount)
          },
          dueAt: payout.dueAt,
          status: payout.status
        })),
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: {
            paisa: tx.amount,
            rupees: paisaToRupees(tx.amount)
          },
          note: tx.note,
          levelDepth: tx.levelDepth,
          createdAt: tx.createdAt
        }))
      },
      kycStatus: true,
    }

    return NextResponse.json(serializeBigInt(mlmData))

  } catch (error) {
    console.error('Error fetching MLM profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MLM profile' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
