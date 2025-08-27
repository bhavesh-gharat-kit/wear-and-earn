import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 5 withdrawal requests per hour per user
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Rate limiting for withdrawal requests
    try {
      await limiter.check(5, `withdrawal_${userId}`) // 5 requests per hour per user
    } catch {
      return NextResponse.json(
        { error: 'Too many withdrawal requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { amount, method, bankDetails, notes } = await request.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      )
    }

    const withdrawalAmount = parseFloat(amount)
    const minWithdrawal = 500 // Minimum withdrawal amount ₹500

    if (withdrawalAmount < minWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ₹${minWithdrawal}` },
        { status: 400 }
      )
    }

    if (!method || !['bank_transfer', 'upi'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid withdrawal method. Use bank_transfer or upi' },
        { status: 400 }
      )
    }

    // Validate bank details for bank transfer
    if (method === 'bank_transfer') {
      const requiredFields = ['accountNumber', 'ifscCode', 'accountHolderName', 'bankName']
      const missingFields = requiredFields.filter(field => !bankDetails?.[field])
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing bank details: ${missingFields.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate UPI for UPI method
    if (method === 'upi' && !bankDetails?.upiId) {
      return NextResponse.json(
        { error: 'UPI ID is required for UPI withdrawals' },
        { status: 400 }
      )
    }

    // Get user with fresh data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletBalance: true,
        isActive: true,
        isKycApproved: true,
        fullName: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is active and KYC approved
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 403 }
      )
    }

    if (!user.isKycApproved) {
      return NextResponse.json(
        { error: 'KYC verification required for withdrawals' },
        { status: 403 }
      )
    }

    // Check for pending withdrawals (max 3 pending per user)
    const pendingWithdrawals = await prisma.withdrawal.count({
      where: {
        userId: userId,
        status: {
          in: ['pending', 'processing']
        }
      }
    })

    if (pendingWithdrawals >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 pending withdrawals allowed. Please wait for approval.' },
        { status: 400 }
      )
    }

    // Calculate total pending amount
    const pendingAmount = await prisma.withdrawal.aggregate({
      where: {
        userId: userId,
        status: {
          in: ['pending', 'processing']
        }
      },
      _sum: {
        amount: true
      }
    })

    const totalPending = pendingAmount._sum.amount || 0
    const availableBalance = user.walletBalance - totalPending

    // Check available balance
    if (availableBalance < withdrawalAmount) {
      return NextResponse.json(
        { 
          error: `Insufficient available balance. Available: ₹${availableBalance} (₹${totalPending} pending)` 
        },
        { status: 400 }
      )
    }

    // Calculate processing fee (2% with min ₹10, max ₹100)
    const feePercentage = 0.02 // 2%
    const minFee = 10
    const maxFee = 100
    const processingFee = Math.min(Math.max(withdrawalAmount * feePercentage, minFee), maxFee)
    const netAmount = withdrawalAmount - processingFee

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: userId,
        amount: withdrawalAmount,
        netAmount: netAmount,
        processingFee: processingFee,
        method: method,
        bankDetails: bankDetails,
        notes: notes || '',
        status: 'pending',
        requestIp: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })

    // Create ledger entry for tracking
    await prisma.ledger.create({
      data: {
        userId: userId,
        type: 'withdrawal_request',
        amount: -withdrawalAmount, // Negative for debit
        description: `Withdrawal request ${withdrawal.id} - ${method}`,
        ref: `WDR_${withdrawal.id}`,
        metadata: {
          withdrawalId: withdrawal.id,
          method: method,
          processingFee: processingFee,
          netAmount: netAmount
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawalId: withdrawal.id,
        amount: withdrawalAmount,
        netAmount: netAmount,
        processingFee: processingFee,
        method: method,
        status: 'pending',
        estimatedProcessingTime: method === 'upi' ? '1-2 hours' : '2-3 business days',
        createdAt: withdrawal.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
