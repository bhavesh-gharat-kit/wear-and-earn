import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Uncomment this if you want authentication for uploads
    // const session = await getServerSession(authOptions);
    // const userId = Number(session?.user?.id);
    // if (!userId) {
    //   return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    // }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Get query parameters for flexible folder assignment
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'kyc_documents';
    const resource_type = searchParams.get('resource_type') || 'auto';

    // Generate signature for upload
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: paramsToSign.folder,
      resource_type
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
