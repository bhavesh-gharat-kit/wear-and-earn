import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { distributeAllAvailablePools } from '@/lib/pool-mlm-system'
import prisma from "@/lib/prisma"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action } = await request.json()
    
    if (action === 'distribute_now' || action === 'distribute') {
      console.log(`🎯 Admin ${session.user.id} triggered pool distribution`);
      
      // Check if there are pools to distribute
      const availablePoolsCount = await prisma.turnoverPool.count({
        where: { distributed: false }
      });

      if (availablePoolsCount === 0) {
        return NextResponse.json({ 
          success: false,
          error: 'No pools available for distribution' 
        }, { status: 400 });
      }

      // Distribute all available pools
      const result = await distributeAllAvailablePools();
      
      // Update the distribution record with admin ID
      await prisma.poolDistribution.update({
        where: { id: result.distributionId },
        data: { adminId: parseInt(session.user.id) }
      });
      
      // Clean up connections after heavy operation
      await prisma.$disconnect();

      console.log(`✅ Pool distribution completed by admin ${session.user.id}:`, result.message);

      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          totalAmountDistributed: result.totalAmountRupees,
          usersRewarded: result.usersRewarded,
          poolsProcessed: result.poolsProcessed,
          levelBreakdown: result.levelBreakdown,
          distributionId: result.distributionId
        }
      });
    }

    return NextResponse.json({ 
      success: false,
      error: 'Invalid action. Use action: "distribute_now"' 
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Pool distribution error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

// Get pool distribution overview and statistics
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get total undistributed pool amount with level breakdown
    const availablePools = await prisma.turnoverPool.findMany({
      where: { distributed: false },
      select: {
        id: true,
        totalAmount: true,
        l1Amount: true,
        l2Amount: true, 
        l3Amount: true,
        l4Amount: true,
        l5Amount: true,
        createdAt: true
      }
    });

    // Calculate total amounts
    const totalPoolAmount = availablePools.reduce((sum, pool) => sum + (pool.totalAmount || 0), 0);
    const levelAmounts = {
      L1: availablePools.reduce((sum, pool) => sum + (pool.l1Amount || 0), 0),
      L2: availablePools.reduce((sum, pool) => sum + (pool.l2Amount || 0), 0),
      L3: availablePools.reduce((sum, pool) => sum + (pool.l3Amount || 0), 0),
      L4: availablePools.reduce((sum, pool) => sum + (pool.l4Amount || 0), 0),
      L5: availablePools.reduce((sum, pool) => sum + (pool.l5Amount || 0), 0)
    };

    // Get eligible users by level (active users who have achieved levels)
    const eligibleUsersByLevel = await prisma.user.groupBy({
      by: ['level'],
      _count: { level: true },
      where: {
        isActive: true,
        level: { gte: 1, lte: 5 }
      }
    });

    // Create level breakdown with user counts and amounts
    const levelBreakdown = {};
    const totalEligibleUsers = eligibleUsersByLevel.reduce((sum, level) => sum + level._count.level, 0);
    
    for (let level = 1; level <= 5; level++) {
      const levelData = eligibleUsersByLevel.find(l => l.level === level);
      const userCount = levelData?._count.level || 0;
      const levelAmount = levelAmounts[`L${level}`] || 0;
      const perUserAmount = userCount > 0 ? Math.floor(levelAmount / userCount) : 0;
      
      levelBreakdown[level] = {
        users: userCount,
        amount: levelAmount,
        totalAmount: levelAmount,
        totalAmountRupees: (levelAmount / 100).toFixed(2),
        perUserAmount: perUserAmount,
        perUserAmountRupees: (perUserAmount / 100).toFixed(2)
      };
    }

    // Get last distribution date from PoolDistribution table (more accurate)
    const lastDistribution = await prisma.poolDistribution.findFirst({
      where: { 
        status: 'COMPLETED',
        distributedAt: { not: null }
      },
      orderBy: { distributedAt: 'desc' },
      select: { 
        distributedAt: true,
        totalAmount: true,
        l1UserCount: true,
        l2UserCount: true,
        l3UserCount: true,
        l4UserCount: true,
        l5UserCount: true
      }
    });

    // Get recent distribution history
    const recentDistributions = await prisma.poolDistribution.findMany({
      where: { 
        status: 'COMPLETED',
        distributedAt: { not: null }
      },
      orderBy: { distributedAt: 'desc' },
      take: 10,
      include: {
        admin: {
          select: {
            fullName: true
          }
        }
      }
    });

    const formattedRecentDistributions = recentDistributions.map(dist => ({
      id: dist.id,
      distributedAt: dist.distributedAt,
      totalAmount: dist.totalAmount,
      totalAmountRupees: (dist.totalAmount / 100).toFixed(2),
      totalUsers: dist.l1UserCount + dist.l2UserCount + dist.l3UserCount + dist.l4UserCount + dist.l5UserCount,
      adminName: dist.admin?.fullName || 'System',
      levelBreakdown: {
        L1: { users: dist.l1UserCount, amount: (dist.l1Amount / 100).toFixed(2) },
        L2: { users: dist.l2UserCount, amount: (dist.l2Amount / 100).toFixed(2) },
        L3: { users: dist.l3UserCount, amount: (dist.l3Amount / 100).toFixed(2) },
        L4: { users: dist.l4UserCount, amount: (dist.l4Amount / 100).toFixed(2) },
        L5: { users: dist.l5UserCount, amount: (dist.l5Amount / 100).toFixed(2) }
      }
    }));

    return NextResponse.json({
      success: true,
      // Frontend expected format
      totalAmount: totalPoolAmount,
      eligibleUsers: totalEligibleUsers,
      levelBreakdown,
      lastDistribution: lastDistribution ? {
        date: lastDistribution.distributedAt,
        amount: lastDistribution.totalAmount,
        amountRupees: (lastDistribution.totalAmount / 100).toFixed(2),
        totalUsers: lastDistribution.l1UserCount + lastDistribution.l2UserCount + 
                   lastDistribution.l3UserCount + lastDistribution.l4UserCount + 
                   lastDistribution.l5UserCount
      } : null,
      recentDistributions: formattedRecentDistributions.map(dist => ({
        createdAt: dist.distributedAt,
        amount: dist.totalAmount,
        userCount: dist.totalUsers
      })),
      // Additional data for backend compatibility
      poolStatus: {
        totalAmount: totalPoolAmount,
        totalAmountRupees: (totalPoolAmount / 100).toFixed(2),
        availablePoolsCount: availablePools.length,
        canDistribute: totalPoolAmount > 0,
        eligibleUsers: totalEligibleUsers
      },
      eligibleUsersByLevel: eligibleUsersByLevel.reduce((acc, level) => {
        acc[`L${level.level}`] = level._count.level;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('❌ Get pool statistics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
