import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
import { serializeOrderData } from '@/lib/serialization-utils'


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

    // Get recent orders with order products
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        orderProducts: {
          select: {
            title: true,
            quantity: true,
            totalPrice: true
          }
        }
      }
    })

    // Serialize the orders to handle BigInt values
    const serializedOrders = orders.map(serializeOrderData);

    // Format the orders data
    const formattedOrders = serializedOrders.map(order => ({
      id: order.id,
      status: order.status,
      total: order.total,
      totalInRupees: order.totalInRupees,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      itemCount: order.orderProducts.reduce((sum, product) => sum + product.quantity, 0),
      products: order.orderProducts.slice(0, 3) // Show first 3 products
    }))

    return NextResponse.json(formattedOrders)

  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent orders' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}
