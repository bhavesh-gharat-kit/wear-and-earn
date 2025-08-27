import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { 
  activateUserInMLM, 
  distributeJoiningCommission, 
  distributeRepurchaseCommission 
} from '@/lib/mlm-utils'


export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, userId, status, commissionAmount } = body

    // Verify this is a paid order
    if (status !== 'paid') {
      return NextResponse.json({ message: 'Order not paid yet' })
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
            referralCode: true,
            monthlyPurchase: true,
            isKycApproved: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if this is the first paid order (joining order)
    const paidOrderCount = await prisma.order.count({
      where: {
        userId: parseInt(userId),
        status: 'delivered' // or whatever represents paid status
      }
    })

    const isJoiningOrder = paidOrderCount === 1

    await prisma.$transaction(async (tx) => {
      if (isJoiningOrder) {
        // First paid order - activate user in MLM
        await activateUserInMLM(parseInt(userId), parseInt(orderId), tx)
        
        // Mark order as joining order
        await tx.order.update({
          where: { id: parseInt(orderId) },
          data: { isJoiningOrder: true }
        })
        
        // Distribute joining commission
        await distributeJoiningCommission(
          parseInt(userId), 
          parseInt(orderId), 
          commissionAmount, 
          tx
        )
        
        console.log(`User ${userId} activated in MLM with joining commission distributed`)
      } else {
        // Repurchase order - distribute repurchase commission
        await distributeRepurchaseCommission(
          parseInt(userId), 
          parseInt(orderId), 
          commissionAmount, 
          tx
        )
        
        console.log(`Repurchase commission distributed for user ${userId}, order ${orderId}`)
      }

      // Update user's monthly purchase amount
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const orderMonth = new Date(order.createdAt).getMonth()
      const orderYear = new Date(order.createdAt).getFullYear()

      if (currentMonth === orderMonth && currentYear === orderYear) {
        await tx.user.update({
          where: { id: parseInt(userId) },
          data: {
            monthlyPurchase: {
              increment: Math.round(order.total * 100) // Convert to paisa
            }
          }
        })
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `MLM processing completed for order ${orderId}`,
      isJoiningOrder
    })

  } catch (error) {
    console.error('Error processing MLM order:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Manual trigger for existing orders (admin use)
export async function PUT(request) {
  try {
    const { orderId } = await request.json()
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: true,
        orderProducts: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Calculate commission amount from order products
    const totalCommission = order.orderProducts.reduce((sum, product) => {
      return sum + (product.quantity * 50) // Assuming ₹50 commission per item
    }, 0)

    // Trigger MLM processing
    const response = await fetch(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: order.id,
        userId: order.userId,
        status: 'paid',
        commissionAmount: totalCommission
      })
    })

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error manually triggering MLM processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
