import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Overall KYC statistics
    const totalUsers = await prisma.user.count()
    const totalKycSubmissions = await prisma.user.count({
      where: { kycDocument: { isNot: null } }
    })
    
    const kycStatusCounts = await prisma.user.groupBy({
      by: ['kycStatus'],
      where: { kycDocument: { isNot: null } },
      _count: { kycStatus: true }
    })

    const statusStats = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0
    }

    kycStatusCounts.forEach(stat => {
      statusStats[stat.kycStatus] = stat._count.kycStatus
    })

    // Processing time analysis
    const processedKycs = await prisma.kycSubmission.findMany({
      where: {
        AND: [
          { status: { in: ['approved', 'rejected'] } },
          { reviewedDate: { not: null } },
          { submissionDate: { gte: startDate } }
        ]
      },
      select: {
        submissionDate: true,
        reviewedDate: true,
        status: true
      }
    })

    let totalProcessingTime = 0
    let processingTimes = []
    let approvalProcessingTime = 0
    let rejectionProcessingTime = 0
    let approvalCount = 0
    let rejectionCount = 0

    processedKycs.forEach(kyc => {
      if (kyc.reviewedDate && kyc.submissionDate) {
        const processingTimeMs = new Date(kyc.reviewedDate) - new Date(kyc.submissionDate)
        const processingTimeHours = processingTimeMs / (1000 * 60 * 60)
        
        processingTimes.push(processingTimeHours)
        totalProcessingTime += processingTimeMs

        if (kyc.status === 'approved') {
          approvalProcessingTime += processingTimeMs
          approvalCount++
        } else if (kyc.status === 'rejected') {
          rejectionProcessingTime += processingTimeMs
          rejectionCount++
        }
      }
    })

    const averageProcessingHours = processedKycs.length > 0 
      ? totalProcessingTime / processedKycs.length / (1000 * 60 * 60)
      : 0

    const averageApprovalHours = approvalCount > 0 
      ? approvalProcessingTime / approvalCount / (1000 * 60 * 60)
      : 0

    const averageRejectionHours = rejectionCount > 0 
      ? rejectionProcessingTime / rejectionCount / (1000 * 60 * 60)
      : 0

    // Rejection reasons analysis
    const rejectionReasons = await prisma.kycSubmission.findMany({
      where: {
        AND: [
          { status: 'rejected' },
          { rejectionReason: { not: null } },
          { submissionDate: { gte: startDate } }
        ]
      },
      select: {
        rejectionReason: true
      }
    })

    const rejectionReasonCounts = {}
    rejectionReasons.forEach(reason => {
      const reasonKey = reason.rejectionReason || 'Other'
      rejectionReasonCounts[reasonKey] = (rejectionReasonCounts[reasonKey] || 0) + 1
    })

    // Admin performance metrics
    const adminPerformance = await prisma.kycSubmission.groupBy({
      by: ['reviewedByAdminId'],
      where: {
        AND: [
          { status: { in: ['approved', 'rejected'] } },
          { reviewedDate: { gte: startDate } },
          { reviewedByAdminId: { not: null } }
        ]
      },
      _count: {
        id: true
      },
      _avg: {
        id: true // We'll calculate processing time separately
      }
    })

    // Get admin details for performance metrics
    const adminIds = adminPerformance.map(perf => perf.reviewedByAdminId).filter(Boolean)
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, fullName: true, email: true }
    })

    const adminPerformanceWithDetails = await Promise.all(
      adminPerformance.map(async (perf) => {
        const admin = admins.find(a => a.id === perf.reviewedByAdminId)
        
        // Calculate average processing time for this admin
        const adminKycs = await prisma.kycSubmission.findMany({
          where: {
            AND: [
              { reviewedByAdminId: perf.reviewedByAdminId },
              { status: { in: ['approved', 'rejected'] } },
              { reviewedDate: { gte: startDate } },
              { reviewedDate: { not: null } },
              { submissionDate: { not: null } }
            ]
          },
          select: {
            submissionDate: true,
            reviewedDate: true,
            status: true
          }
        })

        let adminProcessingTime = 0
        let adminApprovals = 0
        let adminRejections = 0

        adminKycs.forEach(kyc => {
          const processingTime = new Date(kyc.reviewedDate) - new Date(kyc.submissionDate)
          adminProcessingTime += processingTime
          
          if (kyc.status === 'approved') adminApprovals++
          else if (kyc.status === 'rejected') adminRejections++
        })

        const avgProcessingHours = adminKycs.length > 0 
          ? adminProcessingTime / adminKycs.length / (1000 * 60 * 60)
          : 0

        return {
          adminId: perf.reviewedByAdminId,
          adminName: admin?.fullName || 'Unknown',
          adminEmail: admin?.email || 'Unknown',
          totalProcessed: perf._count.id,
          approvals: adminApprovals,
          rejections: adminRejections,
          approvalRate: perf._count.id > 0 ? (adminApprovals / perf._count.id * 100) : 0,
          averageProcessingHours: avgProcessingHours
        }
      })
    )

    // Daily trends for the period
    const dailyTrends = []
    for (let i = parseInt(period); i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayStats = await prisma.kycSubmission.groupBy({
        by: ['status'],
        where: {
          submissionDate: {
            gte: date,
            lt: nextDate
          }
        },
        _count: {
          status: true
        }
      })

      const dayData = {
        date: date.toISOString().split('T')[0],
        submissions: 0,
        approvals: 0,
        rejections: 0
      }

      dayStats.forEach(stat => {
        if (stat.status === 'pending') dayData.submissions += stat._count.status
        else if (stat.status === 'approved') dayData.approvals += stat._count.status
        else if (stat.status === 'rejected') dayData.rejections += stat._count.status
      })

      dailyTrends.push(dayData)
    }

    // Approval rate trends
    const approvalRate = totalKycSubmissions > 0 
      ? (statusStats.APPROVED / totalKycSubmissions * 100)
      : 0

    const rejectionRate = totalKycSubmissions > 0 
      ? (statusStats.REJECTED / totalKycSubmissions * 100)
      : 0

    const pendingRate = totalKycSubmissions > 0 
      ? (statusStats.PENDING / totalKycSubmissions * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalKycSubmissions,
          kycCompletionRate: totalUsers > 0 ? (totalKycSubmissions / totalUsers * 100) : 0,
          approvalRate,
          rejectionRate,
          pendingRate,
          pendingCount: statusStats.PENDING
        },
        processingMetrics: {
          averageProcessingHours: Math.round(averageProcessingHours * 100) / 100,
          averageApprovalHours: Math.round(averageApprovalHours * 100) / 100,
          averageRejectionHours: Math.round(averageRejectionHours * 100) / 100,
          totalProcessed: processedKycs.length,
          fastestProcessingHours: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
          slowestProcessingHours: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
        },
        statusBreakdown: statusStats,
        rejectionReasons: rejectionReasonCounts,
        adminPerformance: adminPerformanceWithDetails,
        trends: {
          daily: dailyTrends,
          period: parseInt(period)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching KYC analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
