import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";

export async function POST(request) {
  try {
    const { email, mobileNo, otp } = await request.json();

    // Validate input
    if (!otp) {
      return NextResponse.json(
        { success: false, message: "OTP is required" },
        { status: 400 }
      );
    }

    if (!email && !mobileNo) {
      return NextResponse.json(
        { success: false, message: "Email or mobile number is required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOTP(email, mobileNo, otp);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}