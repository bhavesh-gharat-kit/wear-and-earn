import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handlePaidJoining } from '@/lib/mlm-commission';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId, orderId } = await req.json();
    
    if (!userId || !orderId) {
      return NextResponse.json(
        { error: 'userId and orderId are required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Simulate payment webhook processing
    await prisma.$transaction(async (tx) => {
      // Check if this is user's first paid order (joining order)
      const paidOrdersCount = await tx.order.count({
        where: { 
          userId: parseInt(userId),
          paidAt: { not: null }
        }
      });
      
      const isJoiningOrder = paidOrdersCount === 0; // This will be the first paid order
      
      // Mark order as paid
      await tx.order.update({
        where: { id: order.id },
        data: { 
          status: 'pending',
          paidAt: new Date(),
          isJoiningOrder: isJoiningOrder
        }
      });

      if (isJoiningOrder) {
        console.log('Processing joining order - first paid order for user:', userId);
        
        // Generate referral code and activate user
        const referralCode = crypto.randomUUID().slice(0, 8).toUpperCase();
        
        await tx.user.update({
          where: { id: parseInt(userId) },
          data: { 
            isActive: true,
            referralCode: referralCode
          }
        });
        
        // Process MLM placement and commission
        await handlePaidJoining(tx, { ...order, isJoiningOrder: true });
        
        console.log('User activated with referral code:', referralCode);
      }
      
      // Update monthly purchase amount
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: {
          monthlyPurchase: { increment: order.total }
        }
      });
    });

    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        referralCode: true,
        walletBalance: true,
        monthlyPurchase: true,
        isEligibleRepurchase: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      user: updatedUser,
      order: {
        id: order.id,
        status: 'pending',
        isJoiningOrder: paidOrdersCount === 0
      }
    });

  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
