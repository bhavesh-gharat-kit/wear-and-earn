import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for admin manual placement (more restrictive)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Rate limiting for manual placement (5 per minute for admin)
    try {
      await limiter.check(5, `admin_manual_placement_${session.user.id}`)
    } catch {
      return NextResponse.json(
        { error: 'Too many placement requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { userId, sponsorId, matrixLevel, reason } = await request.json()

    // Validate input
    if (!userId || !sponsorId || !matrixLevel || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sponsorId, matrixLevel, reason' },
        { status: 400 }
      )
    }

    const userIdInt = parseInt(userId)
    const sponsorIdInt = parseInt(sponsorId)
    const matrixLevelInt = parseInt(matrixLevel)

    if (isNaN(userIdInt) || isNaN(sponsorIdInt) || isNaN(matrixLevelInt)) {
      return NextResponse.json(
        { error: 'Invalid numeric values for userId, sponsorId, or matrixLevel' },
        { status: 400 }
      )
    }

    if (userIdInt === sponsorIdInt) {
      return NextResponse.json(
        { error: 'User cannot be their own sponsor' },
        { status: 400 }
      )
    }

    if (matrixLevelInt < 1 || matrixLevelInt > 5) {
      return NextResponse.json(
        { error: 'Matrix level must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Start a transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists and is not already placed in matrix
      const user = await tx.user.findUnique({
        where: { id: userIdInt },
        include: {
          sponsor: {
            select: { id: true, fullName: true, email: true }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      if (user.role !== 'user') {
        throw new Error('Only regular users can be placed in matrix')
      }

      if (user.matrixLevel && user.matrixPosition) {
        throw new Error('User is already placed in matrix')
      }

      // Check if sponsor exists and is active
      const sponsor = await tx.user.findUnique({
        where: { id: sponsorIdInt },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          matrixLevel: true,
          matrixPosition: true
        }
      })

      if (!sponsor) {
        throw new Error('Sponsor not found')
      }

      if (!sponsor.isActive) {
        throw new Error('Sponsor is not active')
      }

      // Find available position in the specified matrix level
      // Matrix follows binary tree structure: each position can have 2 children
      const maxPositionsAtLevel = Math.pow(2, matrixLevelInt - 1)
      
      // Find the next available position at this level
      const occupiedPositions = await tx.user.findMany({
        where: {
          matrixLevel: matrixLevelInt,
          matrixPosition: { not: null }
        },
        select: { matrixPosition: true },
        orderBy: { matrixPosition: 'asc' }
      })

      let availablePosition = 1
      const occupiedPositionNumbers = occupiedPositions.map(p => p.matrixPosition).sort((a, b) => a - b)
      
      for (let i = 0; i < occupiedPositionNumbers.length; i++) {
        if (availablePosition < occupiedPositionNumbers[i]) {
          break
        }
        availablePosition = occupiedPositionNumbers[i] + 1
      }

      if (availablePosition > maxPositionsAtLevel) {
        throw new Error(`No available positions at matrix level ${matrixLevelInt}`)
      }

      // Update user with matrix placement
      const updatedUser = await tx.user.update({
        where: { id: userIdInt },
        data: {
          sponsorId: sponsorIdInt,
          matrixLevel: matrixLevelInt,
          matrixPosition: availablePosition,
          placedInMatrixAt: new Date()
        },
        include: {
          sponsor: {
            select: { id: true, fullName: true, email: true }
          }
        }
      })

      // Create hierarchy record
      await tx.hierarchy.create({
        data: {
          userId: userIdInt,
          sponsorId: sponsorIdInt,
          level: 1, // Direct placement level
          matrixLevel: matrixLevelInt,
          matrixPosition: availablePosition
        }
      })

      // Create ledger entry for manual placement
      await tx.ledger.create({
        data: {
          userId: userIdInt,
          type: 'manual_placement',
          amount: 0,
          description: `Manual matrix placement - Level ${matrixLevelInt}, Position ${availablePosition}`,
          ref: `MP_${userIdInt}_${Date.now()}`,
          metadata: {
            adminId: session.user.id,
            adminName: session.user.name,
            sponsorId: sponsorIdInt,
            matrixLevel: matrixLevelInt,
            matrixPosition: availablePosition,
            reason: reason,
            placementType: 'manual'
          }
        }
      })

      // Create admin action log
      await tx.adminAction.create({
        data: {
          adminId: session.user.id,
          action: 'manual_placement',
          targetUserId: userIdInt,
          details: {
            sponsorId: sponsorIdInt,
            matrixLevel: matrixLevelInt,
            matrixPosition: availablePosition,
            reason: reason,
            previousSponsor: user.sponsor?.id || null
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      // Find users who will receive commissions from this placement
      const uplineUsers = await tx.hierarchy.findMany({
        where: {
          userId: sponsorIdInt
        },
        include: {
          sponsor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              isActive: true
            }
          }
        },
        orderBy: { level: 'asc' },
        take: 5 // Up to 5 levels
      })

      // Calculate and create commissions for upline (if applicable)
      const baseCommissionAmount = 100 // Base amount for matrix placement
      const commissionRates = [0.5, 0.3, 0.15, 0.05, 0.05] // Commission rates for levels 1-5

      for (let i = 0; i < Math.min(uplineUsers.length, 5); i++) {
        const uplineUser = uplineUsers[i]
        if (uplineUser.sponsor && uplineUser.sponsor.isActive) {
          const commissionAmount = baseCommissionAmount * commissionRates[i]
          
          // Create commission record
          await tx.commission.create({
            data: {
              userId: uplineUser.sponsor.id,
              fromUserId: userIdInt,
              amount: commissionAmount,
              level: i + 1,
              type: 'matrix_placement',
              description: `Matrix placement commission - Level ${i + 1}`,
              metadata: {
                placedUserId: userIdInt,
                matrixLevel: matrixLevelInt,
                matrixPosition: availablePosition,
                placementType: 'manual',
                adminId: session.user.id
              }
            }
          })

          // Update upline user's wallet balance
          await tx.user.update({
            where: { id: uplineUser.sponsor.id },
            data: {
              walletBalance: {
                increment: commissionAmount
              }
            }
          })

          // Create ledger entry for commission
          await tx.ledger.create({
            data: {
              userId: uplineUser.sponsor.id,
              type: 'commission',
              amount: commissionAmount,
              description: `Matrix placement commission - Level ${i + 1}`,
              ref: `MPC_${userIdInt}_${uplineUser.sponsor.id}_${Date.now()}`,
              metadata: {
                fromUserId: userIdInt,
                level: i + 1,
                placementType: 'manual',
                adminId: session.user.id
              }
            }
          })
        }
      }

      return {
        user: updatedUser,
        placement: {
          matrixLevel: matrixLevelInt,
          matrixPosition: availablePosition,
          sponsor: sponsor
        },
        commissionsGenerated: uplineUsers.length
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User manually placed in matrix successfully',
      data: {
        userId: result.user.id,
        userName: result.user.fullName,
        userEmail: result.user.email,
        sponsor: {
          id: result.placement.sponsor.id,
          name: result.placement.sponsor.fullName,
          email: result.placement.sponsor.email
        },
        placement: {
          matrixLevel: result.placement.matrixLevel,
          matrixPosition: result.placement.matrixPosition,
          placedAt: result.user.placedInMatrixAt
        },
        commissionsGenerated: result.commissionsGenerated,
        reason: reason,
        placedBy: {
          adminId: session.user.id,
          adminName: session.user.name
        }
      }
    })

  } catch (error) {
    console.error('Error in manual placement:', error)
    
    // Handle known errors
    if (error.message.includes('User not found') || 
        error.message.includes('Sponsor not found') ||
        error.message.includes('already placed') ||
        error.message.includes('No available positions') ||
        error.message.includes('not active')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error during manual placement' },
      { status: 500 }
    )
  }
}
