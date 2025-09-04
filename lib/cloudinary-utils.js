import cloudinary from './cloudinary'

/**
 * Upload image to Cloudinary from server side
 */
export async function uploadImageToCloudinary(imageBuffer, options = {}) {
  try {
    const {
      folder = 'wear-and-earn',
      public_id,
      overwrite = false,
      transformation
    } = options

    // Validate environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary environment variables. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    }

    // Validate buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Invalid image buffer provided');
    }

    console.log('Attempting Cloudinary upload with options:', { folder, public_id, overwrite });
    console.log('Image buffer size:', imageBuffer.length, 'bytes');

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id,
          overwrite,
          transformation,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload_stream error:', error);
            console.error('Error details:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name
            });
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', result.secure_url);
            console.log('Upload details:', {
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes
            });
            resolve(result);
          }
        }
      );
      
      stream.end(imageBuffer);
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImageFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function getOptimizedImageUrl(publicId, options = {}) {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    secure: true
  })
}

/**
 * Get image upload signature for client-side uploads
 */
export function generateUploadSignature(paramsToSign) {
  return cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  )
}
