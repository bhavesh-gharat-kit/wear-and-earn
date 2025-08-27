import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";


export async function GET(request) {
  try {
    // Get basic user statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const kycApproved = await prisma.user.count({ where: { isKycApproved: true } });
    const eligibleRepurchase = await prisma.user.count({ where: { isEligibleRepurchase: true } });

    // Get commission statistics
    const commissionStats = await prisma.ledger.groupBy({
      by: ['type'],
      where: {
        type: { in: ['sponsor_commission', 'repurchase_commission', 'self_commission', 'company_fund'] }
      },
      _sum: { amount: true }
    });

    const sponsorCommission = (commissionStats.find(c => c.type === 'sponsor_commission')?._sum?.amount || 0) / 100;
    const repurchaseCommission = (commissionStats.find(c => c.type === 'repurchase_commission')?._sum?.amount || 0) / 100;
    const selfCommission = (commissionStats.find(c => c.type === 'self_commission')?._sum?.amount || 0) / 100;
    const companyRevenue = (commissionStats.find(c => c.type === 'company_fund')?._sum?.amount || 0) / 100;

    const totalCommissionPaid = sponsorCommission + repurchaseCommission + selfCommission;

    // Get level-wise distribution
    const levelDistribution = await prisma.matrixNode.groupBy({
      by: ['level'],
      _count: { userId: true },
      orderBy: { level: 'asc' }
    });

    const formattedLevelDistribution = Array.from({ length: 7 }, (_, i) => {
      const level = i + 1;
      const found = levelDistribution.find(l => l.level === level);
      return {
        level,
        count: found?._count?.userId || 0
      };
    });

    // Get pending payouts count
    const pendingPayouts = await prisma.selfPayoutSchedule.count({
      where: {
        status: 'scheduled',
        dueAt: { lte: new Date() }
      }
    });

    // Get recent MLM transactions (last 20)
    const recentTransactions = await prisma.ledger.findMany({
      where: {
        type: { in: ['sponsor_commission', 'repurchase_commission', 'self_commission'] }
      },
      include: {
        user: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const formattedTransactions = recentTransactions.map(t => ({
      ...t,
      amount: (t.amount / 100).toFixed(2)
    }));

    const stats = {
      totalUsers,
      activeUsers,
      kycApproved,
      eligibleRepurchase,
      totalCommissionPaid: totalCommissionPaid.toFixed(2),
      sponsorCommission: sponsorCommission.toFixed(2),
      repurchaseCommission: repurchaseCommission.toFixed(2),
      selfCommission: selfCommission.toFixed(2),
      companyRevenue: companyRevenue.toFixed(2),
      levelDistribution: formattedLevelDistribution,
      pendingPayouts,
      recentTransactions: formattedTransactions
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching MLM stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch MLM statistics' },
      { status: 500 }
    );
  }
}
