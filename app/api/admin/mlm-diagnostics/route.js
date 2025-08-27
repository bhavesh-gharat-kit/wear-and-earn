import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find users who have paid orders but are not activated
    const problemUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            AND: [
              { orders: { some: { paidAt: { not: null } } } },
              { isActive: false }
            ]
          },
          {
            AND: [
              { orders: { some: { paidAt: { not: null } } } },
              { referralCode: null }
            ]
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNo: true,
        isActive: true,
        referralCode: true,
        createdAt: true,
        orders: {
          where: { paidAt: { not: null } },
          select: { id: true, amount: true, paidAt: true }
        }
      }
    })

    // Add computed fields
    const problemUsersWithStats = problemUsers.map(user => ({
      ...user,
      paidOrdersCount: user.orders.length,
      totalPaidAmount: user.orders.reduce((sum, order) => sum + order.amount, 0)
    }))

    // Get summary statistics
    const totalUsers = await prisma.user.count()
    
    const usersWithPaidOrders = await prisma.user.count({
      where: {
        orders: { some: { paidAt: { not: null } } }
      }
    })

    const inactiveWithPaidOrders = await prisma.user.count({
      where: {
        AND: [
          { orders: { some: { paidAt: { not: null } } } },
          { isActive: false }
        ]
      }
    })

    const missingReferralCode = await prisma.user.count({
      where: {
        AND: [
          { orders: { some: { paidAt: { not: null } } } },
          { referralCode: null }
        ]
      }
    })

    // Check for matrix issues (users who are active but don't have matrix nodes)
    const activeUsersWithoutMatrix = await prisma.user.count({
      where: {
        AND: [
          { isActive: true },
          { node: null }
        ]
      }
    })

    // Check for commission issues (orders that should have generated commissions but didn't)
    const ordersWithoutCommissions = await prisma.order.count({
      where: {
        AND: [
          { paidAt: { not: null } },
          { 
            user: { 
              isActive: true,
              orders: { some: { paidAt: { not: null } } }
            }
          },
          {
            OR: [
              { ledgerEntries: { none: {} } },
              { ledgerEntries: { none: { type: 'COMMISSION' } } }
            ]
          }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      usersWithPaidOrders,
      inactiveWithPaidOrders,
      missingReferralCode,
      matrixIssues: activeUsersWithoutMatrix,
      commissionIssues: ordersWithoutCommissions,
      problemUsers: problemUsersWithStats,
      summary: {
        totalUsers,
        totalProblems: problemUsersWithStats.length,
        criticalIssues: inactiveWithPaidOrders + missingReferralCode
      }
    })
  } catch (error) {
    console.error('MLM diagnostics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch diagnostics data' 
    }, { status: 500 })
  }
}
