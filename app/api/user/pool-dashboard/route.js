import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Get user with MLM data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNo: true,
        referralCode: true,
        isActive: true,
        level: true,
        teamCount: true,
        directTeams: true,
        walletBalance: true,
        kycStatus: true
      }
    });

    // Get purchase history
    const purchases = await prisma.purchase.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        product: { select: { title: true } },
        order: { select: { id: true, total: true, createdAt: true } }
      }
    });

    // Get wallet transactions
    const walletTransactions = await prisma.wallet.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get pending self income installments
    const pendingInstallments = await prisma.selfIncomeInstallment.findMany({
      where: { 
        userId: userId,
        status: 'scheduled'
      },
      orderBy: { dueDate: 'asc' },
      include: {
        purchase: {
          include: {
            product: { select: { title: true } }
          }
        }
      }
    });

    // Get teams created by this user
    const teams = await prisma.team.findMany({
      where: { userId: userId },
      include: {
        members: {
          include: {
            user: { select: { fullName: true, createdAt: true } }
          }
        }
      }
    });

    // Get pool distributions received
    const poolDistributions = await prisma.poolDistribution.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        pool: { select: { distributedAt: true } }
      }
    });

    // Get downline count (direct referrals)
    const directReferrals = await prisma.user.count({
      where: { sponsorId: userId }
    });

    // Calculate next level requirements
    const levelRequirements = {
      1: 1, 2: 9, 3: 27, 4: 81, 5: 243
    };
    
    let nextLevel = user.level + 1;
    let teamsNeeded = 0;
    
    if (nextLevel <= 5) {
      teamsNeeded = levelRequirements[nextLevel] - user.teamCount;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          walletBalanceRs: user.walletBalance / 100,
          nextLevel: nextLevel <= 5 ? nextLevel : null,
          teamsNeededForNextLevel: Math.max(0, teamsNeeded)
        },
        stats: {
          totalPurchases: purchases.length,
          directReferrals,
          completedTeams: user.directTeams,
          totalTeams: user.teamCount,
          pendingInstallments: pendingInstallments.length,
          poolDistributionsReceived: poolDistributions.length
        },
        recentActivity: {
          purchases: purchases.map(p => ({
            id: p.id,
            type: p.type,
            amount: p.mlmAmount,
            amountRs: p.mlmAmount / 100,
            productTitle: p.product.title,
            orderTotal: p.order.total,
            createdAt: p.createdAt
          })),
          walletTransactions: walletTransactions.map(wt => ({
            id: wt.id.toString(),
            type: wt.type,
            amount: wt.amount,
            amountRs: wt.amount / 100,
            status: wt.status,
            description: wt.description,
            createdAt: wt.createdAt
          })),
          pendingInstallments: pendingInstallments.map(pi => ({
            id: pi.id.toString(),
            amount: pi.amount,
            amountRs: pi.amount / 100,
            weekNumber: pi.weekNumber,
            dueDate: pi.dueDate,
            productTitle: pi.purchase.product.title
          }))
        },
        teams: teams.map(team => ({
          id: team.id,
          size: team.teamSize,
          isComplete: team.isComplete,
          completedAt: team.completedAt,
          members: team.members.map(member => ({
            name: member.user.fullName,
            joinedAt: member.joinedAt
          }))
        })),
        poolDistributions: poolDistributions.map(pd => ({
          id: pd.id.toString(),
          level: pd.level,
          amount: pd.amount,
          amountRs: pd.amount / 100,
          distributedAt: pd.pool.distributedAt
        }))
      }
    });

  } catch (error) {
    console.error('Pool dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
