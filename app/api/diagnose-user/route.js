import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNo: true,
        isActive: true,
        referralCode: true,
        sponsorId: true,
        isKycApproved: true,
        walletBalance: true,
        monthlyPurchase: true,
        isEligibleRepurchase: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all orders for this user
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total: true,
        status: true,
        isJoiningOrder: true,
        paidAt: true,
        createdAt: true,
        gatewayOrderId: true
      }
    });

    // Count paid orders
    const paidOrdersCount = orders.filter(order => order.paidAt !== null).length;

    // Generate expected referral link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    const expectedReferralLink = user.referralCode ? 
      `${baseUrl}/login-register?spid=${user.id}` : null;

    // Check what the MLM profile API returns
    const mlmProfileResponse = await fetch(`${baseUrl}/api/account/mlm-profile`, {
      headers: {
        'Cookie': `next-auth.session-token=${session.sessionToken}` // This won't work in practice, but shows the idea
      }
    });

    return NextResponse.json({
      success: true,
      user,
      orders,
      analysis: {
        hasReferralCode: !!user.referralCode,
        isActive: user.isActive,
        paidOrdersCount,
        shouldHaveReferralCode: paidOrdersCount > 0,
        referralCodeStatus: user.referralCode ? 'Generated' : 'Not Generated',
        activationStatus: user.isActive ? 'Active' : 'Inactive',
        expectedReferralLink,
        needsActivation: paidOrdersCount > 0 && (!user.isActive || !user.referralCode)
      },
      recommendations: {
        action: paidOrdersCount === 0 ? 'Make a purchase' : 
                !user.isActive || !user.referralCode ? 'Use manual activation' : 
                'All good - referral link should be available',
        reason: paidOrdersCount === 0 ? 'No purchases made yet' :
                !user.isActive || !user.referralCode ? 'MLM not activated despite having paid orders' :
                'User is properly activated'
      }
    });

  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
