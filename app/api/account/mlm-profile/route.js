import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
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

    // Get user MLM data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        referralCode: true,
        sponsorId: true,
        isKycApproved: true,
        walletBalance: true,
        monthlyPurchase: true,
        lastMonthPurchase: true,
        isEligibleRepurchase: true,
        createdAt: true,
        sponsor: {
          select: {
            id: true,
            fullName: true,
            referralCode: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get total team count (all downline members)
    const teamCount = await prisma.hierarchy.count({
      where: { ancestorId: userId }
    })

    // Get direct referrals count
    const directReferrals = await prisma.user.count({
      where: { sponsorId: userId }
    })

    // Get wallet transactions for recent activity
    const recentTransactions = await prisma.ledger.findMany({
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
    })

    // Get pending self payouts
    const pendingPayouts = await prisma.selfPayoutSchedule.findMany({
      where: { 
        userId: userId,
        status: 'scheduled',
        dueAt: { lte: new Date() }
      },
      orderBy: { dueAt: 'asc' },
      take: 5
    })

    // Calculate total commission earned
    const commissionStats = await prisma.ledger.aggregate({
      where: {
        userId: userId,
        type: {
          in: ['sponsor_commission', 'repurchase_commission', 'self_joining_instalment']
        }
      },
      _sum: {
        amount: true
      }
    })

    // Get current month's commission
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyCommission = await prisma.ledger.aggregate({
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
    })

    // Format response data
  const origin = req?.nextUrl?.origin || process.env.NEXTAUTH_URL;
  const mlmData = {
      user: {
        id: user.id,
        fullName: user.fullName,
        isActive: user.isActive,
        referralCode: user.referralCode,
  referralLink: (user.referralCode && origin) ? `${origin}/login-register?spid=${user.id}` : null,
        isKycApproved: user.isKycApproved,
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
      kycStatus: {
        isApproved: user.isKycApproved,
        requiredForEarnings: true,
        minimumMonthlyPurchase: {
          paisa: 50000, // ₹500
          rupees: paisaToRupees(50000)
        }
      }
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
