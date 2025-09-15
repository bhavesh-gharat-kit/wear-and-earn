import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"

// Request withdrawal
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { amount, bankDetails } = await request.json()
    
    if (!amount || amount < 300) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹300' }, { status: 400 })
    }

    const amountPaisa = Math.floor(amount * 100);

    // Check user eligibility
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        kycStatus: true,
        kycData: {
          select: {
            status: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.kycStatus !== 'APPROVED' || user.kycData?.status !== 'approved') {
      return NextResponse.json({ error: 'KYC approval required for withdrawal' }, { status: 400 })
    }

    if (user.walletBalance < amountPaisa) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
    }

    // Create withdrawal request
    const withdrawal = await prisma.$transaction(async (tx) => {
      // Create withdrawal record
      const newWithdrawal = await tx.newWithdrawal.create({
        data: {
          userId: userId,
          amount: amountPaisa,
          bankDetails: JSON.stringify(bankDetails),
          status: 'requested'
        }
      });

      // Deduct from wallet balance (hold the amount)
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: amountPaisa }
        }
      });

      // Create wallet transaction record
      await tx.wallet.create({
        data: {
          userId: userId,
          type: 'withdrawal',
          amount: -amountPaisa, // Negative for withdrawal
          status: 'pending',
          reference: `withdrawal_${newWithdrawal.id}`,
          description: `Withdrawal request - ₹${amount}`
        }
      });

      return newWithdrawal;
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal.id.toString(),
        amount: withdrawal.amount,
        amountRs: withdrawal.amount / 100,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
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

// Get withdrawal history
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    const withdrawals = await prisma.newWithdrawal.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
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
        adminNotes: w.adminNotes
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
