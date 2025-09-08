import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils'


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(request.url)
    const level = parseInt(searchParams.get('level')) || 0
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20

    // Get direct referrals (level 1)
    if (level === 1 || level === 0) {
      const directReferrals = await prisma.user.findMany({
        where: { sponsorId: userId },
        select: {
          id: true,
          fullName: true,
          mobileNo: true,
          isActive: true,
          referralCode: true,
          createdAt: true,
          walletBalance: true,
          monthlyPurchase: true,
          isKycApproved: true,
          // Get their direct referrals count
          referrals: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })

      // Add debugging
      console.log('🔍 Querying direct referrals for userId:', userId)
      
      const totalDirects = await prisma.user.count({
        where: { sponsorId: userId }
      })
      
      console.log('✅ Total directs found:', totalDirects)

      const formattedReferrals = directReferrals.map(user => ({
        id: user.id,
        fullName: user.fullName,
        mobileNo: user.mobileNo,
        isActive: user.isActive,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        walletBalance: {
          paisa: user.walletBalance,
          rupees: paisaToRupees(user.walletBalance)
        },
        monthlyPurchase: {
          paisa: user.monthlyPurchase,
          rupees: paisaToRupees(user.monthlyPurchase)
        },
        isKycApproved: user.isKycApproved,
        directReferralsCount: user.referrals.length
      }))

      return NextResponse.json(serializeBigInt({
        success: true,
        data: formattedReferrals,
        pagination: {
          page,
          limit,
          total: totalDirects,
          totalPages: Math.ceil(totalDirects / limit)
        },
        level: 1,
        title: 'Direct Referrals'
      }))
    }

    // Get team members by level (2-7)
    if (level >= 2 && level <= 7) {
      const teamMembers = await prisma.hierarchy.findMany({
        where: { 
          ancestorId: userId,
          depth: level
        },
        include: {
          descendant: {
            select: {
              id: true,
              fullName: true,
              mobileNo: true,
              isActive: true,
              referralCode: true,
              createdAt: true,
              walletBalance: true,
              monthlyPurchase: true,
              isKycApproved: true,
              sponsorId: true,
              sponsor: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          }
        },
        orderBy: { descendant: { createdAt: 'desc' } },
        skip: (page - 1) * limit,
        take: limit
      })

      const totalAtLevel = await prisma.hierarchy.count({
        where: { 
          ancestorId: userId,
          depth: level
        }
      })

      const formattedMembers = teamMembers.map(member => ({
        id: member.descendant.id,
        fullName: member.descendant.fullName,
        mobileNo: member.descendant.mobileNo,
        isActive: member.descendant.isActive,
        referralCode: member.descendant.referralCode,
        createdAt: member.descendant.createdAt,
        walletBalance: {
          paisa: member.descendant.walletBalance,
          rupees: paisaToRupees(member.descendant.walletBalance)
        },
        monthlyPurchase: {
          paisa: member.descendant.monthlyPurchase,
          rupees: paisaToRupees(member.descendant.monthlyPurchase)
        },
        isKycApproved: member.descendant.isKycApproved,
        sponsor: member.descendant.sponsor,
        depth: member.depth
      }))

      return NextResponse.json(serializeBigInt({
        success: true,
        data: formattedMembers,
        pagination: {
          page,
          limit,
          total: totalAtLevel,
          totalPages: Math.ceil(totalAtLevel / limit)
        },
        level,
        title: `Level ${level} Team`
      }))
    }

    // Get team overview (all levels)
    const teamOverview = await Promise.all([1,2,3,4,5,6,7].map(async (lvl) => {
      const count = lvl === 1 
        ? await prisma.user.count({ where: { sponsorId: userId }})
        : await prisma.hierarchy.count({ 
            where: { ancestorId: userId, depth: lvl }
          })
      
      const active = lvl === 1
        ? await prisma.user.count({ 
            where: { sponsorId: userId, isActive: true }
          })
        : await prisma.hierarchy.count({
            where: { 
              ancestorId: userId, 
              depth: lvl,
              descendant: { isActive: true }
            }
          })

      return {
        level: lvl,
        totalMembers: count,
        activeMembers: active,
        inactiveMembers: count - active
      }
    }))

    const totalTeamSize = await prisma.hierarchy.count({
      where: { ancestorId: userId }
    })

    const directReferralsCount = await prisma.user.count({
      where: { sponsorId: userId }
    })

    return NextResponse.json(serializeBigInt({
      success: true,
      data: {
        overview: teamOverview,
        totalTeamSize: totalTeamSize + directReferralsCount,
        levelBreakdown: teamOverview
      },
      level: 'overview',
      title: 'Team Overview'
    }))

  } catch (error) {
    console.error('Error fetching team data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
