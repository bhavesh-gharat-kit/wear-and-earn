import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"

// Get all withdrawal requests
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'

    const whereClause = status === 'all' ? {} : { status: status }

    const withdrawals = await prisma.newWithdrawal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNo: true,
            walletBalance: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w.id.toString(),
        amount: w.amount,
        amountRs: w.amount / 100,
        status: w.status,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        adminNotes: w.adminNotes,
        bankDetails: w.bankDetails ? JSON.parse(w.bankDetails) : null,
        user: {
          id: w.user.id,
          fullName: w.user.fullName,
          email: w.user.email,
          mobileNo: w.user.mobileNo,
          walletBalance: w.user.walletBalance,
          walletBalanceRs: w.user.walletBalance / 100
        }
      }))
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
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

// Approve/Reject withdrawal
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { withdrawalId, action, adminNotes } = await request.json()
    
    if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get withdrawal request
      const withdrawal = await tx.newWithdrawal.findUnique({
        where: { id: parseInt(withdrawalId) },
        include: { user: true }
      });

      if (!withdrawal) {
        throw new Error('Withdrawal request not found');
      }

      if (withdrawal.status !== 'requested') {
        throw new Error('Withdrawal already processed');
      }

      if (action === 'approve') {
        // Approve withdrawal
        const updatedWithdrawal = await tx.newWithdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'approved',
            adminNotes: adminNotes,
            processedAt: new Date()
          }
        });

        // Update wallet transaction
        await tx.wallet.updateMany({
          where: {
            userId: withdrawal.userId,
            reference: `withdrawal_${withdrawal.id}`,
            type: 'withdrawal'
          },
          data: {
            status: 'completed',
            processedAt: new Date()
          }
        });

        return { updatedWithdrawal, action: 'approved' };

      } else {
        // Reject withdrawal - return money to wallet
        const updatedWithdrawal = await tx.newWithdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'rejected',
            adminNotes: adminNotes,
            processedAt: new Date()
          }
        });

        // Return money to user wallet
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            walletBalance: { increment: withdrawal.amount }
          }
        });

        // Update wallet transaction
        await tx.wallet.updateMany({
          where: {
            userId: withdrawal.userId,
            reference: `withdrawal_${withdrawal.id}`,
            type: 'withdrawal'
          },
          data: {
            status: 'cancelled',
            processedAt: new Date()
          }
        });

        // Create refund wallet entry
        await tx.wallet.create({
          data: {
            userId: withdrawal.userId,
            type: 'withdrawal',
            amount: withdrawal.amount, // Positive for refund
            status: 'completed',
            reference: `refund_${withdrawal.id}`,
            description: `Withdrawal rejected - Amount refunded`
          }
        });

        return { updatedWithdrawal, action: 'rejected' };
      }
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}d successfully`,
      data: result
    });

  } catch (error) {
    console.error('Process withdrawal error:', error);
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
