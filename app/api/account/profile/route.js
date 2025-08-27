import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // Get user profile data with address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        address: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Format user data
    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNo: user.mobileNo,
      gender: user.gender,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      address: user.address ? {
        houseNumber: user.address.houseNumber,
        area: user.address.area,
        landmark: user.address.landmark,
        villageOrCity: user.address.villageOrCity,
        taluka: user.address.taluka,
        district: user.address.district,
        pinCode: user.address.pinCode,
        state: user.address.state
      } : null
    }

    return NextResponse.json(userData)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
