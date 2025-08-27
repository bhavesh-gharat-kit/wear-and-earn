import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { generateAndAssignReferralCode } from '@/lib/referral';
import { placeUserInMatrix, getGlobalRootId, bfsFindOpenSlot } from '@/lib/mlm-matrix';

/**
 * Fix User Activation API
 * Admin tool to fix users who should be active but aren't properly activated
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, forceActivation } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await fixUserActivation(parseInt(userId), forceActivation);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Fix user activation error:', error);
    return NextResponse.json(
      { error: 'Failed to fix user activation', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check users that need activation fixes
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Find users who should be active but aren't properly set up
    const problematicUsers = await findUsersNeedingActivationFix();
    
    return NextResponse.json({
      usersNeedingFix: problematicUsers,
      count: problematicUsers.length
    });
    
  } catch (error) {
    console.error('Get problematic users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users needing fix', details: error.message },
      { status: 500 }
    );
  }
}

async function findUsersNeedingActivationFix() {
  // Find users with paid orders but not active
  const usersWithOrdersButInactive = await prisma.user.findMany({
    where: {
      isActive: false,
      orders: {
        some: {
          paidAt: { not: null }
        }
      }
    },
    include: {
      orders: {
        where: { paidAt: { not: null } },
        take: 1,
        orderBy: { paidAt: 'asc' }
      }
    },
    take: 50
  });

  // Find active users without referral codes
  const activeUsersWithoutReferralCode = await prisma.user.findMany({
    where: {
      isActive: true,
      referralCode: null
    },
    take: 50
  });

  // Find active users without matrix placement
  const activeUsersWithoutMatrix = await prisma.user.findMany({
    where: {
      isActive: true,
      node: null
    },
    take: 50
  });

  return {
    inactiveWithOrders: usersWithOrdersButInactive,
    activeWithoutReferralCode: activeUsersWithoutReferralCode,
    activeWithoutMatrix: activeUsersWithoutMatrix
  };
}

async function fixUserActivation(userId, forceActivation = false) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          where: { paidAt: { not: null } },
          orderBy: { paidAt: 'asc' }
        },
        node: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const fixes = [];
    let activationRequired = false;

    // Check if user has paid orders
    if (user.orders.length === 0 && !forceActivation) {
      return {
        success: false,
        message: 'User has no paid orders. Use forceActivation=true to activate anyway.',
        user: { id: user.id, fullName: user.fullName }
      };
    }

    // Fix 1: Generate referral code if missing
    if (!user.referralCode) {
      const referralCode = await generateAndAssignReferralCode(tx, userId);
      fixes.push(`Generated referral code: ${referralCode}`);
    }

    // Fix 2: Activate user if inactive but has paid orders
    if (!user.isActive && (user.orders.length > 0 || forceActivation)) {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      fixes.push('Activated user account');
      activationRequired = true;
    }

    // Fix 3: Place in matrix if missing
    if (!user.node && user.isActive) {
      const rootId = await getGlobalRootId(tx);
      const placement = await bfsFindOpenSlot(rootId);
      
      await placeUserInMatrix(tx, userId, placement.parentId, placement.position);
      fixes.push(`Placed in matrix at position ${placement.position} under user ${placement.parentId}`);
    }

    // Fix 4: Mark first order as joining order if needed
    if (user.orders.length > 0 && activationRequired) {
      const firstOrder = user.orders[0];
      
      const existingJoiningOrder = await tx.order.findFirst({
        where: { 
          userId: userId,
          isJoiningOrder: true 
        }
      });

      if (!existingJoiningOrder) {
        await tx.order.update({
          where: { id: firstOrder.id },
          data: { isJoiningOrder: true }
        });
        fixes.push(`Marked order ${firstOrder.id} as joining order`);
      }
    }

    // Get updated user data
    const updatedUser = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        referralCode: true,
        walletBalance: true
      }
    });

    return {
      success: true,
      message: `Applied ${fixes.length} fixes to user`,
      fixes,
      user: updatedUser
    };
  });
}
