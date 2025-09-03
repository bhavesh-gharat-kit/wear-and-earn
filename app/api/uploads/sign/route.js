import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'wear-and-earn'
    const eager = searchParams.get('eager') // Optional transformations
    
    const timestamp = Math.floor(Date.now() / 1000)
    
    const paramsToSign = {
      timestamp,
      folder,
    }
    
    // Add eager transformations if provided
    if (eager) {
      paramsToSign.eager = eager
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
      folder,
      ...(eager && { eager })
    })
  } catch (err) {
    console.error('Cloudinary sign error:', err)
    return NextResponse.json({ error: 'Failed to sign upload' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { folder = 'wear-and-earn', eager } = body
    
    const timestamp = Math.floor(Date.now() / 1000)
    
    const paramsToSign = {
      timestamp,
      folder,
    }
    
    if (eager) {
      paramsToSign.eager = eager
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
      folder,
      ...(eager && { eager })
    })
  } catch (err) {
    console.error('Cloudinary sign error:', err)
    return NextResponse.json({ error: 'Failed to sign upload' }, { status: 500 })
  }
}
