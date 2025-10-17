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

    // Verify OTP first (but don't delete it yet) - use original mobile number
    const originalMobileNo = mobileNo; // Keep original for OTP verification
    console.log("🔐 Verifying OTP for:", { email, mobileNo: originalMobileNo, otp: otp ? "PROVIDED" : "MISSING" })
    const otpResult = await verifyOTP(email, originalMobileNo, otp, false) // Don't delete OTP yet
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
      console.log("❌ Email validation failed:", email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Clean and validate mobile number format
    console.log("📱 Original mobile number:", mobileNo, "Type:", typeof mobileNo);
    
    // Clean mobile number: remove spaces, + and country code
    let cleanMobileNo = mobileNo.toString().trim().replace(/\s+/g, '');
    if (cleanMobileNo.startsWith('+91')) {
      cleanMobileNo = cleanMobileNo.substring(3);
    } else if (cleanMobileNo.startsWith('91') && cleanMobileNo.length === 12) {
      cleanMobileNo = cleanMobileNo.substring(2);
    }
    
    console.log("📱 Cleaned mobile number:", cleanMobileNo);
    
    if (!/^[6-9]\d{9}$/.test(cleanMobileNo)) {
      console.log("❌ Mobile number validation failed:", cleanMobileNo);
      return NextResponse.json(
        { error: 'Invalid mobile number format. Please enter a 10-digit mobile number starting with 6-9.' },
        { status: 400 }
      )
    }
    
    // Use cleaned mobile number for database operations
    const finalMobileNo = cleanMobileNo;

    // Validate password strength
    if (password.length < 6) {
      console.log("❌ Password validation failed - too short:", password.length);
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    console.log("✅ All validations passed - proceeding with registration");

    // Check for existing user
    console.log("🔍 Checking for existing user with:", { mobileNo: finalMobileNo, email });
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNo: finalMobileNo },
          ...(email ? [{ email: email }] : [])
        ]
      }
    })

    if (existingUser) {
      const field = existingUser.mobileNo === finalMobileNo ? 'Mobile number' : 'Email'
      console.log("❌ User already exists:", { field, mobileNo: existingUser.mobileNo, email: existingUser.email });
      return NextResponse.json(
        { error: `${field} already registered` },
        { status: 409 }
      )
    }

    console.log("✅ No existing user found - proceeding with registration");

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
      
      // Note: Referral code will be generated when user makes their first purchase
      // This ensures users only get referral codes after they become active customers

      // Create new user
      console.log("👤 Creating new user with data:", {
        fullName: fullName.trim(),
        email: email?.trim() || null,
        mobileNo: finalMobileNo.trim(),
        sponsorId: sponsorId,
        referralCode: null, // Will be generated on first purchase
        isVerified: true,
        role: 'user',
        isActive: false, // Will be activated on first purchase
      });
      
      const newUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email?.trim() || null,
          mobileNo: finalMobileNo.trim(),
          password: hashedPassword,
          sponsorId: sponsorId,
          referralCode: null, // Will be generated when user makes first purchase
          isVerified: true, // Mark as verified since OTP was verified
          role: 'user',
          isActive: false, // Will be activated when user makes first purchase
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
            referralCodeUsed: sponsorIdentifier,
            teamContributionStatus: 'pending' // User hasn't made first purchase yet
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
        referralCode: result.referralCode, // Will be null until first purchase
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