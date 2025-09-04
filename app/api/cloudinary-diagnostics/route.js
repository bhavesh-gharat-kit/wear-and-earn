import { NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinary-utils';

export async function GET() {
  try {
    console.log('🔍 Cloudinary Diagnostics Starting...');
    
    // Check environment variables
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    };
    
    console.log('Environment check:', config);
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary diagnostics',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'NOT SET',
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'NOT SET'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Diagnostics error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'NOT SET',
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
      }
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const testMode = formData.get('test') === 'true';
    
    console.log('🧪 Running Cloudinary upload test...');
    
    let testBuffer;
    let fileName = 'diagnostic-test';
    
    if (testMode) {
      // Create a tiny test image (1x1 PNG)
      testBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x35, 0x04, 0x6B, 0xEE, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fileName = 'test-pixel';
    } else {
      const file = formData.get('file');
      if (!file) {
        return NextResponse.json({ 
          success: false, 
          error: 'No file provided and not in test mode' 
        }, { status: 400 });
      }
      testBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name || 'uploaded-file';
    }
    
    console.log('📤 Uploading test file...');
    
    const result = await uploadImageToCloudinary(testBuffer, {
      folder: 'diagnostics',
      public_id: `diagnostic-${Date.now()}`
    });
    
    console.log('✅ Upload successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary upload test successful',
      result: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height
      },
      fileName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Upload test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
