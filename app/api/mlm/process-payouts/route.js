import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id);
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user session' },
        { status: 400 }
      );
    }

    // Process all pending payouts for this user
    const result = await prisma.$transaction(async (tx) => {
      // Get all due payouts
      const duePayouts = await tx.selfPayoutSchedule.findMany({
        where: {
          userId,
          status: 'scheduled',
          dueAt: { lte: new Date() }
        }
      });

      if (duePayouts.length === 0) {
        return { processed: 0, totalAmount: 0 };
      }

      // Calculate total amount
      const totalAmount = duePayouts.reduce((sum, payout) => sum + payout.amount, 0);

      // Update payouts as processed
      await tx.selfPayoutSchedule.updateMany({
        where: {
          id: { in: duePayouts.map(p => p.id) }
        },
        data: {
          status: 'processed',
          processedAt: new Date()
        }
      });

      // Create ledger entries
      for (const payout of duePayouts) {
        await tx.ledger.create({
          data: {
            userId,
            type: 'self_commission',
            amount: payout.amount,
            ref: `self-payout:${payout.id}`,
            note: `Self commission payout from order ${payout.orderId}`
          }
        });
      }

      // Update wallet balance
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: totalAmount }
        }
      });

      return { 
        processed: duePayouts.length, 
        totalAmount: totalAmount / 100 // Convert to rupees
      };
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} payouts totaling ₹${result.totalAmount}`,
      data: result
    });

  } catch (error) {
    console.error('Error processing payouts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payouts' },
      { status: 500 }
    );
  }
}
