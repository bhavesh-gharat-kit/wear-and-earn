export async function uploadToCloudinary(file) {
  // Get signed params from our API
  const res = await fetch('/api/uploads/sign')
  if (!res.ok) throw new Error('Failed to get upload signature')
  const { timestamp, signature, cloudName, apiKey, folder } = await res.json()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder', folder)

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!uploadRes.ok) throw new Error('Cloudinary upload failed')
  const json = await uploadRes.json()
  // Returns secure_url, public_id, etc.
  return json
}
