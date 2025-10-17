import { NextResponse } from "next/server";
import { sendRegistrationOTP } from "@/lib/otp";

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

  // Determine domain from request for WebOTP SMS formatting
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const domainForWebOtp = host ? `${proto}://${host}` : undefined;
  console.log("🌐 send-registration-otp using domain:", domainForWebOtp);

  // Send OTP with domain hint
  const otpSent = await sendRegistrationOTP(email, mobileNo, domainForWebOtp);

    if (otpSent) {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully"
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to send OTP" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in send-registration-otp:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}