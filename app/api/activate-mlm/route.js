import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { handlePaidJoining } from '@/lib/mlm-commission';
import { generateAndAssignReferralCode } from '@/lib/referral';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get user's current status
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Check if user has any paid orders
    const paidOrders = await prisma.order.findMany({
      where: { 
        userId,
        paidAt: { not: null }
      },
      orderBy: { paidAt: 'asc' }
    });

    if (paidOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No paid orders found. Please make a purchase first.',
        user
      });
    }

    // If user is not active but has paid orders, activate them
    if (!user.isActive || !user.referralCode) {
      await prisma.$transaction(async (transaction) => {
        // Generate and assign unique referral code using robust method
        let referralCode = user.referralCode;
        if (!referralCode) {
          referralCode = await generateAndAssignReferralCode(transaction, userId);
          console.log(`Generated new referral code ${referralCode} for user ${userId}`);
        }
        
        // Activate user (in case it wasn't active)
        await transaction.user.update({
          where: { id: userId },
          data: {
            isActive: true,
            // referralCode is already set by generateAndAssignReferralCode if it was null
          }
        });

        // Process the first order for MLM activation
        const firstOrder = paidOrders[0];
        
        // Mark first order as joining order if not already marked
        await transaction.order.update({
          where: { id: firstOrder.id },
          data: { isJoiningOrder: true }
        });

        // Process MLM commission for the first order
        await handlePaidJoining(transaction, { ...firstOrder, isJoiningOrder: true });

        console.log('Manual MLM activation completed for user:', userId, 'with referral code:', referralCode);
      });

      // Get updated user data
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
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
        processedOrders: paidOrders.length,
        firstOrderId: paidOrders[0].id
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'User is already activated',
        user,
        paidOrdersCount: paidOrders.length
      });
    }

  } catch (error) {
    console.error('Manual activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
