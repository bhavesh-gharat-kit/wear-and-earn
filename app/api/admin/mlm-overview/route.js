import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma";
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils'


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const filter = searchParams.get('filter') || 'all' // all, active, inactive

    // Get MLM overview stats
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true }})
    const kycApprovedUsers = await prisma.user.count({ where: { isKycApproved: true }})
    const usersWithReferrals = await prisma.user.count({ 
      where: { referralCode: { not: null }}
    })

    // Total commission distributed
    const totalCommissionPaid = await prisma.ledger.aggregate({
      where: {
        type: {
          in: ['sponsor_commission', 'repurchase_commission', 'self_joining_instalment']
        }
      },
      _sum: {
        amount: true
      }
    })

    // Company fund
    const companyFund = await prisma.ledger.aggregate({
      where: {
        type: {
          in: ['company_fund', 'rollup_to_company']
        }
      },
      _sum: {
        amount: true
      }
    })

    // Current month stats
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyCommission = await prisma.ledger.aggregate({
      where: {
        createdAt: { gte: currentMonth },
        type: {
          in: ['sponsor_commission', 'repurchase_commission', 'self_joining_instalment']
        }
      },
      _sum: {
        amount: true
      }
    })

    const monthlyOrders = await prisma.order.count({
      where: {
        createdAt: { gte: currentMonth },
        paidAt: { not: null }
      }
    })

    const monthlyRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: currentMonth },
        paidAt: { not: null }
      },
      _sum: {
        total: true
      }
    })

    // Top performers (users with highest earnings)
    const topPerformers = await prisma.ledger.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        type: {
          in: ['sponsor_commission', 'repurchase_commission', 'self_joining_instalment']
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    })

    // Get user details for top performers
    const topPerformerUsers = await Promise.all(
      topPerformers.map(async (performer) => {
        if (!performer.userId) return null
        const user = await prisma.user.findUnique({
          where: { id: performer.userId },
          select: {
            id: true,
            fullName: true,
            referralCode: true,
            isActive: true,
            createdAt: true,
            referrals: {
              select: { id: true }
            }
          }
        })
        return {
          ...user,
          totalEarnings: {
            paisa: performer._sum.amount || 0,
            rupees: paisaToRupees(performer._sum.amount || 0)
          },
          directReferrals: user?.referrals.length || 0
        }
      })
    )

    // Get users list with filters
    let userWhere = {}
    if (filter === 'active') {
      userWhere.isActive = true
    } else if (filter === 'inactive') {
      userWhere.isActive = false
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        fullName: true,
        mobileNo: true,
        email: true,
        referralCode: true,
        isActive: true,
        isKycApproved: true,
        walletBalance: true,
        monthlyPurchase: true,
        createdAt: true,
        sponsorId: true,
        sponsor: {
          select: {
            id: true,
            fullName: true
          }
        },
        referrals: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalFilteredUsers = await prisma.user.count({ where: userWhere })

    // Level distribution (reduced from 7 to 5 levels)
    const levelDistribution = await Promise.all([1,2,3,4,5].map(async (level) => {
      const count = level === 1 
        ? await prisma.user.count({ where: { sponsorId: { not: null }}})
        : await prisma.hierarchy.count({ where: { depth: level }})
      
      return {
        level,
        count
      }
    }))

    const mlmOverview = {
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          kycApproved: kycApprovedUsers,
          withReferrals: usersWithReferrals
        },
        commissions: {
          totalPaid: {
            paisa: totalCommissionPaid._sum.amount || 0,
            rupees: paisaToRupees(totalCommissionPaid._sum.amount || 0)
          },
          monthlyPaid: {
            paisa: monthlyCommission._sum.amount || 0,
            rupees: paisaToRupees(monthlyCommission._sum.amount || 0)
          }
        },
        company: {
          fund: {
            paisa: companyFund._sum.amount || 0,
            rupees: paisaToRupees(companyFund._sum.amount || 0)
          }
        },
        monthly: {
          orders: monthlyOrders,
          revenue: {
            paisa: Math.round((monthlyRevenue._sum.total || 0) * 100),
            rupees: monthlyRevenue._sum.total || 0
          }
        }
      },
      topPerformers: topPerformerUsers.filter(Boolean),
      levelDistribution,
      users: {
        data: users.map(user => ({
          id: user.id,
          fullName: user.fullName,
          mobileNo: user.mobileNo,
          email: user.email,
          referralCode: user.referralCode,
          isActive: user.isActive,
          isKycApproved: user.isKycApproved,
          walletBalance: {
            paisa: user.walletBalance,
            rupees: paisaToRupees(user.walletBalance)
          },
          monthlyPurchase: {
            paisa: user.monthlyPurchase,
            rupees: paisaToRupees(user.monthlyPurchase)
          },
          createdAt: user.createdAt,
          sponsor: user.sponsor,
          directReferrals: user.referrals.length
        })),
        pagination: {
          page,
          limit,
          total: totalFilteredUsers,
          totalPages: Math.ceil(totalFilteredUsers / limit)
        }
      }
    }

    return NextResponse.json(serializeBigInt(mlmOverview))

  } catch (error) {
    console.error('Error fetching admin MLM data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MLM data' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}
