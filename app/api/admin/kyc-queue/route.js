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
    const status = searchParams.get('status') || 'pending'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sortBy') || 'submittedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const whereClause = {
      kycDocument: {
        isNot: null
      }
    }

    // Filter by status
    if (status !== 'all') {
      whereClause.kycDocument.status = status
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobileNo: { contains: search } }
      ]
    }

    // Get total count
    const totalCount = await prisma.user.count({ where: whereClause })

    // Get paginated results
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        kycDocument: true,
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            reviewedByAdmin: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        kycDocument: {
          [sortBy === 'submittedAt' ? 'createdAt' : sortBy]: sortOrder
        }
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get statistics
    const stats = await prisma.user.groupBy({
      by: ['kycStatus'],
      where: {
        kycDocument: { isNot: null }
      },
      _count: {
        kycStatus: true
      }
    })

    const statusStats = {}
    stats.forEach(stat => {
      statusStats[stat.kycStatus] = stat._count.kycStatus
    })

    // Calculate processing time averages
    const processedKycs = await prisma.kycSubmission.findMany({
      where: {
        status: { in: ['approved', 'rejected'] },
        reviewedDate: { not: null }
      },
      select: {
        submissionDate: true,
        reviewedDate: true,
        status: true
      }
    })

    let totalProcessingTime = 0
    let processedCount = 0

    processedKycs.forEach(kyc => {
      if (kyc.reviewedDate && kyc.submissionDate) {
        const processingTime = new Date(kyc.reviewedDate) - new Date(kyc.submissionDate)
        totalProcessingTime += processingTime
        processedCount++
      }
    })

    const averageProcessingTime = processedCount > 0 
      ? Math.round(totalProcessingTime / processedCount / (1000 * 60 * 60 * 24)) // Convert to days
      : 0

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNo: user.mobileNo,
      registeredAt: user.createdAt,
      kycStatus: user.kycStatus,
      isKycApproved: user.isKycApproved,
      kycApprovedAt: user.kycApprovedAt,
      kycDocument: user.kycDocument ? {
        id: user.kycDocument.id,
        documentType: user.kycDocument.documentType,
        documentNumber: user.kycDocument.documentNumber,
        status: user.kycDocument.status,
        submittedAt: user.kycDocument.createdAt,
        reviewedAt: user.kycDocument.reviewedAt,
        adminNotes: user.kycDocument.adminNotes,
        rejectionReasons: user.kycDocument.rejectionReasons,
        frontImageUrl: user.kycDocument.frontImageUrl,
        backImageUrl: user.kycDocument.backImageUrl,
        selfieUrl: user.kycDocument.selfieUrl,
        hasDocuments: !!(user.kycDocument.frontImageUrl || user.kycDocument.backImageUrl)
      } : null,
      latestSubmission: user.kycSubmissions[0] || null,
      waitingDays: user.kycDocument?.createdAt 
        ? Math.floor((new Date() - new Date(user.kycDocument.createdAt)) / (1000 * 60 * 60 * 24))
        : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        statistics: {
          total: totalCount,
          pending: statusStats.PENDING || 0,
          approved: statusStats.APPROVED || 0,
          rejected: statusStats.REJECTED || 0,
          averageProcessingDays: averageProcessingTime
        },
        filters: {
          status,
          search,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('Error fetching KYC queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
