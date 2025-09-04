
import { NextResponse as res } from "next/server"
import prisma from "@/lib/prisma";

// Dynamic import for bcrypt to handle serverless issues
async function hashPassword(password) {
  try {
    const bcrypt = await import('bcryptjs'); // Use bcryptjs instead of bcrypt
    return await bcrypt.hash(password, 12);
  } catch (bcryptError) {
    console.error('Bcrypt error, falling back to basic hash:', bcryptError);
    // Fallback - not recommended for production, but for debugging
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT || 'fallback-salt').digest('hex');
  }
}

export const GET = () => {
    return res.json({
        success: true,
        message: "Working.."
    })
}

export const POST = async (request) => {
  try {
    console.log('Signup API called');
    
    const body = await request.json();
    const { fullName, email, password, mobileNo, referralCode } = body;
    
    console.log('Signup data:', { fullName, email: !!email, mobileNo, referralCode });

    // 1. Validate required fields
    if (!fullName || !password || !mobileNo) {
      console.log('Validation failed: missing required fields');
      return res.json(
        { success: false, message: "Full Name, Password, and Mobile Number are required." },
        { status: 400 }
      );
    }

    // 2. Check for existing user by mobile number
    console.log('Checking existing user by mobile:', mobileNo);
    const existingUser = await prisma.user.findUnique({
      where: { mobileNo },
    });

    if (existingUser) {
      console.log('Mobile number already exists');
      return res.json(
        { success: false, message: "Mobile Number already exists." },
        { status: 409 }
      );
    }

    // 3. Handle referral code and find sponsor
    let sponsorId = null;
    if (referralCode) {
      console.log('Looking for sponsor with referral code:', referralCode);
      try {
        const sponsor = await prisma.user.findUnique({
          where: { referralCode }
        });
        
        if (!sponsor) {
          console.log('Sponsor not found for referral code:', referralCode);
          return res.json(
            { success: false, message: "Invalid referral code." },
            { status: 400 }
          );
        }
        sponsorId = sponsor.id;
        console.log('Found sponsor with ID:', sponsorId);
      } catch (sponsorError) {
        console.error('Error finding sponsor:', sponsorError);
        return res.json(
          { success: false, message: "Error validating referral code." },
          { status: 500 }
        );
      }
    }

    // 4. Hash the password
    console.log('Hashing password...');
    try {
      const hashedPassword = await hashPassword(password);
      console.log('Password hashed successfully');

      // 5. Create user (referral code will be generated after first purchase)
      console.log('Creating user in database...');
      const result = await prisma.$transaction(async (tx) => {
        // Create user without referral code initially
        const user = await tx.user.create({
          data: {
            fullName,
            mobileNo,
            password: hashedPassword,
            sponsorId: sponsorId,
            isActive: false, // Will become active after first purchase
            isKycApproved: false,
            walletBalance: 0,
            monthlyPurchase: 0,
            isEligibleRepurchase: false,
            ...(email ? { email } : {}), // only include email if provided
          },
        });

        console.log('User created with ID:', user.id);
        return user;
      });

      // 6. Respond with created user (safe fields only)
      console.log('Signup successful for user:', result.id);
      return res.json(
        {
          success: true,
          message: "Sign up successful. Your referral link will be available after your first purchase.",
          user: {
            id: result.id,
            fullName: result.fullName,
            email: result.email || null,
            mobileNo: result.mobileNo,
            referralCode: result.referralCode || null,
            hasSponsor: !!sponsorId
          },
        },
        { status: 201 }
      );
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return res.json(
        { success: false, message: "Error processing password." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return res.json(
      {
        success: false,
        message: "Internal Server Error during signup",
        error: error.message || "Unknown error",
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
};