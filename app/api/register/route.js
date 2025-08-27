import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for registration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request) {
  try {
    // Rate limiting for registration page views
    try {
      await limiter.check(30, request.headers.get('x-forwarded-for') || 'anonymous')
    } catch {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const spid = searchParams.get('spid') // Sponsor ID parameter

    if (!spid) {
      return NextResponse.json({
        success: true,
        message: 'Registration page - no sponsor specified',
        sponsor: null
      })
    }

    // Validate and get sponsor information
    const sponsorId = parseInt(spid)
    
    if (isNaN(sponsorId)) {
      return NextResponse.json(
        { error: 'Invalid sponsor ID format' },
        { status: 400 }
      )
    }

    // Find sponsor by ID or referral code
    let sponsor = await prisma.user.findFirst({
      where: {
        OR: [
          { id: sponsorId },
          { referralCode: spid }
        ],
        role: 'user',
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        referralCode: true,
        matrixLevel: true,
        matrixPosition: true,
        createdAt: true,
        referrals: {
          select: {
            id: true,
            fullName: true,
            createdAt: true
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            referrals: true
          }
        }
      }
    })

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Invalid or inactive sponsor' },
        { status: 400 }
      )
    }

    // Create tracking entry for sponsor link click
    await prisma.referralClick.create({
      data: {
        sponsorId: sponsor.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        referralSource: 'direct_link'
      }
    }).catch(error => {
      // Ignore errors if table doesn't exist
      console.log('Referral click tracking failed:', error.message)
    })

    return NextResponse.json({
      success: true,
      message: 'Valid sponsor found',
      sponsor: {
        id: sponsor.id,
        name: sponsor.fullName,
        email: sponsor.email,
        referralCode: sponsor.referralCode,
        matrixLevel: sponsor.matrixLevel,
        joinedDate: sponsor.createdAt,
        totalReferrals: sponsor._count.referrals,
        recentReferrals: sponsor.referrals.map(ref => ({
          name: ref.fullName,
          joinedDate: ref.createdAt
        }))
      },
      registrationBenefits: [
        'Earn commissions up to 5 levels deep',
        'Get welcome bonus on first purchase',
        'Access to exclusive products and discounts',
        'Build your own referral network',
        'Matrix-based earning opportunities'
      ]
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Error in register GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Rate limiting for registration attempts
    const clientIP = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await limiter.check(5, `register_${clientIP}`) // 5 registration attempts per minute per IP
    } catch {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { fullName, email, password, mobileNo, referralCode, spid } = await request.json()

    // Validate required fields
    if (!fullName || !password || !mobileNo) {
      return NextResponse.json(
        { error: 'Full Name, Password, and Mobile Number are required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(mobileNo)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNo: mobileNo },
          ...(email ? [{ email: email }] : [])
        ]
      }
    })

    if (existingUser) {
      const field = existingUser.mobileNo === mobileNo ? 'Mobile number' : 'Email'
      return NextResponse.json(
        { error: `${field} already registered` },
        { status: 409 }
      )
    }

    // Handle sponsor identification (spid takes precedence over referralCode)
    let sponsorId = null
    let sponsor = null

    const sponsorIdentifier = spid || referralCode

    if (sponsorIdentifier) {
      // Try to find sponsor by ID first, then by referral code
      if (!isNaN(parseInt(sponsorIdentifier))) {
        sponsor = await prisma.user.findFirst({
          where: {
            id: parseInt(sponsorIdentifier),
            role: 'user',
            isActive: true
          }
        })
      }

      // If not found by ID, try referral code
      if (!sponsor) {
        sponsor = await prisma.user.findFirst({
          where: {
            referralCode: sponsorIdentifier,
            role: 'user',
            isActive: true
          }
        })
      }

      if (!sponsor) {
        return NextResponse.json(
          { error: 'Invalid or inactive sponsor' },
          { status: 400 }
        )
      }

      sponsorId = sponsor.id
    }

    // Start transaction for user creation
    const result = await prisma.$transaction(async (tx) => {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const newUser = await tx.user.create({
        data: {
          fullName,
          email: email || null,
          mobileNo,
          password: hashedPassword,
          sponsorId: sponsorId,
          role: 'user',
          isActive: false, // Will become active after first purchase
          isKycApproved: false,
          walletBalance: 0,
          monthlyPurchase: 0,
          isEligibleRepurchase: false
        }
      })

      // Create welcome ledger entry
      await tx.ledger.create({
        data: {
          userId: newUser.id,
          type: 'registration',
          amount: 0,
          description: 'User registration completed',
          ref: `REG_${newUser.id}_${Date.now()}`,
          metadata: {
            sponsorId: sponsorId,
            registrationSource: spid ? 'sponsor_link' : 'direct',
            ipAddress: clientIP,
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        }
      })

      // Update referral click tracking if exists
      if (sponsorId) {
        await tx.referralClick.updateMany({
          where: {
            sponsorId: sponsorId,
            ipAddress: clientIP,
            convertedUserId: null,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          data: {
            convertedUserId: newUser.id,
            conversionDate: new Date()
          }
        }).catch(() => {
          // Ignore if table doesn't exist
        })
      }

      return newUser
    })

    // Prepare response (exclude sensitive data)
    const responseData = {
      id: result.id,
      fullName: result.fullName,
      email: result.email,
      mobileNo: result.mobileNo,
      hasSponsor: !!sponsorId,
      sponsor: sponsor ? {
        id: sponsor.id,
        name: sponsor.fullName,
        referralCode: sponsor.referralCode
      } : null,
      isActive: result.isActive,
      registrationDate: result.createdAt
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please complete your first purchase to activate your account.',
      user: responseData,
      nextSteps: [
        'Verify your email address',
        'Complete KYC verification',
        'Make your first purchase to activate account',
        'Start building your referral network'
      ]
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Mobile number or email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}
