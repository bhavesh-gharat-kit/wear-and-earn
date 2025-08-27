
import { NextResponse as res } from "next/server"
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt"
import { placeUserInMatrix, getGlobalRootId } from "@/lib/matrix";
import { generateReferralCode } from "@/lib/commission";

export const GET = () => {
    return res.json({
        success: true,
        message: "Working.."
    })
}

export const POST = async (request) => {
  try {
    const body = await request.json();
    const { fullName, email, password, mobileNo, referralCode } = body;

    // 1. Validate required fields
    if (!fullName || !password || !mobileNo) {
      return res.json(
        { success: false, message: "Full Name, Password, and Mobile Number are required." },
        { status: 400 }
      );
    }

    // 2. Check for existing user by mobile number
    const existingUser = await prisma.user.findUnique({
      where: { mobileNo },
    });

    if (existingUser) {
      return res.json(
        { success: false, message: "Mobile Number already exists." },
        { status: 409 }
      );
    }

    // 3. Handle referral code and find sponsor
    let sponsorId = null;
    if (referralCode) {
      const sponsor = await prisma.user.findUnique({
        where: { referralCode }
      });
      
      if (!sponsor) {
        return res.json(
          { success: false, message: "Invalid referral code." },
          { status: 400 }
        );
      }
      sponsorId = sponsor.id;
    }

    // 4. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user (referral code will be generated after first purchase)
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

      // Note: MLM placement happens after first purchase, not at registration
      return user;
    });

    // 6. Respond with created user (safe fields only)
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
  } catch (error) {
    console.error("Signup error:", error);
    return res.json(
      {
        success: false,
        message: "Internal Server Error during signup",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
};