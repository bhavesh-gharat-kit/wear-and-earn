import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycData: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is KYC approved (dual field verification)
    if (user.kycStatus !== 'APPROVED' || !user.kycData || user.kycData.status !== 'approved') {
      return NextResponse.json({ 
        error: 'KYC verification required to withdraw funds' 
      }, { status: 400 })
    }

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 })
    }

    const amountInPaisa = Math.round(amount * 100)

    // Check if user has sufficient balance
    if (user.walletBalance < amountInPaisa) {
      return NextResponse.json({ 
        error: 'Insufficient wallet balance' 
      }, { status: 400 })
    }

    // Minimum withdrawal amount check (₹500)
    if (amountInPaisa < 50000) { // 500 * 100 paisa
      return NextResponse.json({ 
        error: 'Minimum withdrawal amount is ₹500' 
      }, { status: 400 })
    }

    // Check for pending withdrawal requests
    const pendingRequest = await prisma.newWithdrawal.findFirst({
      where: {
        userId,
        status: 'requested'
      }
    })

    if (pendingRequest) {
      return NextResponse.json({
        error: 'You have a pending withdrawal request. Please wait for approval.'
      }, { status: 400 })
    }

    // Prepare bank details from KYC data
    const bankDetails = {
      bankName: user.kycData.bankName,
      accountNumber: user.kycData.bankAccountNumber,
      ifsc: user.kycData.ifscCode,
      accountHolderName: user.kycData.fullName,
      branchName: user.kycData.branchName
    }

    // Create withdrawal request and deduct balance in transaction
    const withdrawalRequest = await prisma.$transaction(async (tx) => {
      // Deduct amount from wallet balance immediately
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amountInPaisa
          }
        }
      })

      // Create withdrawal request in NewWithdrawal table
      const withdrawal = await tx.newWithdrawal.create({
        data: {
          userId,
          amount: amountInPaisa,
          status: 'requested',
          bankDetails: JSON.stringify(bankDetails)
        }
      })

      // Also create ledger entry for tracking
      await tx.ledger.create({
        data: {
          userId,
          type: 'withdrawal_debit',
          amount: -amountInPaisa, // Negative for debit
          note: `Withdrawal request #${withdrawal.id} - Amount deducted from wallet`,
          ref: `withdrawal_${withdrawal.id}`
        }
      })

      return withdrawal
    }, {
      timeout: 10000 // 10 second timeout
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Amount has been deducted from your wallet and will be processed within 24-48 hours.',
      requestId: withdrawalRequest.id,
      amount: amount,
      status: 'requested'
    })

  } catch (error) {
    console.error('Error processing withdrawal request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10

    const withdrawals = await prisma.newWithdrawal.findMany({
      where: {
        userId
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.newWithdrawal.count({
      where: {
        userId
      }
    })

    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      amount: withdrawal.amount / 100, // Convert to rupees
      status: withdrawal.status,
      bankDetails: withdrawal.bankDetails ? JSON.parse(withdrawal.bankDetails) : null,
      adminNotes: withdrawal.adminNotes,
      createdAt: withdrawal.createdAt,
      processedAt: withdrawal.processedAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching withdrawal history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
