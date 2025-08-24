import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handlePaidJoining } from '@/lib/mlm-commission';
import { generateAndAssignReferralCode } from '@/lib/referral';

const prisma = new PrismaClient();

// Internal MLM activation API - no session required (for server-side calls)
export async function POST(req) {
  try {
    console.log('🚀 MLM activation started');
    
    const body = await req.json();
    const { userId, orderId, amount } = body;

    console.log('MLM activation request:', { userId, orderId, amount });

    if (!userId) {
      console.log('❌ Missing user ID');
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      console.log('❌ Invalid user ID:', userId);
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get user's current status
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        referralCode: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has any delivered orders
    const deliveredOrders = await prisma.order.findMany({
      where: { 
        userId: userIdInt,
        status: 'delivered'
      },
      orderBy: { createdAt: 'asc' } // Order by creation date, not payment date
    });

    if (deliveredOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No delivered orders found.',
        user
      });
    }

    // If user is not active but has delivered orders, activate them
    if (!user.isActive || !user.referralCode) {
      console.log(`Activating user ${userIdInt} who has ${deliveredOrders.length} delivered orders but no MLM activation`);
      
      await prisma.$transaction(async (tx) => {
        // Generate and assign unique referral code using robust method
        let referralCode = user.referralCode;
        if (!referralCode) {
          referralCode = await generateAndAssignReferralCode(tx, userIdInt);
          console.log(`Generated new referral code ${referralCode} for user ${userIdInt}`);
        }
        
        // Activate user (in case it wasn't active)
        await tx.user.update({
          where: { id: userIdInt },
          data: {
            isActive: true,
            // referralCode is already set by generateAndAssignReferralCode if it was null
          }
        });

        // Find the first order that should be marked as joining order
        const firstOrder = deliveredOrders[0];
        
        // Check if any order is already marked as joining order
        const existingJoiningOrder = await tx.order.findFirst({
          where: { 
            userId: userIdInt,
            isJoiningOrder: true 
          }
        });

        // If no existing joining order, mark the first delivered order as joining order
        if (!existingJoiningOrder) {
          await tx.order.update({
            where: { id: firstOrder.id },
            data: { 
              isJoiningOrder: true,
              paidAt: firstOrder.paidAt || new Date() // Ensure paidAt is set
            }
          });

          // Process MLM commission for the first order
          await handlePaidJoining(tx, { 
            ...firstOrder, 
            isJoiningOrder: true,
            paidAt: firstOrder.paidAt || new Date()
          });

          console.log(`MLM activation completed for user ${userIdInt} with referral code ${referralCode}. Marked order ${firstOrder.id} as joining order.`);
        } else {
          console.log(`User ${userIdInt} already has a joining order (${existingJoiningOrder.id}), just updating activation status.`);
        }
      });

      // Get updated user data
      const updatedUser = await prisma.user.findUnique({
        where: { id: userIdInt },
        select: {
          id: true,
          fullName: true,
          isActive: true,
          referralCode: true,
          walletBalance: true,
          monthlyPurchase: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'MLM activation completed successfully!',
        user: updatedUser,
        processedOrders: deliveredOrders.length,
        firstOrderId: deliveredOrders[0].id
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'User is already activated',
        user,
        deliveredOrdersCount: deliveredOrders.length
      });
    }

  } catch (error) {
    console.error('Internal MLM activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
