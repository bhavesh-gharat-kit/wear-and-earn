import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total pool amount
    const totalPoolAmount = await prisma.turnoverPool.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    // Get active teams count
    const activeTeams = await prisma.team.count({
      where: { status: 'COMPLETE' }
    });

    // Get L5 users count
    const l5Users = await prisma.user.count({
      where: {
        level: 5
      }
    });

    // Get pending distributions (self income payouts due)
    const pendingDistributions = await prisma.selfPayoutSchedule.count({
      where: {
        status: 'pending',
        dueAt: {
          lte: new Date()
        }
      }
    });

    // Get level distribution
    const levelDistribution = await prisma.user.groupBy({
      by: ['level'],
      _count: {
        level: true
      },
      where: {
        isActive: true
      }
    });

    const levelDistributionMap = {};
    levelDistribution.forEach(item => {
      levelDistributionMap[item.level] = item._count.level;
    });

    // Get level stats with earnings
    const levelStats = {};
    for (let level = 1; level <= 5; level++) {
      const users = await prisma.user.count({
        where: { level: level }
      });

      const earnings = await prisma.wallet.aggregate({
        _sum: { amount: true },
        where: {
          user: { level: level },
          type: 'pool_distribution'
        }
      });

      levelStats[level] = {
        users: users,
        totalEarnings: earnings._sum.amount || 0
      };
    }

    return NextResponse.json({
      success: true,
      totalPoolAmount: totalPoolAmount._sum.amount || 0,
      activeTeams: activeTeams,
      l5Users: l5Users,
      pendingDistributions: pendingDistributions,
      levelDistribution: levelDistributionMap,
      levelStats: levelStats
    });

  } catch (error) {
    console.error('Error fetching pool stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
