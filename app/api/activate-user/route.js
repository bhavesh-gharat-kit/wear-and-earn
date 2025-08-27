import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from "@/lib/prisma";
import { generateAndAssignReferralCode } from '@/lib/referral';


export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user and their orders
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          where: { status: 'delivered' },
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.orders.length === 0) {
      return NextResponse.json({ 
        error: 'No delivered orders found. Please make a purchase first.' 
      }, { status: 400 });
    }

    if (user.isActive && user.referralCode) {
      return NextResponse.json({
        success: true,
        message: 'User already activated',
        referralCode: user.referralCode
      });
    }

    // Activate user now
    const result = await prisma.$transaction(async (tx) => {
      // Generate referral code if not exists
      let referralCode = user.referralCode;
      if (!referralCode) {
        referralCode = await generateAndAssignReferralCode(tx, userId);
      }
      
      // Activate user
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true }
      });

      return referralCode;
    });

    return NextResponse.json({
      success: true,
      message: 'User activated successfully!',
      referralCode: result
    });

  } catch (error) {
    console.error('Activate user error:', error);
    return NextResponse.json(
      { error: 'Activation failed', details: error.message },
      { status: 500 }
    );
  }
}
