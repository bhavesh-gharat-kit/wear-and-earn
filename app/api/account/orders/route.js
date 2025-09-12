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

    // Get all orders with order products
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderProducts: {
          select: {
            title: true,
            quantity: true,
            totalPrice: true,
            sellingPrice: true
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
      deliveryCharges: order.deliveryCharges,
      deliveryChargesInRupees: order.deliveryChargesInRupees,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      paymentId: order.paymentId,
      address: order.address,
      orderNotice: order.orderNotice,
      itemCount: order.orderProducts.reduce((sum, product) => sum + product.quantity, 0),
      products: order.orderProducts
    }))

    return NextResponse.json(formattedOrders)

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  } finally {
    //await prisma.$disconnect()
  }
}
