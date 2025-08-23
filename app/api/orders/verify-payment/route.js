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
      // Update order status to delivered
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          paymentId: razorpay_payment_id,
          paidAt: new Date() // Set paidAt when payment is verified
        },
        include: {
          user: true,
          orderProducts: {
            include: {
              product: true
            }
          }
        }
      })

      // Check if user needs MLM activation (regardless of order count)
      const user = await prisma.user.findUnique({
        where: { id: updatedOrder.userId },
        select: {
          isActive: true,
          referralCode: true
        }
      });

      // Trigger MLM activation if user is not active or has no referral code
      // This handles both first-time buyers and users with multiple purchases who weren't activated
      if (!user.isActive || !user.referralCode) {
        try {
          const origin = req?.headers?.get('origin') || process.env.NEXTAUTH_URL;
          const activateResponse = await fetch(`${origin}/api/activate-mlm-internal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: updatedOrder.userId,
              amount: updatedOrder.total,
              orderId: updatedOrder.id
            })
          })

          if (!activateResponse.ok) {
            const errorText = await activateResponse.text();
            console.error('Failed to activate MLM for user:', updatedOrder.userId, 'Error:', errorText);
          } else {
            const result = await activateResponse.json();
            console.log('MLM activation successful for user:', updatedOrder.userId, 'Result:', result);
          }
        } catch (error) {
          console.error('Error activating MLM:', error)
        }
      } else {
        console.log('User', updatedOrder.userId, 'already has MLM activated with referral code:', user.referralCode);
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
