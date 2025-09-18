import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { verifyOTP } from "@/lib/otp"
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for OTP registration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request) {
  try {
    // Rate limiting for registration attempts
    const clientIP = request.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await limiter.check(5, `register_otp_${clientIP}`) // 5 registration attempts per minute per IP
    } catch {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { 
      fullName, 
      email, 
      password, 
      mobileNo, 
      referralCode, 
      spid, 
      otp 
    } = await request.json()

    // Validate required fields
    if (!fullName || !password || !mobileNo || !otp) {
      return NextResponse.json(
        { error: 'Full Name, Password, Mobile Number, and OTP are required' },
        { status: 400 }
      )
    }

    // Verify OTP first
    const otpResult = await verifyOTP(email, mobileNo, otp)
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message },
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
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate unique referral code
      const generateReferralCode = (name, id) => {
        const namePart = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        const idPart = String(id).padStart(4, '0');
        return `${namePart}${idPart}`;
      };

      // Get next user ID for referral code generation
      const lastUser = await tx.user.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true }
      });
      const nextId = (lastUser?.id || 0) + 1;
      const referralCode = generateReferralCode(fullName, nextId);

      // Create new user
      const newUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email?.trim() || null,
          mobileNo: mobileNo.trim(),
          password: hashedPassword,
          sponsorId: sponsorId,
          referralCode: referralCode,
          isVerified: true, // Mark as verified since OTP was verified
          role: 'user',
          isActive: true,
        },
      });

      // Update sponsor's direct teams if sponsor exists
      if (sponsorId) {
        await tx.user.update({
          where: { id: sponsorId },
          data: {
            directTeams: { increment: 1 }
          }
        });

        // Create referral tracking entry
        await tx.referralTracking.create({
          data: {
            referrerId: sponsorId,
            referredUserId: newUser.id,
            level: 1,
            status: 'ACTIVE'
          }
        });
      }

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now login.',
      user: {
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        mobileNo: result.mobileNo,
        referralCode: result.referralCode,
        sponsorId: result.sponsorId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in OTP registration:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}