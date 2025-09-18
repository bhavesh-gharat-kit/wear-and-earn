import axios from "axios";
import { addToLog } from "./addToLog";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

// Create axios instance with IPv4 preference
const axiosInstance = axios.create({
  family: 4, // Force IPv4
  timeout: 30000,
});

export const sendRegistrationOTP = async (email, contactNo) => {
  if (!email && !contactNo) return false;

  // create OTP, hash it and set expiry
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const title = `Registration OTP - ${process.env.NEXT_PUBLIC_COMPANY_NAME}`;
    // store OTP in database
    await prisma.OTP.create({
      data: {
        contact: contactNo,
        email: email,
        otpHash,
        expiresAt,
      },
    });

    if (email) {
      const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f7;
                margin: 0;
                padding: 0;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 30px auto;
                padding: 25px;
                background-color: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                border-top: 6px solid #f97316; /* orange accent */
            }
            h1 {
                color: #111;
                text-align: center;
                font-size: 22px;
                margin-bottom: 15px;
            }
            p {
                color: #444;
                font-size: 15px;
                margin-bottom: 18px;
                text-align: center;
            }
            .otp {
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #f97316, #fb923c);
                color: #fff;
                border-radius: 8px;
                letter-spacing: 5px;
                margin: 20px auto;
                width: fit-content;
            }
            .note {
                font-size: 13px;
                font-style: italic;
                text-align: center;
                margin-top: 15px;
                color: #666;
            }
            footer {
                text-align: center;
                margin-top: 25px;
                font-size: 13px;
                color: #999;
            }
            @media only screen and (max-width: 600px) {
                .container {
                    width: 90%;
                    padding: 15px;
                }
                .otp {
                    font-size: 26px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p>Use the following One-Time Password (OTP) to complete your registration.</p>
            <div class="otp">${otp}</div>
            <p class="note">⚠️ Please do not share this OTP with anyone. It is valid for <b>10 minutes</b> only.</p>
            <p>If you did not request this OTP, kindly ignore this email or contact our support team immediately.</p>
            <footer>
                © ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_COMPANY_NAME || "Wear and Earn"}. All rights reserved.
            </footer>
        </div>
    </body>
    </html>`;

      try {
        await sendBrevoEmail(email, title, htmlContent);
      } catch (emailError) {
        console.error("Failed to send email OTP:", emailError.message);
        // Continue execution - OTP is already stored in database
      }
    }
    if (contactNo) {
      try {
        await sendFast2Sms(contactNo, otp);
      } catch (smsError) {
        console.error("Failed to send SMS OTP:", smsError.message);
        // Continue execution - OTP is already stored in database
      }
    }
    return true;
  } catch (error) {
    console.error("Error while sending OTP: ", error);
    return false;
  }
};

export const sendPasswordResetOTP = async (email, contactNo) => {
  if (!email && !contactNo) return false;

  // create OTP, hash it and set expiry
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    const title = `Password Reset OTP - ${process.env.NEXT_PUBLIC_COMPANY_NAME}`;

    // store OTP in database
    await prisma.OTP.create({
      data: {
        contact: contactNo,
        email: email,
        otpHash,
        expiresAt,
      },
    });

    if (email) {
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 30px auto; padding: 25px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-top: 6px solid #f97316; }
              h1 { color: #111; text-align: center; font-size: 22px; margin-bottom: 15px; }
              p { color: #444; font-size: 15px; margin-bottom: 18px; text-align: center; }
              .otp { font-size: 32px; font-weight: bold; text-align: center; padding: 15px 20px; background: linear-gradient(135deg, #f97316, #fb923c); color: #fff; border-radius: 8px; letter-spacing: 5px; margin: 20px auto; width: fit-content; }
              .note { font-size: 13px; font-style: italic; text-align: center; margin-top: 15px; color: #666; }
              footer { text-align: center; margin-top: 25px; font-size: 13px; color: #999; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>${title}</h1>
              <p>We received a request to reset your password. Use the OTP below to proceed:</p>
              <div class="otp">${otp}</div>
              <p class="note">⚠️ Do not share this OTP with anyone. It will expire in <b>10 minutes</b>.</p>
              <p>If you did not request a password reset, you can safely ignore this email.</p>
              <footer>© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_COMPANY_NAME || "Wear and Earn"}. All rights reserved.</footer>
          </div>
      </body>
      </html>`;

      try {
        await sendBrevoEmail(email, title, htmlContent);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError.message);
        // Continue execution - OTP is already stored in database
      }
    }

    if (contactNo) {
      try {
        await sendFast2Sms(contactNo, otp);
      } catch (smsError) {
        console.error("Failed to send SMS OTP:", smsError.message);
        // Continue execution - OTP is already stored in database
      }
    }

    return true;
  } catch (error) {
    console.error("Error while sending password reset OTP: ", error);
    return false;
  }
};

export const verifyOTP = async (email, contactNo, otp, deleteAfterVerify = true) => {
  try {
    console.log("🔍 Looking for OTP record:", { email, contactNo, otp: otp ? "PROVIDED" : "MISSING" });
    
    // Find the latest OTP for this email/contact
    const otpRecord = await prisma.OTP.findFirst({
      where: {
        OR: [
          { email: email },
          { contact: contactNo }
        ],
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("📋 OTP record found:", otpRecord ? { id: otpRecord.id, email: otpRecord.email, contact: otpRecord.contact, expiresAt: otpRecord.expiresAt } : "NONE");

    if (!otpRecord) {
      return { success: false, message: "OTP not found or expired" };
    }

    // Verify OTP
    console.log("🔐 Comparing OTP:", { provided: otp, stored: "HASHED" });
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otpHash);
    
    console.log("✅ OTP validation result:", isValidOTP);
    
    if (!isValidOTP) {
      return { success: false, message: "Invalid OTP" };
    }

    // Only delete OTP if requested (for registration, we'll delete after user creation)
    if (deleteAfterVerify) {
      await prisma.OTP.delete({
        where: { id: otpRecord.id }
      });
      console.log("🗑️ OTP record deleted after successful verification");
    }

    return { 
      success: true, 
      message: "OTP verified successfully",
      otpId: otpRecord.id // Return OTP ID for later deletion
    };
  } catch (error) {
    console.error("❌ Error verifying OTP: ", error);
    return { success: false, message: "Error verifying OTP" };
  }
};

// Helper function to delete OTP after successful registration
export const deleteOTP = async (otpId) => {
  try {
    await prisma.OTP.delete({
      where: { id: otpId }
    });
    console.log("🗑️ OTP record deleted:", otpId);
    return true;
  } catch (error) {
    console.error("❌ Error deleting OTP:", error);
    return false;
  }
};

// Helper function for internal use
const sendBrevoEmail = async (recipient, subject, htmlContent) => {
  // Debug environment variables
  if (!process.env.BREVO_API_URL) {
    throw new Error("BREVO_API_URL not configured");
  }
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY not configured");
  }
  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error("BREVO_SENDER_EMAIL not configured");
  }

  console.log("Sending email to:", recipient);
  console.log("Using Brevo API URL:", process.env.BREVO_API_URL);

  const emailOptions = {
    sender: {
      name: process.env.NEXT_PUBLIC_COMPANY_NAME || "Wear and Earn",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [
      {
        email: recipient,
      },
    ],
    subject,
    htmlContent,
  };
  try {
    console.log("🚀 Using AXIOS to send email (not fetch)");
    console.log("📧 Email options:", { ...emailOptions, htmlContent: '[HTML_CONTENT]' });
    
    const res = await axiosInstance.post(process.env.BREVO_API_URL, emailOptions, {
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
    });

    console.log("✅ Brevo email sent successfully:", res.status);

    return res.data;
  } catch (err) {
    // addToLog("error", err);
    if (err.code === 'ECONNABORTED') {
      console.error("❌ Brevo API timeout - please check your internet connection");
    } else if (err.response) {
      console.error("❌ Brevo API error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error while sending Brevo email:", err.message);
    }
    throw err; // preserve original error object
  }
};

// Helper function to handle sms sending
const sendBrevoSMS = async (phoneNumber, message) => {
  const smsData = {
    sender: "MyBrand", // Must be approved sender name or short code from Brevo
    recipient: phoneNumber, // Format: E.164 international format (e.g., +919999999999)
    content: message,
  };

  try {
    const res = await axiosInstance.post(
      `${
        process.env.BREVO_SMS_API_URL ||
        "https://api.brevo.com/v3/transactionalSMS/sms"
      }`,
      smsData,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );
    return res.data;
  } catch (err) {
    addToLog("error", err);
    console.error(
      "Error while sending Brevo SMS:",
      err.response?.data || err.message
    );
    throw new Error("SMS sending failed");
  }
};

// Helper function to handle fast2sms sms sending
const sendFast2Sms = async (numbers, otp, options = {}) => {
  // numbers: single or comma-separated string of mobile numbers
  // otp: numeric OTP value (required for route=otp)
  // options: { schedule_time, flash }

  const params = new URLSearchParams({
    authorization: process.env.FAST2SMS_API_KEY,
    route: "otp",
    variables_values: otp.toString(), // must be numeric string
    numbers: Array.isArray(numbers) ? numbers.join(",") : numbers,
    flash: options.flash || "0",
  });

  if (options.schedule_time) {
    params.append("schedule_time", options.schedule_time); // format: "YYYY-MM-DD HH:mm"
  }

  try {
    const url = `${process.env.FAST2SMS_API_URL}?${params.toString()}`;
    console.log("📱 Sending SMS via Fast2SMS with URL:", url.replace(process.env.FAST2SMS_API_KEY, '[API_KEY]'));
    
    const res = await axiosInstance.get(url);

    console.log("✅ Fast2SMS response:", res.status, res.data);
    return res.data;
  } catch (err) {
    if (err.code === 'EHOSTUNREACH') {
      console.error("❌ Fast2SMS: Network unreachable (IPv6 issue). Try IPv4 fallback.");
    } else if (err.response) {
      console.error("❌ Fast2SMS API error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error while sending SMS via Fast2SMS:", err.message);
    }
    throw err;
  }
};