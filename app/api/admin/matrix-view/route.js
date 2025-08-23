import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const matrixNodes = await prisma.matrixNode.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            referralCode: true,
            isActive: true,
            walletBalance: true
          }
        },
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                referralCode: true
              }
            }
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { position: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      matrix: matrixNodes
    })

  } catch (error) {
    console.error('Error fetching matrix view:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch matrix data' },
      { status: 500 }
    )
  }
}
