import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required' },
        { status: 400 }
      )
    }

    const sponsor = await prisma.user.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        isActive: true
      }
    })

    if (!sponsor) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      sponsor: {
        fullName: sponsor.fullName,
        referralCode: sponsor.referralCode,
        isActive: sponsor.isActive
      }
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
