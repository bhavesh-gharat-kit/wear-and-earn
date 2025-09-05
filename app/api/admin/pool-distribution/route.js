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

    const { poolId } = await request.json()
    
    if (!poolId) {
      return NextResponse.json({ error: 'poolId required' }, { status: 400 })
    }

    // Distribute the pool
    const result = await distributeTurnoverPool(parseInt(poolId));

    return NextResponse.json({
      success: true,
      message: 'Pool distributed successfully',
      data: result
    });

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

    // Get undistributed pools
    const pools = await prisma.turnoverPool.findMany({
      where: { distributed: false },
      orderBy: { createdAt: 'desc' }
    });

    // Get recently distributed pools
    const distributedPools = await prisma.turnoverPool.findMany({
      where: { distributed: true },
      orderBy: { distributedAt: 'desc' },
      take: 10,
      include: {
        distributions: {
          include: {
            user: { select: { fullName: true, level: true } }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        availablePools: pools.map(pool => ({
          id: pool.id,
          totalAmount: pool.totalAmount,
          totalAmountRs: pool.totalAmount / 100,
          l1Amount: pool.l1Amount,
          l2Amount: pool.l2Amount,
          l3Amount: pool.l3Amount,
          l4Amount: pool.l4Amount,
          l5Amount: pool.l5Amount,
          createdAt: pool.createdAt
        })),
        recentDistributions: distributedPools.map(pool => ({
          id: pool.id,
          totalAmount: pool.totalAmount,
          totalAmountRs: pool.totalAmount / 100,
          distributedAt: pool.distributedAt,
          distributionCount: pool.distributions.length,
          distributions: pool.distributions.map(d => ({
            userId: d.userId,
            userName: d.user.fullName,
            level: d.level,
            amount: d.amount,
            amountRs: d.amount / 100
          }))
        }))
      }
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
