import { NextResponse } from 'next/server'
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '@/lib/cloudinary-utils'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const folder = formData.get('folder') || 'wear-and-earn'
    const publicId = formData.get('public_id')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await uploadImageToCloudinary(buffer, {
      folder,
      public_id: publicId,
      overwrite: !!publicId
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('public_id')

    if (!publicId) {
      return NextResponse.json({ error: 'No public_id provided' }, { status: 400 })
    }

    const result = await deleteImageFromCloudinary(publicId)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    )
  }
}
