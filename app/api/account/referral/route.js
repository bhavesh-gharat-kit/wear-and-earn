import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    console.log('🔍 Referral API called')
    
    const session = await getServerSession(authOptions)
    console.log('🔍 Session:', !!session, session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('❌ No session')
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Please log in to view your referral data'
      }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    console.log('🔍 Looking for user:', userId)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        isActive: true,
        fullName: true,
        email: true
      }
    })

    console.log('🔍 Found user:', user)

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 404 })
    }

    if (!user.referralCode) {
      console.log('❌ User has no referral code')
      return NextResponse.json({
        success: false,
        message: 'You need to make your first purchase to get your referral link',
        isActive: false
      })
    }

    // Generate referral URL - simple version
    const baseUrl = process.env.NEXTAUTH_URL || 'https://wearandearn.vercel.app'
    const referralUrl = `${baseUrl}/register?ref=${user.referralCode}`

    console.log('✅ Returning referral data:', user.referralCode)

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralUrl,
        isActive: user.isActive,
        stats: {
          totalReferrals: 0,
          activeReferrals: 0,
          totalTeamSize: 0,
          totalEarnings: 0
        }
      }
    })

  } catch (error) {
    console.error('❌ Referral API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// Generate shareable referral message
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await request.json()
    const userId = parseInt(session.user.id)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        fullName: true,
        isActive: true
      }
    })

    if (!user?.isActive || !user.referralCode) {
      return NextResponse.json({
        error: 'Referral link not available'
      }, { status: 400 })
    }

    // Generate referral URL
    const referralUrl = generateReferralLink(request, user.referralCode)

    // Generate platform-specific messages
    const messages = {
      whatsapp: `🎉 Join WearEarn and start earning money while shopping for trendy clothes!

👕 Shop premium garments
💰 Earn commissions on every purchase
🌟 Build your team and multiply your income

Use my referral code: *${user.referralCode}*

Register here: ${referralUrl}

Start your earning journey today! 🚀`,

      email: `Subject: Earn Money While Shopping - Join WearEarn Today!

Hi there!

I wanted to share an amazing opportunity with you. I've been using WearEarn - a platform where you can shop for trendy clothes AND earn money at the same time!

Here's what makes it special:
• Premium quality garments at great prices
• Earn commissions on your purchases
• Build a team and earn from their success too
• Multiple income streams in one platform

I'd love for you to join my team. Use my referral code: ${user.referralCode}

Register here: ${referralUrl}

Looking forward to having you on board!

Best regards,
${user.fullName}`,

      sms: `🎉 Join WearEarn & earn money shopping! Use my code: ${user.referralCode}. Register: ${referralUrl}`,

      generic: `Join WearEarn using my referral code: ${user.referralCode}
Register at: ${referralUrl}
Start earning money while shopping for trendy clothes!`
    }

    return NextResponse.json({
      success: true,
      data: {
        message: messages[platform] || messages.generic,
        referralUrl,
        referralCode: user.referralCode
      }
    })

  } catch (error) {
    console.error('Error generating referral message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
