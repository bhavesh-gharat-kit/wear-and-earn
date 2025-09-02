import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'
import { generateReferralLink } from '@/lib/url-utils'

// Rate limiting: 30 requests per minute per user
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
})

export async function GET(request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    try {
      await limiter.check(30, ip) // 30 requests per minute
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    
    // Get user with referral data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        isActive: true,
        fullName: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get direct referrals count
    const directReferrals = await prisma.hierarchy.count({
      where: { 
        parentId: userId,
        depth: 1
      }
    })

    // Get total network size (all levels)
    const totalNetwork = await prisma.hierarchy.count({
      where: { parentId: userId }
    })

    // Get total earnings from commissions
    const totalEarnings = await prisma.ledger.aggregate({
      where: {
        userId: userId,
        type: {
          in: ['sponsor_commission', 'repurchase_commission']
        }
      },
      _sum: {
        amount: true
      }
    })

    // Get this month's earnings
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const monthlyEarnings = await prisma.ledger.aggregate({
      where: {
        userId: userId,
        type: {
          in: ['sponsor_commission', 'repurchase_commission']
        },
        createdAt: {
          gte: thisMonth
        }
      },
      _sum: {
        amount: true
      }
    })

    // Get recent referrals (last 10)
    const recentReferrals = await prisma.hierarchy.findMany({
      where: {
        parentId: userId,
        depth: 1
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Generate referral link
    const referralLink = user.referralCode 
      ? generateReferralLink(request, user.referralCode)
      : null

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        stats: {
          directReferrals,
          totalNetwork,
          totalEarnings: totalEarnings._sum.amount || 0,
          monthlyEarnings: monthlyEarnings._sum.amount || 0,
          joinedDate: user.createdAt
        },
        recentReferrals: recentReferrals.map(ref => ({
          id: ref.child.id,
          name: ref.child.fullName,
          isActive: ref.child.isActive,
          joinedDate: ref.child.createdAt,
          level: ref.depth
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
