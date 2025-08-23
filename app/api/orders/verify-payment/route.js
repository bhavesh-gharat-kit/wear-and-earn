import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json()

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      // Update order status to completed
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'completed',
          paymentId: razorpay_payment_id,
          paymentStatus: 'completed'
        },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      })

      // Trigger MLM activation if this is user's first completed order
      const completedOrdersCount = await prisma.order.count({
        where: {
          userId: updatedOrder.userId,
          status: 'completed'
        }
      })

  if (completedOrdersCount === 1) {
        // This is the first completed order, activate MLM
        try {
          const origin = req?.headers?.get('origin') || process.env.NEXTAUTH_URL;
          const activateResponse = await fetch(`${origin}/api/activate-mlm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: updatedOrder.userId,
              amount: updatedOrder.amount,
              orderId: updatedOrder.id
            })
          })

          if (!activateResponse.ok) {
            console.error('Failed to activate MLM for user:', updatedOrder.userId)
          }
        } catch (error) {
          console.error('Error activating MLM:', error)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully',
        order: updatedOrder
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
