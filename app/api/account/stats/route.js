import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Get user statistics
    const [totalOrders, pendingOrders, cartItems, orderStats] = await Promise.all([
      // Total orders count
      prisma.order.count({
        where: { userId }
      }),
      
      // Pending orders count
      prisma.order.count({
        where: { 
          userId,
          status: { in: ['pending', 'inProcess'] }
        }
      }),
      
      // Cart items count
      prisma.cart.count({
        where: { userId }
      }),
      
      // Total spent calculation
      prisma.order.aggregate({
        where: { userId },
        _sum: { total: true }
      })
    ])

    const totalSpent = orderStats._sum.total || 0

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      cartItems,
      totalSpent
    })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}
