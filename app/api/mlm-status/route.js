import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from "@/lib/prisma";
import { isRepurchaseEligible } from '@/lib/mlm-matrix';


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

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
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

    // Get all orders
    const allOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total: true,
        status: true,
        isJoiningOrder: true,
        paidAt: true,
        createdAt: true
      }
    });

    // Get paid orders count
    const paidOrdersCount = await prisma.order.count({
      where: { 
        userId,
        paidAt: { not: null }
      }
    });

    // Get direct referrals
    const directReferrals = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: {
        id: true,
        fullName: true,
        isActive: true,
        createdAt: true
      }
    });

    // Check eligibility for each direct referral
    const directsWithSubTeam = await Promise.all(
      directReferrals.map(async (direct) => {
        const subTeamCount = await prisma.user.count({
          where: { sponsorId: direct.id }
        });
        return {
          ...direct,
          subTeamCount
        };
      })
    );

    // Calculate 3-3 rule eligibility
    const qualifiedDirects = directsWithSubTeam.filter(d => d.subTeamCount >= 3);
    const is33RuleEligible = qualifiedDirects.length >= 3;

    // Get ledger entries
    const ledgerEntries = await prisma.ledger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        note: true,
        levelDepth: true,
        createdAt: true
      }
    });

    // Get pending payouts
    const pendingPayouts = await prisma.selfPayoutSchedule.findMany({
      where: { userId },
      orderBy: { dueAt: 'asc' },
      select: {
        id: true,
        amount: true,
        dueAt: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        status: {
          isActive: user.isActive,
          hasReferralCode: !!user.referralCode,
          paidOrdersCount,
          hasActivatedMLM: user.isActive && !!user.referralCode,
          is33RuleEligible,
          isRepurchaseEligible: user.isEligibleRepurchase
        },
        orders: allOrders,
        team: {
          directReferrals: directReferrals.length,
          directsWithSubTeam,
          qualifiedDirects: qualifiedDirects.length
        },
        wallet: {
          balance: user.walletBalance,
          pendingPayouts
        },
        recentActivity: ledgerEntries,
        analysis: {
          needsFirstPurchase: paidOrdersCount === 0,
          canEarnRepurchaseCommission: is33RuleEligible,
          activationStatus: user.isActive ? 'Active' : 'Inactive',
          referralStatus: user.referralCode ? `Active (${user.referralCode})` : 'Not Generated'
        }
      }
    });

  } catch (error) {
    console.error('MLM status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
