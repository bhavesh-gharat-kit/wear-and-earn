import { NextResponse } from "next/server";
import { sendPasswordResetOTP } from "@/lib/otp";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { email, mobileNo } = await request.json();

    // Validate input
    if (!email && !mobileNo) {
      return NextResponse.json(
        { success: false, message: "Email or mobile number is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mobileNo: mobileNo }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found with this email or mobile number" },
        { status: 404 }
      );
    }

    // Send OTP
    const otpSent = await sendPasswordResetOTP(user.email, user.mobileNo);

    if (otpSent) {
      return NextResponse.json({
        success: true,
        message: "Password reset OTP sent successfully"
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to send OTP" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in send-forgot-password-otp:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}