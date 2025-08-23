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

    // Minimum withdrawal amount check (₹100)
    if (amountInPaisa < 10000) { // 100 * 100 paisa
      return NextResponse.json({ 
        error: 'Minimum withdrawal amount is ₹100' 
      }, { status: 400 })
    }

    // Process withdrawal in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct amount from wallet
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: {
            decrement: amountInPaisa
          }
        }
      })

      // Create ledger entry for withdrawal
      const ledgerEntry = await tx.ledger.create({
        data: {
          userId: user.id,
          type: 'withdrawal_debit',
          amount: -amountInPaisa, // Negative for debit
          note: `Withdrawal to bank account: ${user.kycData.bankAccountNumber.slice(-4)}`,
          ref: `withdrawal_${Date.now()}`
        }
      })

      return { updatedUser, ledgerEntry }
    })

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      newBalance: result.updatedUser.walletBalance,
      withdrawalAmount: amountInPaisa,
      transactionId: result.ledgerEntry.id
    })

  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
