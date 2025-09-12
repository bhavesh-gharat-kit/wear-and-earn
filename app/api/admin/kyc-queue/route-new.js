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
      kycData: {
        isNot: null
      }
    }

    // Filter by status
    if (status !== 'all') {
      whereClause.kycData.status = status
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
    
    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(totalCount / limit)

    // Get paginated results
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        kycData: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: sortOrder
      }
    })

    // Get statistics
    const totalKycSubmissions = await prisma.user.count({
      where: { kycData: { isNot: null } }
    })

    const pendingCount = await prisma.user.count({
      where: { 
        kycData: { 
          isNot: null,
          status: 'pending'
        } 
      }
    })

    const approvedCount = await prisma.user.count({
      where: { 
        kycData: { 
          isNot: null,
          status: 'approved'
        } 
      }
    })

    const rejectedCount = await prisma.user.count({
      where: { 
        kycData: { 
          isNot: null,
          status: 'rejected'
        } 
      }
    })

    const statistics = {
      total: totalKycSubmissions,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      averageProcessingDays: 0
    }

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNo: user.mobileNo,
      kycStatus: user.kycStatus,
      kycData: user.kycData ? {
        id: user.kycData.id,
        fullName: user.kycData.fullName,
        dateOfBirth: user.kycData.dateOfBirth,
        gender: user.kycData.gender,
        fatherName: user.kycData.fatherName,
        aadharNumber: user.kycData.aadharNumber,
        panNumber: user.kycData.panNumber,
        bankAccountNumber: user.kycData.bankAccountNumber,
        ifscCode: user.kycData.ifscCode,
        bankName: user.kycData.bankName,
        branchName: user.kycData.branchName,
        nomineeName: user.kycData.nomineeName,
        nomineeRelation: user.kycData.nomineeRelation,
        status: user.kycData.status,
        submittedAt: user.kycData.submittedAt,
        reviewedAt: user.kycData.reviewedAt,
        reviewNote: user.kycData.reviewNote,
      } : null,
      waitingDays: user.kycData?.submittedAt 
        ? Math.floor((new Date() - new Date(user.kycData.submittedAt)) / (1000 * 60 * 60 * 24))
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
