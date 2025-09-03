'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadFileToCloudinary } from '@/lib/upload-to-cloudinary'

const KYC_DOCUMENT_TYPES = {
  aadhar: { label: 'Aadhar Card', accept: 'image/*,.pdf' },
  pan: { label: 'PAN Card', accept: 'image/*,.pdf' },
  passport: { label: 'Passport', accept: 'image/*,.pdf' },
  voter_id: { label: 'Voter ID', accept: 'image/*,.pdf' },
  driving_license: { label: 'Driving License', accept: 'image/*,.pdf' },
  bank_statement: { label: 'Bank Statement', accept: 'image/*,.pdf' },
  other: { label: 'Other Document', accept: 'image/*,.pdf' }
}

export default function KYCDocumentUpload({ 
  documentType = 'other',
  onUploadSuccess, 
  onUploadError,
  className = ""
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const docConfig = KYC_DOCUMENT_TYPES[documentType] || KYC_DOCUMENT_TYPES.other

  const handleFileUpload = async (file) => {
    if (!file) return
    
    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Validate file type
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
      if (!isValidType) {
        throw new Error('Only images and PDF files are allowed for KYC documents')
      }
      
      // Validate file size (5MB limit for KYC)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }
      
      const result = await uploadFileToCloudinary(file, {
        folder: `kyc_documents/${documentType}`,
        onProgress: setUploadProgress
      })
      
      const fileData = {
        ...result,
        originalName: file.name,
        documentType,
        uploadedAt: new Date().toISOString()
      }
      
      setUploadedFile(fileData)
      
      if (onUploadSuccess) {
        onUploadSuccess(fileData)
      }
      
    } catch (error) {
      console.error('KYC upload error:', error)
      if (onUploadError) {
        onUploadError(error.message)
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
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
    if (files[0]) {
      handleFileUpload(files[0])
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (onUploadSuccess) {
      onUploadSuccess(null)
    }
  }

  const getFileIcon = (file) => {
    if (file.url.includes('.pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    return (
      <img 
        src={file.url} 
        alt={file.originalName}
        className="h-16 w-16 object-cover rounded"
      />
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {docConfig.label}
        </h3>
        {uploadedFile && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Uploaded
          </span>
        )}
      </div>

      {!uploadedFile ? (
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
            accept={docConfig.accept}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
            className="hidden"
          />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading... {uploadProgress}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Upload {docConfig.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, JPEG, PDF up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(uploadedFile)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {uploadedFile.originalName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Uploaded: {new Date(uploadedFile.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={removeFile}
              className="p-1 text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
