import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import { getServerSession } from 'next-auth/next'

/**
 * Withdrawal Analytics API
 * GET /api/admin/withdrawal-analytics
 * 
 * Provides comprehensive analytics for withdrawal management including:
 * - Processing time metrics
 * - Success/failure rates  
 * - Volume tracking
 * - KYC-blocked requests stats
 * - Admin performance metrics
 * - Trend analysis
 */

export async function GET(request) {
  try {
    // Authentication check
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin authorization check
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days')) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. Overall Statistics
    const overallStats = await prisma.withdrawalRequest.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    })

    // 2. Status Breakdown
    const statusBreakdown = await prisma.withdrawalRequest.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    })

    const statusStats = {}
    statusBreakdown.forEach(stat => {
      statusStats[stat.status] = {
        count: stat._count._all,
        amount: stat._sum.amount || 0
      }
    })

    // 3. Processing Time Analysis
    const processedWithdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        status: {
          in: ['approved', 'rejected']
        },
        processedAt: {
          not: null
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        processedAt: true,
        amount: true
      }
    })

    const processingTimes = processedWithdrawals.map(w => {
      const processingHours = (new Date(w.processedAt) - new Date(w.createdAt)) / (1000 * 60 * 60)
      return {
        id: w.id,
        status: w.status,
        amount: w.amount,
        processingHours
      }
    })

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, w) => sum + w.processingHours, 0) / processingTimes.length 
      : 0

    const avgApprovalTime = processingTimes.filter(w => w.status === 'approved').length > 0
      ? processingTimes.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.processingHours, 0) / processingTimes.filter(w => w.status === 'approved').length
      : 0

    const avgRejectionTime = processingTimes.filter(w => w.status === 'rejected').length > 0
      ? processingTimes.filter(w => w.status === 'rejected').reduce((sum, w) => sum + w.processingHours, 0) / processingTimes.filter(w => w.status === 'rejected').length
      : 0

    const fastestProcessing = processingTimes.length > 0 
      ? Math.min(...processingTimes.map(w => w.processingHours))
      : 0

    const slowestProcessing = processingTimes.length > 0 
      ? Math.max(...processingTimes.map(w => w.processingHours))
      : 0

    // 4. KYC Impact Analysis
    const kycBlockedRequests = await prisma.withdrawalRequest.count({
      where: {
        createdAt: {
          gte: startDate
        },
        user: {
          isKycApproved: false
        }
      }
    })

    const approvedUsersWithdrawals = await prisma.withdrawalRequest.count({
      where: {
        createdAt: {
          gte: startDate
        },
        user: {
          isKycApproved: true
        }
      }
    })

    // 5. Volume Analysis by Amount Ranges
    const volumeBreakdown = await prisma.withdrawalRequest.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      },
      _avg: {
        amount: true
      }
    })

    // 6. Daily Trends (Last 7 days)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayStats = await prisma.withdrawalRequest.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        _count: {
          _all: true
        },
        _sum: {
          amount: true
        }
      })

      const dayData = {
        date: date.toISOString().split('T')[0],
        total: 0,
        amount: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      }

      dayStats.forEach(stat => {
        dayData.total += stat._count._all
        dayData.amount += stat._sum.amount || 0
        dayData[stat.status] = stat._count._all
      })

      last7Days.push(dayData)
    }

    // 7. Admin Performance (who processed what)
    const adminPerformance = await prisma.withdrawalRequest.groupBy({
      by: ['processedBy'],
      where: {
        createdAt: {
          gte: startDate
        },
        processedBy: {
          not: null
        }
      },
      _count: {
        _all: true
      }
    })

    const adminDetails = await Promise.all(
      adminPerformance.map(async (perf) => {
        if (!perf.processedBy) return null

        const admin = await prisma.user.findUnique({
          where: { id: perf.processedBy },
          select: { id: true, fullName: true, email: true }
        })

        const adminWithdrawals = await prisma.withdrawalRequest.findMany({
          where: {
            processedBy: perf.processedBy,
            createdAt: {
              gte: startDate
            }
          },
          select: {
            status: true,
            createdAt: true,
            processedAt: true
          }
        })

        const approvals = adminWithdrawals.filter(w => w.status === 'approved').length
        const rejections = adminWithdrawals.filter(w => w.status === 'rejected').length
        const approvalRate = perf._count._all > 0 ? (approvals / perf._count._all) * 100 : 0

        const avgProcessingHours = adminWithdrawals.length > 0
          ? adminWithdrawals.reduce((sum, w) => {
              if (w.processedAt) {
                const hours = (new Date(w.processedAt) - new Date(w.createdAt)) / (1000 * 60 * 60)
                return sum + hours
              }
              return sum
            }, 0) / adminWithdrawals.filter(w => w.processedAt).length
          : 0

        return {
          adminId: admin?.id || perf.processedBy,
          adminName: admin?.fullName || 'Unknown Admin',
          adminEmail: admin?.email || 'N/A',
          totalProcessed: perf._count._all,
          approvals,
          rejections,
          approvalRate,
          averageProcessingHours: avgProcessingHours
        }
      })
    )

    // 8. Success/Failure Rates
    const totalProcessed = (statusStats.approved?.count || 0) + (statusStats.rejected?.count || 0)
    const successRate = totalProcessed > 0 ? ((statusStats.approved?.count || 0) / totalProcessed) * 100 : 0
    const failureRate = totalProcessed > 0 ? ((statusStats.rejected?.count || 0) / totalProcessed) * 100 : 0

    // Compile analytics response
    const analytics = {
      overview: {
        totalRequests: overallStats._count._all,
        totalVolume: overallStats._sum.amount || 0,
        totalVolumeRs: ((overallStats._sum.amount || 0) / 100),
        pendingCount: statusStats.pending?.count || 0,
        pendingAmount: statusStats.pending?.amount || 0,
        successRate,
        failureRate,
        kycBlockedRequests,
        kycApprovedRequests: approvedUsersWithdrawals,
        period: `Last ${days} days`
      },

      statusBreakdown: statusStats,

      processingMetrics: {
        averageProcessingHours: Math.round(avgProcessingTime * 100) / 100,
        averageApprovalHours: Math.round(avgApprovalTime * 100) / 100,
        averageRejectionHours: Math.round(avgRejectionTime * 100) / 100,
        fastestProcessingHours: Math.round(fastestProcessing * 100) / 100,
        slowestProcessingHours: Math.round(slowestProcessing * 100) / 100,
        totalProcessed: processedWithdrawals.length
      },

      volumeAnalysis: {
        totalVolume: overallStats._sum.amount || 0,
        averageAmount: volumeBreakdown.length > 0 
          ? volumeBreakdown.reduce((sum, v) => sum + (v._avg.amount || 0), 0) / volumeBreakdown.length 
          : 0,
        largestWithdrawal: processingTimes.length > 0 ? Math.max(...processingTimes.map(w => w.amount)) : 0,
        smallestWithdrawal: processingTimes.length > 0 ? Math.min(...processingTimes.map(w => w.amount)) : 0
      },

      kycImpact: {
        blockedRequests: kycBlockedRequests,
        approvedUserRequests: approvedUsersWithdrawals,
        blockRate: (kycBlockedRequests + approvedUsersWithdrawals) > 0 
          ? (kycBlockedRequests / (kycBlockedRequests + approvedUsersWithdrawals)) * 100 
          : 0
      },

      dailyTrends: last7Days,

      adminPerformance: adminDetails.filter(admin => admin !== null)
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Withdrawal analytics error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch withdrawal analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
