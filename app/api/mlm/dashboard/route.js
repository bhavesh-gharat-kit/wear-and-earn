import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { generateReferralLink } from '@/lib/url-utils'
import { getDirectReferrals, getTotalTeamSize, getDownlines } from '@/lib/mlm-matrix'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id);
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user session' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        isActive: true,
        isKycApproved: true,
        walletBalance: true,
        monthlyPurchase: true,
        lastMonthPurchase: true,
        isEligibleRepurchase: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get matrix position
    const matrixPosition = await prisma.matrixNode.findUnique({
      where: { userId },
      include: {
        parent: {
          include: { user: { select: { name: true, referralCode: true } } }
        }
      }
    });

    // Get direct referrals count
    const directReferralsCount = await getDirectReferrals(prisma, userId);
    
    // Get total team size (7 levels deep)
    const totalTeamSize = await getTotalTeamSize(prisma, userId);

    // Get downlines for first 3 levels
    const level1 = await getDownlines(prisma, userId, 1);
    const level2 = await getDownlines(prisma, userId, 2);
    const level3 = await getDownlines(prisma, userId, 3);

    // Get commission earnings summary
    const commissionSummary = await prisma.ledger.groupBy({
      by: ['type'],
      where: {
        userId,
        type: { in: ['sponsor_commission', 'repurchase_commission'] }
      },
      _sum: { amount: true }
    });

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.ledger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get pending self-payouts
    const pendingPayouts = await prisma.selfPayoutSchedule.findMany({
      where: {
        userId,
        status: 'scheduled',
        dueAt: { lte: new Date() }
      },
      orderBy: { dueAt: 'asc' }
    });

    // Calculate total pending payout amount
    const totalPendingPayout = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0);

    // Get this month's purchase amount
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthPurchase = user.lastMonthPurchase === currentMonth ? user.monthlyPurchase : 0;

  const responseData = {
  ...user,
  teamSize,
  totalEarnings: (ledgerSummary._sum.amount || 0),
  directReferrals,
  pendingCommission: (pendingCommissions._sum.amount || 0),
  latestCommissions,
  referralLink: user.referralCode ? generateReferralLink(request, user.referralCode) : null
  };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching MLM dashboard:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
