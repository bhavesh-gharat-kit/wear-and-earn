/**
 * Upload file to Cloudinary using signed upload
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (default: 'wear-and-earn')
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export async function uploadToCloudinary(file, options = {}) {
  const { folder = 'wear-and-earn', onProgress } = options

  // Get signed params from our API
  const signUrl = folder ? `/api/uploads/sign?folder=${encodeURIComponent(folder)}` : '/api/uploads/sign'
  const res = await fetch(signUrl)
  if (!res.ok) throw new Error('Failed to get upload signature')
  const { timestamp, signature, cloudName, apiKey, folder: signedFolder } = await res.json()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder', signedFolder)

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!uploadRes.ok) throw new Error('Cloudinary upload failed')
  const json = await uploadRes.json()
  return json
}

/**
 * Enhanced upload with progress tracking and validation
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFileToCloudinary(file, options = {}) {
  const { 
    folder = 'wear-and-earn', 
    onProgress,
    maxSize = 10 * 1024 * 1024 // 10MB default
  } = options

  // Validate file
  if (!file) {
    throw new Error('No file provided')
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
  }

  // Use the basic upload function
  return uploadToCloudinary(file, { folder, onProgress })
}
