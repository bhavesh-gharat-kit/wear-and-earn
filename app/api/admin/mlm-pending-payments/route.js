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
      await limiter.check(20, `admin_payments_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Get current date and calculate weeks
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0)
    
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 7)
    
    const nextWeekStart = new Date(currentWeekEnd)
    const nextWeekEnd = new Date(nextWeekStart)
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7)

    // Get self income payments due
    const [
      selfIncomeThisWeek,
      selfIncomeNextWeek,
      selfIncomeOverdue,
      pendingWithdrawals,
      failedPayments
    ] = await Promise.all([
      // Self income due this week
      prisma.selfIncomePayment.aggregate({
        where: {
          status: 'pending',
          scheduledDate: {
            gte: currentWeekStart,
            lt: currentWeekEnd
          }
        },
        _sum: { amount: true },
        _count: true
      }),

      // Self income due next week
      prisma.selfIncomePayment.aggregate({
        where: {
          status: 'pending',
          scheduledDate: {
            gte: nextWeekStart,
            lt: nextWeekEnd
          }
        },
        _sum: { amount: true },
        _count: true
      }),

      // Overdue self income payments
      prisma.selfIncomePayment.aggregate({
        where: {
          status: 'pending',
          scheduledDate: {
            lt: currentWeekStart
          }
        },
        _sum: { amount: true },
        _count: true
      }),

      // Pending withdrawal requests
      prisma.withdrawal.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: true
      }),

      // Failed payments (last 30 days)
      prisma.selfIncomePayment.aggregate({
        where: {
          status: 'failed',
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true },
        _count: true
      })
    ])

    // Get detailed self income payment schedule
    const upcomingSelfIncomePayments = await prisma.selfIncomePayment.findMany({
      where: {
        status: 'pending',
        scheduledDate: {
          gte: now,
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      take: 50
    })

    // Get detailed pending withdrawals
    const pendingWithdrawalDetails = await prisma.withdrawal.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            isKycApproved: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 20
    })

    // Get failed payment details
    const failedPaymentDetails = await prisma.selfIncomePayment.findMany({
      where: {
        status: 'failed',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    })

    // Calculate payment schedule summary by week
    const paymentScheduleSummary = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', scheduled_date) as week_start,
        COUNT(*) as payment_count,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM SelfIncomePayment
      WHERE scheduled_date >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        AND scheduled_date <= ${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE_TRUNC('week', scheduled_date)
      ORDER BY week_start ASC
    `

    // Get users awaiting payments (have pending self income or withdrawals)
    const usersAwaitingPayment = await prisma.user.count({
      where: {
        role: 'user',
        OR: [
          {
            selfIncomePayments: {
              some: {
                status: 'pending'
              }
            }
          },
          {
            withdrawals: {
              some: {
                status: 'pending'
              }
            }
          }
        ]
      }
    })

    // Calculate retry requirements for failed payments
    const retryRequired = await prisma.selfIncomePayment.count({
      where: {
        status: 'failed',
        retryCount: {
          lt: 3 // Max 3 retry attempts
        },
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Failed in last 7 days
        }
      }
    })

    // Get KYC-related payment blocks
    const kycBlockedWithdrawals = await prisma.withdrawal.count({
      where: {
        status: 'pending',
        user: {
          isKycApproved: false
        }
      }
    })

    // Calculate average processing times
    const processingTimeAnalysis = await prisma.$queryRaw`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_withdrawal_processing_hours,
        AVG(EXTRACT(EPOCH FROM (updated_at - scheduled_date)) / 3600) as avg_self_income_delay_hours
      FROM (
        SELECT created_at, updated_at, NULL::timestamp as scheduled_date
        FROM Withdrawal 
        WHERE status = 'approved' 
          AND updated_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        UNION ALL
        SELECT created_at, updated_at, scheduled_date
        FROM SelfIncomePayment 
        WHERE status = 'paid'
          AND updated_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      ) combined_payments
    `

    const processingTimes = processingTimeAnalysis[0] || {}

    return NextResponse.json({
      success: true,
      data: {
        selfIncome: {
          thisWeek: {
            amount: selfIncomeThisWeek._sum.amount || 0,
            count: selfIncomeThisWeek._count || 0
          },
          nextWeek: {
            amount: selfIncomeNextWeek._sum.amount || 0,
            count: selfIncomeNextWeek._count || 0
          },
          overdue: {
            amount: selfIncomeOverdue._sum.amount || 0,
            count: selfIncomeOverdue._count || 0
          },
          upcoming: upcomingSelfIncomePayments.map(payment => ({
            id: payment.id,
            user: payment.user.fullName,
            email: payment.user.email,
            amount: payment.amount,
            scheduledDate: payment.scheduledDate,
            installmentNumber: payment.installmentNumber,
            totalInstallments: payment.totalInstallments
          }))
        },
        withdrawals: {
          pending: {
            amount: pendingWithdrawals._sum.amount || 0,
            count: pendingWithdrawals._count || 0
          },
          kycBlocked: kycBlockedWithdrawals,
          details: pendingWithdrawalDetails.map(withdrawal => ({
            id: withdrawal.id,
            user: withdrawal.user.fullName,
            email: withdrawal.user.email,
            amount: withdrawal.amount,
            isKycApproved: withdrawal.user.isKycApproved,
            createdAt: withdrawal.createdAt,
            daysPending: Math.floor((now - withdrawal.createdAt) / (1000 * 60 * 60 * 24))
          }))
        },
        failures: {
          failedPaymentCount: failedPayments._count || 0,
          failedPaymentAmount: failedPayments._sum.amount || 0,
          retryRequired,
          details: failedPaymentDetails.map(payment => ({
            id: payment.id,
            user: payment.user.fullName,
            email: payment.user.email,
            amount: payment.amount,
            scheduledDate: payment.scheduledDate,
            failureReason: payment.failureReason,
            retryCount: payment.retryCount,
            lastAttempt: payment.updatedAt
          }))
        },
        summary: {
          usersAwaitingPayment,
          totalPendingAmount: (selfIncomeThisWeek._sum.amount || 0) + 
                             (selfIncomeNextWeek._sum.amount || 0) + 
                             (selfIncomeOverdue._sum.amount || 0) + 
                             (pendingWithdrawals._sum.amount || 0),
          avgWithdrawalProcessingHours: parseFloat((processingTimes.avg_withdrawal_processing_hours || 0).toFixed(1)),
          avgSelfIncomeDelayHours: parseFloat((processingTimes.avg_self_income_delay_hours || 0).toFixed(1))
        },
        schedule: {
          weekly: paymentScheduleSummary.map(week => ({
            weekStart: week.week_start,
            paymentCount: Number(week.payment_count),
            totalAmount: Number(week.total_amount || 0),
            pendingCount: Number(week.pending_count || 0),
            paidCount: Number(week.paid_count || 0),
            failedCount: Number(week.failed_count || 0)
          }))
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=120' // Cache for 2 minutes (more frequent updates needed)
      }
    })

  } catch (error) {
    console.error('Error fetching pending payments data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
