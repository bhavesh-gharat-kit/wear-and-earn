import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { distributeTurnoverPool } from '@/lib/pool-mlm-system'
import prisma from "@/lib/prisma"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, poolId } = await request.json()
    
    if (action === 'distribute') {
      // Distribute all available pools
      const availablePools = await prisma.turnoverPool.findMany({
        where: { distributed: false },
        orderBy: { createdAt: 'asc' }
      });

      if (availablePools.length === 0) {
        return NextResponse.json({ error: 'No pools available for distribution' }, { status: 400 });
      }

      let totalDistributions = 0;

      // Distribute each pool
      for (const pool of availablePools) {
        const result = await distributeTurnoverPool(pool.id);
        totalDistributions += result.distributionsCount || 0;
      }

      return NextResponse.json({
        success: true,
        message: 'All pools distributed successfully',
        distributions: totalDistributions,
        poolsDistributed: availablePools.length
      });
    }
    
    if (poolId) {
      // Distribute specific pool (legacy support)
      const result = await distributeTurnoverPool(parseInt(poolId));

      return NextResponse.json({
        success: true,
        message: 'Pool distributed successfully',
        data: result
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Pool distribution error:', error);
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

// Get available pools for distribution
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get total undistributed pool amount
    const totalPoolAmount = await prisma.turnoverPool.aggregate({
      _sum: { totalAmount: true },
      where: { distributed: false }
    });

    // Get count of eligible users by level
    const eligibleUsersByLevel = await prisma.user.groupBy({
      by: ['level'],
      _count: { level: true },
      where: {
        isActive: true,
        level: { gte: 1, lte: 5 }
      }
    });

    // Calculate level breakdown
    const levelBreakdown = {};
    const totalAmount = totalPoolAmount._sum.totalAmount || 0;
    
    eligibleUsersByLevel.forEach(levelData => {
      const level = levelData.level;
      const userCount = levelData._count.level;
      
      // Calculate percentage based on pool distribution config
      const percentages = { 1: 0.30, 2: 0.20, 3: 0.20, 4: 0.15, 5: 0.15 };
      const levelAmount = Math.floor(totalAmount * percentages[level]);
      
      levelBreakdown[level] = {
        users: userCount,
        amount: levelAmount
      };
    });

    // Get last distribution date
    const lastDistribution = await prisma.turnoverPool.findFirst({
      where: { distributed: true },
      orderBy: { distributedAt: 'desc' },
      select: { distributedAt: true }
    });

    // Get recent distributions
    const recentDistributions = await prisma.turnoverPool.findMany({
      where: { distributed: true },
      orderBy: { distributedAt: 'desc' },
      take: 10,
      include: {
        distributions: {
          select: {
            amount: true,
            user: { select: { id: true } }
          }
        }
      }
    });

    const formattedRecentDistributions = recentDistributions.map(pool => ({
      createdAt: pool.distributedAt,
      amount: pool.totalAmount,
      userCount: pool.distributions.length
    }));

    return NextResponse.json({
      success: true,
      totalAmount: totalAmount,
      eligibleUsers: eligibleUsersByLevel.reduce((sum, level) => sum + level._count.level, 0),
      lastDistribution: lastDistribution?.distributedAt || null,
      levelBreakdown: levelBreakdown,
      recentDistributions: formattedRecentDistributions
    });

  } catch (error) {
    console.error('Get pools error:', error);
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
