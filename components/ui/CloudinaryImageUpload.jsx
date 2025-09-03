'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadToCloudinary } from '@/lib/upload-to-cloudinary'

export default function CloudinaryImageUpload({ 
  onUploadSuccess, 
  onUploadError,
  maxFiles = 1,
  acceptedTypes = "image/*",
  folder = "wear-and-earn",
  className = ""
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return
    
    setUploading(true)
    const uploadPromises = []
    
    try {
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`)
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`)
        }
        
        uploadPromises.push(uploadToCloudinary(file))
      }
      
      const results = await Promise.all(uploadPromises)
      const newImages = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: result.original_filename
      }))
      
      setUploadedImages(prev => [...prev, ...newImages])
      
      if (onUploadSuccess) {
        onUploadSuccess(maxFiles === 1 ? newImages[0] : newImages)
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      if (onUploadError) {
        onUploadError(error.message)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    if (onUploadSuccess) {
      onUploadSuccess(maxFiles === 1 ? null : newImages)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, JPEG up to 5MB {maxFiles > 1 && `(max ${maxFiles} files)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={image.originalName}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                {image.originalName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
