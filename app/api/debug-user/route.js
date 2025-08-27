import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        referralCode: true,
        walletBalance: true,
        monthlyPurchase: true
      }
    })

    // Get user's orders
    const orders = await prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        amount: true,
        paidAt: true,
        isJoiningOrder: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Count paid orders
    const paidOrdersCount = orders.filter(order => order.paidAt !== null).length
    
    return NextResponse.json({
      user,
      orders,
      paidOrdersCount,
      needsActivation: !user.isActive && paidOrdersCount > 0
    })
  } catch (error) {
    console.error('User debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    
    // Call the MLM activation endpoint
    const activateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/activate-mlm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    const activateData = await activateResponse.json()
    
    return NextResponse.json({
      success: activateResponse.ok,
      statusCode: activateResponse.status,
      data: activateData
    })
  } catch (error) {
    console.error('Manual activation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
