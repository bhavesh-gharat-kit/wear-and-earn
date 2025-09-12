import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for admin KYC actions
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting
    try {
      await limiter.check(15, `admin_kyc_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const resolvedParams = await params
    const userId = parseInt(resolvedParams.userId)
    const { action, reason, rejectionReasons } = await request.json()

    // Validate input
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !rejectionReasons) {
      return NextResponse.json(
        { error: 'Rejection reasons required when rejecting KYC' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Admin reason is required' },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user with KYC details
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          kycData: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      if (user.role !== 'user') {
        throw new Error('KYC can only be processed for regular users')
      }

      if (!user.kycData) {
        throw new Error('No KYC data found for this user')
      }

      if (user.kycStatus === 'APPROVED' && action === 'approve') {
        throw new Error('User KYC is already approved')
      }

      // Get current KYC status
      const currentKycStatus = user.kycData.status

      if (currentKycStatus === 'approved' && action === 'approve') {
        throw new Error('KYC is already approved')
      }

      if (currentKycStatus === 'rejected' && action === 'reject') {
        throw new Error('KYC is already rejected')
      }

      // Update user KYC status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          kycStatus: action === 'approve' ? 'APPROVED' : 'REJECTED'
        },
        include: {
          kycData: true
        }
      })

      // Update KYC data status
      const updatedKycData = await tx.kycData.update({
        where: { userId: userId },
        data: {
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewedAt: new Date(),
          reviewNote: reason
        }
      })

      // Create ledger entry for audit trail
      await tx.ledger.create({
        data: {
          user: { connect: { id: userId } },
          type: `kyc_${action}`,
          amount: 0,
          description: `KYC ${action} by admin - ${reason}`,
          ref: `KYC_${action.toUpperCase()}_${userId}_${Date.now()}`
        }
      })

      // If approved, create welcome bonus (optional)
      if (action === 'approve') {
        const welcomeBonus = 50 // ₹50 welcome bonus for KYC approval
        
        await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: {
              increment: welcomeBonus
            }
          }
        })

        await tx.ledger.create({
          data: {
            user: { connect: { id: userId } },
            type: 'kyc_bonus',
            amount: welcomeBonus,
            description: 'KYC approval welcome bonus',
            ref: `KYC_BONUS_${userId}_${Date.now()}`
          }
        })
      }

      // Send notification (you can implement email/SMS notification here)
      // await sendKycNotification(user.email, action, reason, rejectionReasons)

      return {
        user: updatedUser,
        kycData: updatedKycData,
        welcomeBonus: action === 'approve' ? 50 : 0
      }
    })

    return NextResponse.json({
      success: true,
      message: `KYC ${action}d successfully`,
      data: {
        userId: result.user.id,
        userName: result.user.fullName,
        userEmail: result.user.email,
        kycStatus: {
          status: result.user.kycStatus,
          kycDataStatus: result.kycData.status,
          reviewedAt: result.kycData.reviewedAt,
          reviewedBy: session.user.name
        },
        action: {
          type: action,
          reason: reason,
          rejectionReasons: action === 'reject' ? rejectionReasons : null,
          processedBy: {
            adminId: session.user.id,
            adminName: session.user.name
          },
          processedAt: new Date()
        },
        bonus: action === 'approve' ? {
          amount: result.welcomeBonus,
          description: 'KYC approval welcome bonus',
          newWalletBalance: result.user.walletBalance
        } : null
      }
    })

  } catch (error) {
    console.error('Error processing KYC:', error)
    
    // Handle known errors
    if (error.message.includes('User not found') ||
        error.message.includes('No KYC documents') ||
        error.message.includes('already approved') ||
        error.message.includes('already rejected') ||
        error.message.includes('only be processed for')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error during KYC processing' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch KYC details for review
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting
    try {
      await limiter.check(30, `admin_kyc_view_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const userId = parseInt(params.userId)

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Get user with KYC details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocument: true,
        adminActions: {
          where: {
            action: {
              in: ['kyc_approve', 'kyc_reject']
            }
          },
          include: {
            admin: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.kycDocument) {
      return NextResponse.json({ error: 'No KYC documents found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          isKycApproved: user.isKycApproved,
          kycApprovedAt: user.kycApprovedAt,
          createdAt: user.createdAt
        },
        kycDocument: {
          id: user.kycDocument.id,
          documentType: user.kycDocument.documentType,
          documentNumber: user.kycDocument.documentNumber,
          frontImageUrl: user.kycDocument.frontImageUrl,
          backImageUrl: user.kycDocument.backImageUrl,
          selfieUrl: user.kycDocument.selfieUrl,
          status: user.kycDocument.status,
          submittedAt: user.kycDocument.createdAt,
          reviewedAt: user.kycDocument.reviewedAt,
          adminNotes: user.kycDocument.adminNotes,
          rejectionReasons: user.kycDocument.rejectionReasons
        },
        history: user.adminActions.map(action => ({
          id: action.id,
          action: action.action,
          admin: action.admin.fullName,
          details: action.details,
          createdAt: action.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching KYC details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
