import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Find users who have delivered/paid orders but no referral code or are inactive
    const usersWithIssues = await prisma.user.findMany({
      where: {
        AND: [
          { orders: { some: { 
            OR: [
              { status: 'delivered' },
              { paidAt: { not: null } }
            ]
          }}},
          {
            OR: [
              { referralCode: null },
              { referralCode: '' },
              { isActive: false }
            ]
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNo: true,
        referralCode: true,
        isActive: true,
        createdAt: true,
        orders: {
          where: {
            OR: [
              { status: 'delivered' },
              { paidAt: { not: null } }
            ]
          },
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            createdAt: true,
            isJoiningOrder: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Also get total stats
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const usersWithReferralCodes = await prisma.user.count({ 
      where: { 
        referralCode: { not: null },
        referralCode: { not: '' }
      } 
    });

    const summary = usersWithIssues.map(user => ({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNo: user.mobileNo,
      referralCode: user.referralCode,
      isActive: user.isActive,
      registeredAt: user.createdAt,
      totalOrders: user.orders.length,
      deliveredOrders: user.orders.filter(o => o.status === 'delivered').length,
      paidOrders: user.orders.filter(o => o.paidAt !== null).length,
      firstOrderDate: user.orders[0]?.createdAt,
      firstOrderAmount: user.orders[0]?.amount,
      hasJoiningOrder: user.orders.some(o => o.isJoiningOrder),
      issue: !user.referralCode ? 'NO_REFERRAL_CODE' : !user.isActive ? 'INACTIVE' : 'OTHER'
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        usersWithReferralCodes,
        usersWithIssues: usersWithIssues.length
      },
      problematicUsers: summary
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
