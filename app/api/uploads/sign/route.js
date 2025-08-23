import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    // Optionally restrict folder and resource type
    const paramsToSign = {
      timestamp,
      folder: 'wear-and-earn',
    }
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    )

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: 'wear-and-earn',
    })
  } catch (err) {
    console.error('Cloudinary sign error:', err)
    return NextResponse.json({ error: 'Failed to sign upload' }, { status: 500 })
  }
}
