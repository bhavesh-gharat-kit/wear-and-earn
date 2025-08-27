import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
import { generateAndAssignReferralCode } from '@/lib/referral'


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        orders: {
          where: { paidAt: { not: null } },
          orderBy: { paidAt: 'asc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.orders.length === 0) {
      return NextResponse.json({ 
        error: 'User has no paid orders. Cannot activate MLM account.' 
      }, { status: 400 })
    }

    // Check if user is already activated
    if (user.isActive && user.referralCode) {
      return NextResponse.json({
        success: true,
        message: 'User is already activated',
        user: {
          id: user.id,
          fullName: user.fullName,
          isActive: user.isActive,
          referralCode: user.referralCode
        }
      })
    }

    // Activate the user
    const result = await prisma.$transaction(async (tx) => {
      // Generate and assign unique referral code using robust method
      let referralCode = user.referralCode;
      if (!referralCode) {
        referralCode = await generateAndAssignReferralCode(tx, user.id);
        console.log(`Generated new referral code ${referralCode} for user ${user.id}`);
      }
      
      // Update user status (referralCode already set if it was missing)
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          isActive: true
          // referralCode is already set by generateAndAssignReferralCode if it was null
        }
      })

      // Mark first order as joining order if not already marked
      const firstOrder = user.orders[0]
      await tx.order.update({
        where: { id: firstOrder.id },
        data: { isJoiningOrder: true }
      })

      // Try to activate MLM through the existing endpoint
      try {
        // We'll create a simple activation here since we're already in admin context
        // This is a basic activation without full MLM processing
        console.log(`Admin manually activated user ${user.id} with referral code ${referralCode}`)
      } catch (mlmError) {
        console.error('MLM processing error:', mlmError)
        // Continue with basic activation even if MLM processing fails
      }

      return {
        updatedUser,
        firstOrderId: firstOrder.id
      }
    })

    return NextResponse.json({
      success: true,
      message: `User ${user.fullName} activated successfully`,
      user: {
        id: result.updatedUser.id,
        fullName: result.updatedUser.fullName,
        isActive: result.updatedUser.isActive,
        referralCode: result.updatedUser.referralCode
      },
      processedOrderId: result.firstOrderId
    })

  } catch (error) {
    console.error('Fix user activation error:', error)
    return NextResponse.json({ 
      error: 'Failed to activate user',
      details: error.message 
    }, { status: 500 })
  }
}
