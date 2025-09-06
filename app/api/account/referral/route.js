import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from "@/lib/prisma";
import { generateAndAssignReferralCode } from '@/lib/referral'
import { generateReferralLink } from '@/lib/url-utils'


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        isActive: true,
        fullName: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is activated (has made first paid order)
    if (!user.isActive || !user.referralCode) {
      // Check if user has any paid orders (inProcess or delivered status with payment confirmation)
      const paidOrders = await prisma.order.count({
        where: {
          userId: userId,
          AND: [
            {
              OR: [
                { status: 'delivered' },
                { status: 'inProcess' }
              ]
            },
            {
              NOT: { paymentId: null } // Must have a payment ID (payment confirmed)
            },
            {
              NOT: { paidAt: null } // Must have been paid
            }
          ]
        }
      });

      if (paidOrders > 0) {
        // User has purchases but isn't activated - activate them directly
        try {
          console.log(`Auto-activating user ${userId} who has ${paidOrders} paid orders but no MLM activation`);
          
          // Activate user directly in the same transaction
          const activatedUser = await prisma.$transaction(async (tx) => {
            // Generate and assign referral code
            let referralCode = user.referralCode;
            if (!referralCode) {
              referralCode = await generateAndAssignReferralCode(tx, userId);
            }
            
            // Activate user
            const updatedUser = await tx.user.update({
              where: { id: userId },
              data: { isActive: true }
            });
            
            return { ...updatedUser, referralCode };
          });

          // Update local user object
          user.isActive = activatedUser.isActive;
          user.referralCode = activatedUser.referralCode;
          
          console.log(`Successfully auto-activated user ${userId} with referral code ${user.referralCode}`);
        } catch (activationError) {
          console.error(`Failed to auto-activate user ${userId}:`, activationError);
        }
      }

      // If still not activated after auto-activation attempt
      if (!user.isActive || !user.referralCode) {
        return NextResponse.json({
          error: 'Referral link not available',
          message: paidOrders > 0 ? 
            'Your account is being activated. Please refresh the page in a few moments.' :
            'You need to make your first purchase to get your referral link',
          isActive: false,
          hasOrders: paidOrders > 0
        }, { status: 400 });
      }
    }

    // Generate referral URL
    const referralUrl = generateReferralLink(request, user.referralCode)

    // Get referral stats
    const totalReferrals = await prisma.hierarchy.count({
      where: {
        ancestorId: userId,
        depth: 1
      }
    })

    const activeReferrals = await prisma.hierarchy.count({
      where: {
        ancestorId: userId,
        depth: 1,
        descendant: { isActive: true }
      }
    })

    // Get total team size
    const totalTeamSize = await prisma.hierarchy.count({
      where: {
        ancestorId: userId
      }
    })

    // Get referral earnings from ledger
    const referralEarnings = await prisma.ledger.aggregate({
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

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralUrl,
        isActive: user.isActive,
        stats: {
          totalReferrals,
          activeReferrals,
          totalTeamSize,
          totalEarnings: referralEarnings._sum.amount || 0 // Keep in paisa for consistency
        },
        isActive: true
      }
    })

  } catch (error) {
    console.error('Error fetching referral data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
