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
        size: true,
        color: true,
        quantity: true,
        totalPrice: true,
        sellingPrice: true,

        product: {
          select: {
            images: {
              select: {
                imageUrl: true,
                color: true
              }
            }
          }
        }
      }
    }
  }
})


    // Serialize the orders to handle BigInt values
    const serializedOrders = orders.map(serializeOrderData);

    // Format the orders data
   const formattedOrders = orders.map(order => ({
  ...order,
  products: order.orderProducts.map(op => {
    const matchingImage =
      op.product.images.find(img => img.color === op.color)
      || op.product.images[0]
      || null

    return {
      title: op.title,
      size: op.size,
      color: op.color,
      quantity: op.quantity,
      totalPrice: op.totalPrice,
      sellingPrice: op.sellingPrice,
      image: matchingImage?.imageUrl || null
    }
  })
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
