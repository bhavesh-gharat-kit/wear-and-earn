import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from "@/lib/prisma";


export async function POST(req) {
  try {
    console.log('🔍 Payment verification started');
    
    const body = await req.json();
    console.log('Request body keys:', Object.keys(body));
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.log('❌ Missing RAZORPAY_KEY_SECRET environment variable');
      return NextResponse.json(
        { success: false, message: 'Payment configuration error' },
        { status: 500 }
      );
    }

    console.log('✅ Environment variables and fields validated');

    // Verify the payment signature
    const signatureBody = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody.toString())
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    console.log('🔐 Payment signature verification:', isAuthentic ? 'PASSED' : 'FAILED');

    if (isAuthentic) {
      console.log('📝 Updating order status to inProcess');
      
      // Process everything in a single transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update order status to inProcess (payment confirmed, awaiting fulfillment)  
        const updatedOrder = await tx.order.update({
          where: { id: parseInt(orderId) },
          data: {
            status: 'inProcess', // Changed from 'confirmed' to 'inProcess' (valid enum value)
            paymentId: razorpay_payment_id,
            paidAt: new Date() // Set paidAt when payment is verified
          },
          include: {
            user: true,
            orderProducts: true // Remove the nested include for product since it doesn't exist
          }
        });

        console.log('✅ Order updated successfully:', updatedOrder.id);

        // Check if user needs MLM activation (regardless of order count)
        const user = await tx.user.findUnique({
          where: { id: updatedOrder.userId },
          select: {
            isActive: true,
            referralCode: true
          }
        });

        console.log('👤 User status - Active:', user.isActive, 'Has referral code:', !!user.referralCode);

        // Trigger MLM activation if user is not active or has no referral code
        if (!user.isActive || !user.referralCode) {
          console.log('🚀 Triggering NEW POOL MLM activation for user:', updatedOrder.userId);
          
          try {
            const { processPoolMLMOrder } = await import('@/lib/pool-mlm-system');
            const mlmResult = await processPoolMLMOrder(tx, updatedOrder);
            console.log('✅ Pool MLM activation successful for user:', updatedOrder.userId, mlmResult);
          } catch (error) {
            console.error('❌ Error in Pool MLM activation:', error.message);
            throw error; // Re-throw to rollback transaction
          }
        } else {
          console.log('ℹ️ User', updatedOrder.userId, 'already has MLM activated with referral code:', user.referralCode);
          
          // Process with NEW POOL SYSTEM for existing users
          console.log('🏊 Processing with new Pool MLM system for user:', updatedOrder.userId);
          try {
            const { processPoolMLMOrder } = await import('@/lib/pool-mlm-system');
            const mlmResult = await processPoolMLMOrder(tx, updatedOrder);
            console.log('✅ Pool MLM processing completed:', mlmResult);
          } catch (error) {
            console.error('❌ Error processing Pool MLM:', error.message);
            throw error; // Re-throw to rollback transaction
          }
        }

        return updatedOrder;
      });

      const updatedOrder = result;

      console.log('🎉 Payment verification completed successfully');

      // Convert BigInt values to strings for JSON serialization
      const orderForResponse = {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentId: updatedOrder.paymentId,
        paidAt: updatedOrder.paidAt,
        total: updatedOrder.total,
        userId: updatedOrder.userId,
        user: {
          id: updatedOrder.user.id,
          fullName: updatedOrder.user.fullName,
          email: updatedOrder.user.email
        },
        orderProducts: updatedOrder.orderProducts.map(op => ({
          id: op.id.toString(), // Convert BigInt to string
          title: op.title,
          quantity: op.quantity,
          totalPrice: op.totalPrice
        }))
      };

      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully',
        order: orderForResponse
      })
    } else {
      console.log('❌ Payment signature verification failed');
      return NextResponse.json(
        { success: false, message: 'Payment verification failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('💥 Payment verification error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
