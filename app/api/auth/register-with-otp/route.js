import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { verifyOTP, deleteOTP } from "@/lib/otp"
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

    const requestBody = await request.json()
    console.log("📝 Registration request body:", requestBody)
    
    const { 
      fullName, 
      email, 
      password, 
      mobileNo, 
      referralCode, 
      spid, 
      otp 
    } = requestBody

    // Validate required fields
    if (!fullName || !password || !mobileNo || !otp) {
      console.log("❌ Missing required fields:", { fullName: !!fullName, password: !!password, mobileNo: !!mobileNo, otp: !!otp })
      return NextResponse.json(
        { error: 'Full Name, Password, Mobile Number, and OTP are required' },
        { status: 400 }
      )
    }

    // Verify OTP first (but don't delete it yet)
    console.log("🔐 Verifying OTP for:", { email, mobileNo, otp: otp ? "PROVIDED" : "MISSING" })
    const otpResult = await verifyOTP(email, mobileNo, otp, false) // Don't delete OTP yet
    console.log("🔐 OTP verification result:", otpResult)
    if (!otpResult.success) {
      console.log("❌ OTP verification failed:", otpResult.message)
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
    console.log("👥 Looking for sponsor:", { spid, referralCode, sponsorIdentifier });

    if (sponsorIdentifier) {
      // First try to find by user ID (spid)
      if (!isNaN(sponsorIdentifier)) {
        console.log("🔍 Searching sponsor by ID:", sponsorIdentifier);
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
        console.log("🔍 Searching sponsor by referral code:", sponsorIdentifier);
        sponsor = await prisma.user.findFirst({
          where: {
            referralCode: sponsorIdentifier,
            role: 'user',
            isActive: true
          }
        })
      }

      console.log("👥 Sponsor found:", sponsor ? { id: sponsor.id, referralCode: sponsor.referralCode } : "NONE");

      if (!sponsor) {
        console.log("❌ Invalid sponsor identifier:", sponsorIdentifier);
        return NextResponse.json(
          { error: 'Invalid or inactive sponsor' },
          { status: 400 }
        )
      }

      sponsorId = sponsor.id
    } else {
      console.log("👤 No sponsor provided - registering without sponsor");
    }

    // Start transaction for user creation
    console.log("🔄 Starting user creation transaction");
    const result = await prisma.$transaction(async (tx) => {
      // Hash password
      console.log("🔐 Hashing password");
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
      console.log("👤 Creating new user with data:", {
        fullName: fullName.trim(),
        email: email?.trim() || null,
        mobileNo: mobileNo.trim(),
        sponsorId: sponsorId,
        referralCode: referralCode,
        isVerified: true,
        role: 'user',
        isActive: true,
      });
      
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
      console.log("✅ User created successfully:", newUser.id);

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

    // Delete the OTP after successful user creation
    if (otpResult.otpId) {
      await deleteOTP(otpResult.otpId);
    }

    console.log("✅ Registration completed successfully for user:", result.id);

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
    console.error('❌ Error in OTP registration:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    // Return more specific error message
    let errorMessage = 'Registration failed. Please try again.';
    if (error.code === 'P2002') {
      errorMessage = 'User already exists with this information';
    } else if (error.code === 'P2003') {
      errorMessage = 'Invalid referral information';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}