import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import { getServerSession } from 'next-auth/next'

/**
 * Withdrawal Export API
 * GET /api/admin/withdrawals/export
 * 
 * Exports withdrawal data as CSV for reporting and analysis
 * Supports filtering by status, date range, and search terms
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    // Build where clause
    const where = {}
    
    if (status && status !== '') {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // End of day
        where.createdAt.lte = end
      }
    }

    if (search && search.trim() !== '') {
      where.OR = [
        {
          user: {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Fetch withdrawal data
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isKycApproved: true,
            referralCode: true
          }
        },
        processedByUser: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5000 // Limit for performance
    })

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Withdrawal ID',
        'User ID',
        'User Name',
        'User Email',
        'User Phone',
        'Referral Code',
        'Amount (₹)',
        'Method',
        'Status',
        'KYC Status',
        'Requested Date',
        'Processed Date',
        'Processing Time (Hours)',
        'Processed By',
        'Admin Notes',
        'Transaction ID',
        'Bank Details'
      ]

      const csvRows = withdrawals.map(withdrawal => {
        const amountRs = ((withdrawal.amount || 0) / 100).toFixed(2)
        const requestedDate = withdrawal.createdAt ? new Date(withdrawal.createdAt).toISOString().split('T')[0] : ''
        const processedDate = withdrawal.processedAt ? new Date(withdrawal.processedAt).toISOString().split('T')[0] : ''
        
        let processingHours = ''
        if (withdrawal.createdAt && withdrawal.processedAt) {
          const hours = (new Date(withdrawal.processedAt) - new Date(withdrawal.createdAt)) / (1000 * 60 * 60)
          processingHours = hours.toFixed(1)
        }

        const bankDetails = withdrawal.bankDetails ? 
          JSON.stringify(withdrawal.bankDetails).replace(/"/g, '""') : ''

        return [
          withdrawal.id || '',
          withdrawal.user?.id || '',
          withdrawal.user?.fullName || '',
          withdrawal.user?.email || '',
          withdrawal.user?.phone || '',
          withdrawal.user?.referralCode || '',
          amountRs,
          withdrawal.method || 'Bank Transfer',
          withdrawal.status || '',
          withdrawal.user?.isKycApproved ? 'Verified' : 'Pending',
          requestedDate,
          processedDate,
          processingHours,
          withdrawal.processedByUser?.fullName || '',
          withdrawal.adminNotes || '',
          withdrawal.transactionId || '',
          bankDetails
        ].map(field => `"${field}"`).join(',')
      })

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')

      // Return CSV response
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="withdrawals-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })

    } else if (format === 'json') {
      // Return JSON format
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalRecords: withdrawals.length,
          filters: {
            status,
            search,
            startDate,
            endDate
          },
          adminUser: session.user.email
        },
        withdrawals: withdrawals.map(withdrawal => ({
          id: withdrawal.id,
          user: {
            id: withdrawal.user?.id,
            name: withdrawal.user?.fullName,
            email: withdrawal.user?.email,
            phone: withdrawal.user?.phone,
            referralCode: withdrawal.user?.referralCode,
            kycApproved: withdrawal.user?.isKycApproved
          },
          amount: withdrawal.amount,
          amountRs: ((withdrawal.amount || 0) / 100),
          method: withdrawal.method,
          status: withdrawal.status,
          bankDetails: withdrawal.bankDetails,
          createdAt: withdrawal.createdAt,
          processedAt: withdrawal.processedAt,
          processingTimeHours: withdrawal.createdAt && withdrawal.processedAt ?
            (new Date(withdrawal.processedAt) - new Date(withdrawal.createdAt)) / (1000 * 60 * 60) : null,
          processedBy: withdrawal.processedByUser?.fullName,
          adminNotes: withdrawal.adminNotes,
          transactionId: withdrawal.transactionId
        }))
      }

      return NextResponse.json({
        success: true,
        data: exportData
      })
    }

    return NextResponse.json(
      { success: false, message: 'Unsupported export format' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Withdrawal export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to export withdrawal data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
