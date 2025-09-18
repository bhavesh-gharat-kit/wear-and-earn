import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { email, mobileNo, otp, newPassword } = await request.json();

    // Validate input
    if (!otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "OTP and new password are required" },
        { status: 400 }
      );
    }

    if (!email && !mobileNo) {
      return NextResponse.json(
        { success: false, message: "Email or mobile number is required" },
        { status: 400 }
      );
    }

    // Verify OTP first
    const otpResult = await verifyOTP(email, mobileNo, otp);

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, message: otpResult.message },
        { status: 400 }
      );
    }

    // Find user
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
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}