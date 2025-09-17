import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'overview'

    if (action === 'overview') {
      // Get pool management overview
      const [
        totalPoolAmount,
        activeTeams,
        l5Users,
        pendingDistributions,
        recentDistributions
      ] = await Promise.all([
        // Total pool amount
        prisma.turnoverPool.aggregate({
          _sum: { totalAmount: true },
          where: { distributed: false }
        }),
        
        // Active teams count
        prisma.team.count({
          where: { status: 'COMPLETE' }
        }),
        
        // L5 users count  
        prisma.user.count({
          where: { level: 5 }
        }),
        
        // Pending distributions
        prisma.selfIncomeInstallment.count({
          where: {
            status: 'scheduled',
            dueDate: { lte: new Date() }
          }
        }),
        
        // Recent distributions
        prisma.turnoverPool.findMany({
          where: { distributed: true },
          orderBy: { distributedAt: 'desc' },
          take: 10,
          include: {
            distributions: {
              select: { totalAmount: true }
            }
          }
        })
      ])

      // Level distribution
      const levelDistribution = await prisma.user.groupBy({
        by: ['level'],
        _count: { level: true },
        where: {
          level: { gte: 1, lte: 5 }
        }
      })

      const levelDistributionMap = {}
      levelDistribution.forEach(item => {
        levelDistributionMap[item.level] = item._count.level
      })

      const formattedDistributions = recentDistributions.map(pool => ({
        createdAt: pool.distributedAt,
        amount: pool.totalAmount,
        userCount: pool.distributions.length
      }))

      return NextResponse.json({
        success: true,
        totalPoolAmount: totalPoolAmount._sum.totalAmount || 0,
        activeTeams,
        l5Users,
        pendingDistributions,
        levelDistribution: levelDistributionMap,
        recentDistributions: formattedDistributions
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Pool management API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, data } = await request.json()

    if (action === 'recalculate_teams') {
      // Recalculate team counts for specific user
      const { userId } = data
      
      const completedTeams = await prisma.team.count({
        where: { 
          userId: userId,
          status: 'COMPLETE'
        }
      })

      await prisma.user.update({
        where: { id: userId },
        data: { directTeams: completedTeams }
      })

      return NextResponse.json({
        success: true,
        message: 'Team count recalculated',
        directTeams: completedTeams
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Pool management POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
