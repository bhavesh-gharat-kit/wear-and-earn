import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(request, { params }) {
  try {
    // Get the path from the URL
    const imagePath = params.path.join('/')
    const fullPath = path.join(process.cwd(), 'public', 'uploads', imagePath)
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('Image not found', { status: 404 })
    }
    
    // Read the file
    const imageBuffer = fs.readFileSync(fullPath)
    
    // Get file extension to determine content type
    const ext = path.extname(fullPath).toLowerCase()
    let contentType = 'image/jpeg' // default
    
    switch (ext) {
      case '.png':
        contentType = 'image/png'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.svg':
        contentType = 'image/svg+xml'
        break
    }
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
