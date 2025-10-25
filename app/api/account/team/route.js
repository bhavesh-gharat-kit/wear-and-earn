import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
import { serializeBigInt, paisaToRupees } from '@/lib/serialization-utils'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // --- Fetch Level 1 referrals ---
    const level1 = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true, isActive: true }
    })

    // --- Fetch Level 2 (referrals of level 1 users) ---
    const level2 = await prisma.user.findMany({
      where: { sponsorId: { in: level1.map(u => u.id) } },
      select: { id: true, isActive: true }
    })

    // --- Fetch Level 3 ---
    const level3 = await prisma.user.findMany({
      where: { sponsorId: { in: level2.map(u => u.id) } },
      select: { id: true, isActive: true }
    })

    // --- Fetch Level 4 ---
    const level4 = await prisma.user.findMany({
      where: { sponsorId: { in: level3.map(u => u.id) } },
      select: { id: true, isActive: true }
    })

    // --- Fetch Level 5 ---
    const level5 = await prisma.user.findMany({
      where: { sponsorId: { in: level4.map(u => u.id) } },
      select: { id: true, isActive: true }
    })

    // --- Helper to summarize a level ---
    const summarize = (arr, level) => ({
      level,
      totalMembers: arr.length,
      activeMembers: arr.filter(u => u.isActive).length
    })

    const overview = [
      summarize(level1, 1),
      summarize(level2, 2),
      summarize(level3, 3),
      summarize(level4, 4),
      summarize(level5, 5)
    ]

    const totalTeamSize = overview.reduce((sum, lvl) => sum + lvl.totalMembers, 0)

    return NextResponse.json({
      success: true,
      data: {
        overview,
        totalTeamSize
      }
    })
  } catch (error) {
    console.error("❌ Error fetching team overview:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch team data" },
      { status: 500 }
    )
  }
}
