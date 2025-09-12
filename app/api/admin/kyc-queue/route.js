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

    // Build where clause for KycData
    const kycWhereClause = {}

    // Filter by status
    if (status !== 'all') {
      kycWhereClause.status = status
    }

    // Search filter - search in the related user data
    let userWhereClause = {}
    if (search) {
      userWhereClause.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { mobileNo: { contains: search } }
      ]
    }

    // Get total count from KycData directly
    const totalCount = await prisma.kycData.count({ 
      where: {
        ...kycWhereClause,
        user: userWhereClause
      }
    })
    
    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(totalCount / limit)

    // Get paginated results from KycData
    const kycSubmissions = await prisma.kycData.findMany({
      where: {
        ...kycWhereClause,
        user: userWhereClause
      },
      include: {
        user: true
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    // Get statistics
    const totalKycSubmissions = await prisma.kycData.count()

    const pendingCount = await prisma.kycData.count({
      where: { status: 'pending' }
    })

    const approvedCount = await prisma.kycData.count({
      where: { status: 'approved' }
    })

    const rejectedCount = await prisma.kycData.count({
      where: { status: 'rejected' }
    })

    const statistics = {
      total: totalKycSubmissions,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      averageProcessingDays: 0
    }

    // Transform KYC submissions data
    const transformedUsers = kycSubmissions.map(kycData => ({
      id: kycData.user.id,
      fullName: kycData.user.fullName,
      email: kycData.user.email,
      mobileNo: kycData.user.mobileNo,
      kycStatus: kycData.user.kycStatus,
      kycData: {
        id: kycData.id,
        fullName: kycData.fullName,
        dateOfBirth: kycData.dateOfBirth,
        gender: kycData.gender,
        fatherName: kycData.fatherName,
        aadharNumber: kycData.aadharNumber,
        panNumber: kycData.panNumber,
        bankAccountNumber: kycData.bankAccountNumber,
        ifscCode: kycData.ifscCode,
        bankName: kycData.bankName,
        branchName: kycData.branchName,
        nomineeName: kycData.nomineeName,
        nomineeRelation: kycData.nomineeRelation,
        status: kycData.status,
        submittedAt: kycData.submittedAt,
        reviewedAt: kycData.reviewedAt,
        reviewNote: kycData.reviewNote,
      },
      waitingDays: kycData.submittedAt 
        ? Math.floor((new Date() - new Date(kycData.submittedAt)) / (1000 * 60 * 60 * 24))
        : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        statistics,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults: totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          total: totalCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching KYC queue:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch KYC queue',
      message: error.message
    }, { status: 500 })
  }
}
