import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for admin endpoints
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting
    try {
      await limiter.check(20, `admin_team_stats_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Get current date ranges
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get team formation data
    const [
      totalUsers,
      totalTeams,
      activeBuilders,
      newTeamsThisWeek,
      newTeamsThisMonth,
      newTeamsLastMonth,
      levelCounts
    ] = await Promise.all([
      // Total users in system
      prisma.user.count({
        where: { role: 'user' }
      }),

      // Total teams formed (users with at least 1 team)
      prisma.user.count({
        where: {
          role: 'user',
          totalTeams: {
            gt: 0
          }
        }
      }),

      // Active team builders (users with referral codes who have made teams)
      prisma.user.count({
        where: {
          role: 'user',
          referralCode: {
            not: null
          },
          totalTeams: {
            gt: 0
          }
        }
      }),

      // New teams this week
      prisma.user.count({
        where: {
          role: 'user',
          level: {
            not: null
          },
          updatedAt: {
            gte: startOfWeek
          }
        }
      }),

      // New teams this month
      prisma.user.count({
        where: {
          role: 'user',
          level: {
            not: null
          },
          updatedAt: {
            gte: startOfMonth
          }
        }
      }),

      // New teams last month
      prisma.user.count({
        where: {
          role: 'user',
          level: {
            not: null
          },
          updatedAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),

      // Level distribution
      prisma.user.groupBy({
        by: ['level'],
        where: {
          role: 'user',
          level: {
            not: null
          }
        },
        _count: {
          id: true
        },
        _avg: {
          totalTeams: true
        }
      })
    ])

    // Calculate team statistics
    const allUsersWithTeams = await prisma.user.findMany({
      where: {
        role: 'user',
        totalTeams: {
          gt: 0
        }
      },
      select: {
        totalTeams: true
      }
    })

    const totalTeamCount = allUsersWithTeams.reduce((sum, user) => sum + (user.totalTeams || 0), 0)
    const avgTeamSize = totalTeams > 0 ? (totalTeamCount / totalTeams).toFixed(1) : 0

    // Calculate growth rate
    const growthRate = newTeamsLastMonth > 0 
      ? (((newTeamsThisMonth - newTeamsLastMonth) / newTeamsLastMonth) * 100).toFixed(1)
      : newTeamsThisMonth > 0 ? 100 : 0

    // Get weekly team formation data for trends
    const weeklyTeamData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', updated_at) as week_start,
        COUNT(*) as teams_formed
      FROM User
      WHERE role = 'user' 
        AND level IS NOT NULL
        AND updated_at >= ${new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE_TRUNC('week', updated_at)
      ORDER BY week_start ASC
    `

    const avgTeamsPerWeek = weeklyTeamData.length > 0
      ? (weeklyTeamData.reduce((sum, week) => sum + Number(week.teams_formed), 0) / weeklyTeamData.length).toFixed(1)
      : 0

    // Format level counts for easier consumption
    const levelCountsFormatted = {}
    levelCounts.forEach(level => {
      levelCountsFormatted[level.level] = level._count.id
    })

    // Get recent team formation events
    const recentPromotions = await prisma.user.findMany({
      where: {
        role: 'user',
        level: {
          not: null
        },
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        fullName: true,
        level: true,
        totalTeams: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })

    // Calculate team builder efficiency
    const usersWithReferralCodes = await prisma.user.count({
      where: {
        role: 'user',
        referralCode: {
          not: null
        }
      }
    })

    const builderEfficiency = usersWithReferralCodes > 0 
      ? ((activeBuilders / usersWithReferralCodes) * 100).toFixed(1)
      : 0

    // Get top team builders
    const topBuilders = await prisma.user.findMany({
      where: {
        role: 'user',
        totalTeams: {
          gt: 0
        }
      },
      select: {
        id: true,
        fullName: true,
        level: true,
        totalTeams: true,
        referralCode: true,
        createdAt: true
      },
      orderBy: {
        totalTeams: 'desc'
      },
      take: 5
    })

    // Calculate team velocity (teams formed per day)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const teamVelocity = (newTeamsThisMonth / daysInMonth).toFixed(2)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTeams,
          activeBuilders,
          builderEfficiency: parseFloat(builderEfficiency),
          newTeamsThisMonth,
          growthRate: parseFloat(growthRate),
          avgTeamSize: parseFloat(avgTeamSize),
          teamVelocity: parseFloat(teamVelocity)
        },
        trends: {
          teamsThisWeek: newTeamsThisWeek,
          teamsThisMonth: newTeamsThisMonth,
          teamsLastMonth: newTeamsLastMonth,
          avgTeamsPerWeek: parseFloat(avgTeamsPerWeek),
          weeklyData: weeklyTeamData.map(week => ({
            week: week.week_start,
            teams: Number(week.teams_formed)
          }))
        },
        distribution: {
          levelCounts: levelCountsFormatted,
          levelDetails: levelCounts.map(level => ({
            level: level.level,
            userCount: level._count.id,
            avgTeams: parseFloat((level._avg.totalTeams || 0).toFixed(1))
          }))
        },
        activity: {
          recentPromotions: recentPromotions.map(user => ({
            id: user.id,
            name: user.fullName,
            level: user.level,
            teams: user.totalTeams,
            promotedAt: user.updatedAt
          })),
          topBuilders: topBuilders.map(builder => ({
            id: builder.id,
            name: builder.fullName,
            level: builder.level,
            teams: builder.totalTeams,
            referralCode: builder.referralCode,
            joinedAt: builder.createdAt
          }))
        },
        metrics: {
          totalTeamCount,
          averageTeamsPerBuilder: activeBuilders > 0 ? (totalTeamCount / activeBuilders).toFixed(1) : 0,
          builderToUserRatio: ((activeBuilders / totalUsers) * 100).toFixed(1),
          teamFormationRate: ((totalTeams / totalUsers) * 100).toFixed(1)
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Error fetching team overview stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
