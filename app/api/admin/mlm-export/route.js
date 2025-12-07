import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for admin endpoints
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // Lower limit for export operations
})

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting
    try {
      await limiter.check(5, `admin_export_${session.user.id}`) // Strict limit for exports
    } catch {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'revenue'
    const period = searchParams.get('period') || '30'
    const format = searchParams.get('format') || 'csv'
    
    const days = parseInt(period)
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    let data = []
    let filename = ''
    let headers = []

    switch (type) {
      case 'revenue':
        // Export revenue data
        const revenueData = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'paid'
          },
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    title: true,
                    productPrice: true,
                    mlmPrice: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        headers = [
          'Order ID', 'Date', 'User Name', 'User Email', 'Product Name', 
          'Quantity', 'Product Price', 'MLM Price', 'Total Amount', 
          'Company Share', 'Pool Share'
        ]

        data = revenueData.flatMap(order => 
          order.orderItems.map(item => {
            const productPrice = item.product.productPrice || 0
            const mlmPrice = item.product.mlmPrice || 0
            const quantity = item.quantity
            const companyShare = Math.floor(mlmPrice * quantity * 0.30)
            const poolShare = Math.floor(mlmPrice * quantity * 0.70)

            return [
              order.id,
              order.createdAt.toISOString().split('T')[0],
              order.user.fullName,
              order.user.email,
              item.product.title,
              quantity,
              (productPrice / 100).toFixed(2), // Convert from paisa to rupees
              (mlmPrice / 100).toFixed(2),
              ((productPrice + mlmPrice) * quantity / 100).toFixed(2),
              (companyShare / 100).toFixed(2),
              (poolShare / 100).toFixed(2)
            ]
          })
        )

        filename = `revenue-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`
        break

      case 'users':
        // Export user engagement data
        const userData = await prisma.user.findMany({
          where: {
            role: 'user',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            referralCode: true,
            referredBy: true,
            level: true,
            totalTeams: true,
            isKycApproved: true,
            orders: {
              where: { status: 'paid' },
              select: { id: true, total: true }
            },
            referredUsers: {
              select: { id: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        headers = [
          'User ID', 'Full Name', 'Email', 'Registration Date', 'Referral Code',
          'Referred By', 'Level', 'Total Teams', 'KYC Approved', 'Total Orders',
          'Total Spent', 'Referrals Made'
        ]

        data = userData.map(user => {
          const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0)
          
          return [
            user.id,
            user.fullName,
            user.email,
            user.createdAt.toISOString().split('T')[0],
            user.referralCode || 'N/A',
            user.referredBy || 'Direct',
            user.level || 'L0',
            user.totalTeams || 0,
            user.isKycApproved ? 'Yes' : 'No',
            user.orders.length,
            (totalSpent / 100).toFixed(2),
            user.referredUsers.length
          ]
        })

        filename = `users-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`
        break

      case 'commissions':
        // Export commission data
        const commissionData = await prisma.commission.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            },
            fromUser: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        headers = [
          'Commission ID', 'Date', 'Recipient Name', 'Recipient Email', 
          'From User', 'From User Email', 'Level', 'Amount', 'Type'
        ]

        data = commissionData.map(commission => [
          commission.id,
          commission.createdAt.toISOString().split('T')[0],
          commission.user.fullName,
          commission.user.email,
          commission.fromUser?.fullName || 'System',
          commission.fromUser?.email || 'system@wearandearn.com',
          commission.level,
          (commission.amount / 100).toFixed(2),
          commission.type || 'Commission'
        ])

        filename = `commissions-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`
        break

      case 'withdrawals':
        // Export withdrawal data
        const withdrawalData = await prisma.withdrawal.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                isKycApproved: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        headers = [
          'Withdrawal ID', 'Date', 'User Name', 'User Email', 'Amount',
          'Status', 'KYC Approved', 'Bank Account', 'IFSC Code', 'Approved Date'
        ]

        data = withdrawalData.map(withdrawal => [
          withdrawal.id,
          withdrawal.createdAt.toISOString().split('T')[0],
          withdrawal.user.fullName,
          withdrawal.user.email,
          (withdrawal.amount / 100).toFixed(2),
          withdrawal.status,
          withdrawal.user.isKycApproved ? 'Yes' : 'No',
          withdrawal.bankAccount || 'N/A',
          withdrawal.ifscCode || 'N/A',
          withdrawal.approvedAt ? withdrawal.approvedAt.toISOString().split('T')[0] : 'N/A'
        ])

        filename = `withdrawals-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`
        break

      case 'payments':
        // Export self income payments
        const paymentData = await prisma.selfIncomePayment.findMany({
          where: {
            scheduledDate: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'desc'
          }
        })

        headers = [
          'Payment ID', 'Scheduled Date', 'User Name', 'User Email', 'Amount',
          'Status', 'Installment', 'Total Installments', 'Processed Date', 'Failure Reason'
        ]

        data = paymentData.map(payment => [
          payment.id,
          payment.scheduledDate.toISOString().split('T')[0],
          payment.user.fullName,
          payment.user.email,
          (payment.amount / 100).toFixed(2),
          payment.status,
          payment.installmentNumber,
          payment.totalInstallments,
          payment.paidAt ? payment.paidAt.toISOString().split('T')[0] : 'N/A',
          payment.failureReason || 'N/A'
        ])

        filename = `payments-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        row.map(cell => {
          // Escape commas and quotes in CSV
          const cellStr = String(cell || '')
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      )
    ].join('\n')

    // Return CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

    return response

  } catch (error) {
    console.error('Error generating export:', error)
    return NextResponse.json(
      { error: 'Export generation failed' },
      { status: 500 }
    )
  }
}
