import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'health-check'

    if (action === 'health-check') {
      // System health check
      const [
        dbConnection,
        userCount,
        teamCount,
        poolCount,
        apiHealth
      ] = await Promise.all([
        // Database connection test
        prisma.$queryRaw`SELECT 1 as test`,
        
        // Basic counts
        prisma.user.count(),
        prisma.team.count(),
        prisma.turnoverPool.count(),
        
        // API health status
        Promise.resolve({ status: 'healthy' })
      ])

      return NextResponse.json({
        success: true,
        system: {
          database: { status: 'connected', connection: !!dbConnection },
          entities: {
            users: userCount,
            teams: teamCount,
            pools: poolCount
          },
          api: apiHealth,
          timestamp: new Date().toISOString()
        }
      })
    }

    if (action === 'validate-mlm') {
      // MLM system validation
      const validation = {
        userLevels: {},
        teamFormation: {},
        poolDistribution: {},
        errors: []
      }

      // Check user level distribution
      const levelDistribution = await prisma.user.groupBy({
        by: ['level'],
        _count: { level: true }
      })

      levelDistribution.forEach(item => {
        validation.userLevels[`level_${item.level}`] = item._count.level
      })

      // Check team formation
      const [completeTeams, incompleteTeams] = await Promise.all([
        prisma.team.count({ where: { status: 'COMPLETE' } }),
        prisma.team.count({ where: { isComplete: false } })
      ])

      validation.teamFormation = {
        complete: completeTeams,
        incomplete: incompleteTeams,
        total: completeTeams + incompleteTeams
      }

      // Check pool distribution
      const [distributedPools, pendingPools] = await Promise.all([
        prisma.turnoverPool.count({ where: { distributed: true } }),
        prisma.turnoverPool.count({ where: { distributed: false } })
      ])

      validation.poolDistribution = {
        distributed: distributedPools,
        pending: pendingPools,
        total: distributedPools + pendingPools
      }

      return NextResponse.json({
        success: true,
        validation,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('System validation error:', error)
    return NextResponse.json(
      { 
        error: 'System validation failed', 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
