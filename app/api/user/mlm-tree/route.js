import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 10 requests per minute per user (tree data can be expensive)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
})

export async function GET(request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    try {
      await limiter.check(10, ip) // 10 requests per minute
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
    const { searchParams } = new URL(request.url)
    const maxLevel = Math.min(parseInt(searchParams.get('levels')) || 5, 5) // Max 5 levels

    // Get user's downline up to specified levels
    const downline = await prisma.hierarchy.findMany({
      where: {
        parentId: userId,
        depth: {
          lte: maxLevel
        }
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            referralCode: true,
            isActive: true,
            walletBalance: true,
            monthlyPurchase: true,
            createdAt: true,
            isKycApproved: true
          }
        }
      },
      orderBy: [
        { depth: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Get matrix node information for tree positioning
    const matrixNodes = await prisma.matrixNode.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: { in: downline.map(d => d.childId) } }
        ]
      },
      select: {
        userId: true,
        level: true,
        position: true,
        parentId: true
      }
    })

    // Create a map for quick matrix position lookup
    const matrixMap = {}
    matrixNodes.forEach(node => {
      matrixMap[node.userId] = node
    })

    // Build tree structure
    const buildTree = (parentId, currentLevel = 1) => {
      if (currentLevel > maxLevel) return []
      
      const children = downline.filter(d => 
        d.parentId === parentId && d.depth === currentLevel
      )
      
      return children.map(child => {
        const matrixInfo = matrixMap[child.childId] || {}
        
        return {
          id: child.childId,
          name: child.child.fullName,
          referralCode: child.child.referralCode,
          isActive: child.child.isActive,
          isKycApproved: child.child.isKycApproved,
          walletBalance: child.child.walletBalance || 0,
          monthlyPurchase: child.child.monthlyPurchase || 0,
          joinedDate: child.child.createdAt,
          level: currentLevel,
          matrixLevel: matrixInfo.level || null,
          matrixPosition: matrixInfo.position || null,
          children: buildTree(child.childId, currentLevel + 1)
        }
      })
    }

    const tree = buildTree(userId)

    // Calculate level-wise statistics
    const levelStats = {}
    for (let i = 1; i <= maxLevel; i++) {
      const levelUsers = downline.filter(d => d.depth === i)
      levelStats[i] = {
        count: levelUsers.length,
        active: levelUsers.filter(d => d.child.isActive).length,
        kycApproved: levelUsers.filter(d => d.child.isKycApproved).length,
        totalPurchase: levelUsers.reduce((sum, d) => sum + (d.child.monthlyPurchase || 0), 0)
      }
    }

    // Get user's own matrix position
    const userMatrix = matrixMap[userId] || {}

    // Calculate total network stats
    const totalNetwork = downline.length
    const activeNetwork = downline.filter(d => d.child.isActive).length
    const kycApprovedNetwork = downline.filter(d => d.child.isKycApproved).length

    return NextResponse.json({
      success: true,
      data: {
        userMatrix: {
          level: userMatrix.level || null,
          position: userMatrix.position || null,
          parentId: userMatrix.parentId || null
        },
        tree,
        statistics: {
          totalNetwork,
          activeNetwork,
          kycApprovedNetwork,
          levelStats
        },
        metadata: {
          maxLevels: maxLevel,
          generatedAt: new Date().toISOString(),
          treeDepth: Math.max(...downline.map(d => d.depth), 0)
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Error fetching MLM tree:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
