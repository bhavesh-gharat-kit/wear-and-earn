import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Check if user is KYC approved
    if (!user.isKycApproved || !user.kycData || user.kycData.status !== 'approved') {
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
    const pendingRequest = await prisma.ledger.findFirst({
      where: {
        userId,
        type: 'withdrawal_request',
        note: { contains: 'pending' }
      }
    })

    if (pendingRequest) {
      return NextResponse.json({
        error: 'You have a pending withdrawal request. Please wait for approval.'
      }, { status: 400 })
    }

    // Create withdrawal request (not deducting balance yet)
    const withdrawalRequest = await prisma.ledger.create({
      data: {
        userId,
        type: 'withdrawal_request',
        amount: amountInPaisa,
        note: `Withdrawal request - pending admin approval. Bank: ${user.kycData.bankName}, Account: ${user.kycData.bankAccountNumber.slice(-4)}`,
        ref: `withdrawal_req_${Date.now()}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed within 24-48 hours after admin approval.',
      requestId: withdrawalRequest.id,
      amount: amount,
      status: 'pending'
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

    const withdrawals = await prisma.ledger.findMany({
      where: {
        userId,
        type: {
          in: ['withdrawal_request', 'withdrawal_debit', 'withdrawal_approved', 'withdrawal_rejected']
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.ledger.count({
      where: {
        userId,
        type: {
          in: ['withdrawal_request', 'withdrawal_debit', 'withdrawal_approved', 'withdrawal_rejected']
        }
      }
    })

    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      amount: withdrawal.amount / 100, // Convert to rupees
      type: withdrawal.type,
      status: withdrawal.note.includes('pending') ? 'pending' : 
              withdrawal.note.includes('approved') ? 'approved' : 
              withdrawal.note.includes('rejected') ? 'rejected' : 'processed',
      note: withdrawal.note,
      createdAt: withdrawal.createdAt,
      ref: withdrawal.ref
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
