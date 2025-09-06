'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Package, 
  Wallet, 
  Users, 
  Share2, 
  FileText, 
  Settings,
  Copy,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  UserPlus,
  Award,
  ChevronRight,
  Download,
  Upload,
  Check,
  X,
  AlertCircle,
  Calendar,
  CreditCard,
  Banknote,
  TrendingDown,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Mail,
  MessageSquare,
  Lightbulb
} from 'lucide-react'

// KYC Form Component
const KYCForm = ({ userData, kycData, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: kycData?.fullName || userData?.fullName || '',
    dateOfBirth: kycData?.dateOfBirth ? new Date(kycData.dateOfBirth).toISOString().split('T')[0] : '',
    gender: kycData?.gender || '',
    fatherName: kycData?.fatherName || '',
    aadharNumber: kycData?.aadharNumber || '',
    panNumber: kycData?.panNumber || '',
    bankAccountNumber: kycData?.bankAccountNumber || '',
    ifscCode: kycData?.ifscCode || '',
    bankName: kycData?.bankName || '',
    branchName: kycData?.branchName || ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/account/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setMessage('KYC application submitted successfully! Your documents are under review.')
        onSubmit() // Refresh KYC data
      } else {
        setMessage(data.error || 'Failed to submit KYC application')
      }
    } catch (error) {
      setMessage('Error submitting KYC application')
      console.error('KYC submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // If user is already verified
  if (userData?.isKycApproved) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">KYC Verified Successfully</h3>
        <p className="text-gray-600 dark:text-gray-300">Your account has been verified and you can now access all features.</p>
      </div>
    )
  }

  // If KYC is submitted and pending
  if (kycData?.status === 'pending') {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">KYC Under Review</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Your KYC documents are being reviewed by our team.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">This process usually takes 24-48 hours.</p>
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Submitted on:</strong> {new Date(kycData.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }

  // Show form for new submission or resubmission (if rejected)
  return (
    <div>
      {kycData?.status === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">Resubmission Required</h4>
          <p className="text-sm text-red-800 dark:text-red-400">
            Your previous KYC application was rejected. Please review the feedback and submit updated information.
          </p>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter your full name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              <input 
                type="date" 
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Father&apos;s Name</label>
              <input 
                type="text" 
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter father's name" 
              />
            </div>
          </div>
        </div>

        {/* Identity Documents */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Identity Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aadhar Number</label>
              <input 
                type="text" 
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                required
                pattern="[0-9]{12}"
                maxLength="12"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter 12-digit Aadhar number" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PAN Number</label>
              <input 
                type="text" 
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                required
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                maxLength="10"
                style={{ textTransform: 'uppercase' }}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter PAN number" 
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Bank Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Account Number</label>
              <input 
                type="text" 
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter account number" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IFSC Code</label>
              <input 
                type="text" 
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                required
                pattern="[A-Z]{4}0[A-Z0-9]{6}"
                maxLength="11"
                style={{ textTransform: 'uppercase' }}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter IFSC code" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Name</label>
              <input 
                type="text" 
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter bank name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch Name</label>
              <input 
                type="text" 
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter branch name" 
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : kycData?.status === 'rejected' ? 'Resubmit KYC Application' : 'Submit KYC Application'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Wallet Actions Component
const WalletActions = ({ walletBalance }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [message, setMessage] = useState('')

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setMessage('Please enter a valid amount')
      return
    }

    if (parseFloat(withdrawAmount) > walletBalance) {
      setMessage('Insufficient balance')
      return
    }

    setWithdrawing(true)
    setMessage('')

    try {
      const response = await fetch('/api/account/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Withdrawal request submitted successfully!')
        setWithdrawAmount('')
        setShowWithdrawModal(false)
        // Refresh wallet data
        window.location.reload()
      } else {
        setMessage(data.error || 'Failed to submit withdrawal request')
      }
    } catch (error) {
      setMessage('Error submitting withdrawal request')
      console.error('Withdrawal error:', error)
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <button 
          onClick={() => setShowWithdrawModal(true)}
          className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Download className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-700">Withdraw Money</p>
        </button>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                min="500"
                max={walletBalance}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available balance: ₹{walletBalance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">
                Minimum withdrawal: ₹500
              </p>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setWithdrawAmount('')
                  setMessage('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {withdrawing ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Referral Section Component
const ReferralSection = ({ userData }) => {
  const router = useRouter()
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  const fetchReferralData = useCallback(async (retryCount = 0) => {
    try {
      console.log('🔍 Fetching referral data...')
      const response = await fetch('/api/account/referral')
      
      console.log('🔍 Response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ User not authenticated, redirecting to login')
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔍 API Response:', data)
      
      if (data.success) {
        console.log('✅ Referral data received:', data.data)
        setReferralData(data.data)
      } else {
        console.log('⚠️ Referral not available:', data.message)
        setReferralData({
          isActive: false,
          message: data.message || 'You need to make your first purchase to get your referral link'
        })
      }
    } catch (error) {
      console.error('❌ Error fetching referral data:', error)
      setReferralData({
        isActive: false,
        message: 'Unable to load referral data. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchReferralData()
  }, [fetchReferralData])

  const copyToClipboard = async (text) => {
    try {
      setCopying(true)
      await navigator.clipboard.writeText(text)
      // You might want to add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    } finally {
      setCopying(false)
    }
  }

  const generateShareMessage = async (platform) => {
    try {
      const response = await fetch('/api/account/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })
      const data = await response.json()
      
      if (data.success) {
        if (platform === 'whatsapp') {
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(data.data.message)}`
          window.open(whatsappUrl, '_blank')
        } else if (platform === 'email') {
          const subject = encodeURIComponent('Join WearEarn - Earn Money While Shopping!')
          const body = encodeURIComponent(data.data.message)
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
        } else if (platform === 'sms') {
          window.open(`sms:?body=${encodeURIComponent(data.data.message)}`, '_blank')
        } else {
          copyToClipboard(data.data.message)
        }
      }
    } catch (error) {
      console.error('Error generating share message:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading referral data...</p>
      </div>
    )
  }

  if (!referralData || !referralData.referralCode) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Link Not Available</h3>
        <p className="text-gray-600 mb-4">
          {referralData?.message || 'You need to make your first purchase to get your referral link and start earning commissions.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => router.push('/products')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Shop Now
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 p-6 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-500 p-2 rounded-full">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Referral Code</h3>
            <p className="text-purple-700 dark:text-purple-300 text-sm">Share this code to start earning!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 text-purple-900 dark:text-purple-100 px-6 py-3 rounded-lg font-mono text-2xl font-bold flex-1 text-center">
            {referralData.referralCode}
          </div>
          <button 
            onClick={() => copyToClipboard(referralData.referralCode)}
            disabled={copying}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
          >
            <Copy className="w-4 h-4" />
            {copying ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className="mb-2 font-medium">Share this URL:</p>
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 rounded text-xs break-all">
            {referralData.referralUrl}
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      {referralData.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{referralData.stats.totalReferrals || 0}</div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{referralData.stats.activeReferrals || 0}</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">₹{((referralData.stats.totalEarnings || 0) / 100).toFixed(0)}</div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </div>
        </div>
      )}

      {/* Share Options */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Share Your Referral Link</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => generateShareMessage('whatsapp')}
            className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-center"
          >
            <Share2 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">WhatsApp</p>
          </button>
          <button 
            onClick={() => generateShareMessage('email')}
            className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 p-3 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-center"
          >
            <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Email</p>
          </button>
          <button 
            onClick={() => generateShareMessage('sms')}
            className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-center"
          >
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">SMS</p>
          </button>
          <button 
            onClick={() => copyToClipboard(referralData.referralUrl)}
            className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 p-3 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-center"
          >
            <Copy className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Copy Link</p>
          </button>
        </div>
      </div>

      {/* Referral Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Share your referral code or link with friends and family</li>
          <li>• When they register and make their first purchase, you earn commission</li>
          <li>• Build your team and earn from multiple levels</li>
          <li>• The more active your team, the more you earn!</li>
        </ul>
      </div>
    </div>
  )
}

const AccountDashboard = () => {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('wallet')
  const [showBalance, setShowBalance] = useState(true)
  const [userData, setUserData] = useState(null)
  const [mlmData, setMlmData] = useState(null)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [kycData, setKycData] = useState(null)
  const [walletData, setWalletData] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kycForm, setKycForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    fatherName: '',
    aadharNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    nomineeName: '',
    nomineeRelation: ''
  })
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }
    
    if (session?.user?.id) {
      fetchUserData()
      fetchMlmData()
      fetchOrders()
      fetchStats()
      fetchKycData()
      fetchWalletData()
      fetchTeamData()
    } else {
      setLoading(false)
    }
  }, [session, status])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/account/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchMlmData = async () => {
    try {
      const response = await fetch('/api/account/mlm-profile')
      if (response.ok) {
        const data = await response.json()
        // Normalize API shape to what the UI expects
        const d = data || {}
        const user = d.user || {}
        const team = d.team || {}
        const wallet = d.wallet || {}
        const earnings = wallet.earnings || {}
        const recent = wallet.recentTransactions || []

        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const normalized = {
          // Status
          isActive: !!user.isActive,
          // Referral basics
          referralCode: user.referralCode || null,
          referralLink: user.referralLink || (user.id ? `${origin}/login-register?spid=${user.id}` : null),
          // Wallet summary (amounts in paisa as per UI usage)
          walletBalance: wallet?.balance?.paisa ?? 0,
          totalEarnings: wallet?.totalEarned?.paisa ?? 0,
          monthlyEarnings: wallet?.monthlyEarnings?.paisa ?? 0,
          withdrawableBalance: wallet?.balance?.paisa ?? 0,
          totalWithdrawn: 0,
          // Team summary
          totalReferrals: team?.totalMembers ?? team?.directReferrals ?? 0,
          activeReferrals: 0,
          level: 1,
          teamVolume: 0,
          levelBreakdown: {},
          monthlyTeamSales: 0,
          totalTeamEarnings: 0,
          teamCommission: 0,
          monthlyNewMembers: 0,
          // Earnings breakdown (best-effort if available elsewhere)
          referralEarnings: 0,
          levelEarnings: 0,
          bonusEarnings: 0,
          // Recent transactions mapped to UI fields
          recentTransactions: recent.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: typeof tx.amount === 'number' ? tx.amount : (tx.amount?.paisa ?? 0),
            date: tx.createdAt,
            note: tx.note,
            levelDepth: tx.levelDepth
          }))
        }

        setMlmData(normalized)
      }
    } catch (error) {
      console.error('Error fetching MLM data:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/account/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/account/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchKycData = async () => {
    try {
      const response = await fetch('/api/account/kyc')
      if (response.ok) {
        const data = await response.json()
        setKycData(data?.kycData || null)
        // Pre-fill only safe non-sensitive fields when available
        if (data?.hasKyc && data?.kycData) {
          setKycForm(prev => ({
            ...prev,
            fullName: data.kycData.fullName || '',
            dateOfBirth: data.kycData.dateOfBirth ? new Date(data.kycData.dateOfBirth).toISOString().slice(0,10) : '',
            gender: data.kycData.gender || '',
            fatherName: data.kycData.fatherName || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error)
    }
  }

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/account/wallet')
      if (response.ok) {
        const data = await response.json()
        setWalletData(data)
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    }
  }

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/account/team')
      if (response.ok) {
        const data = await response.json()
        setTeamData(data)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setWithdrawLoading(true)
    try {
      const response = await fetch('/api/account/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      })

      if (response.ok) {
        alert('Withdrawal request submitted successfully!')
        setWithdrawAmount('')
        fetchMlmData() // Refresh wallet data
        fetchWalletData() // Refresh detailed wallet data
      } else {
        const error = await response.json()
        alert(error.message || 'Withdrawal failed')
      }
    } catch (error) {
      alert('Network error occurred')
    }
    setWithdrawLoading(false)
  }

  const handleKycSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/account/kyc', {
        method: kycData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycForm)
      })

      if (response.ok) {
        alert('KYC information submitted successfully!')
        fetchKycData()
      } else {
        const error = await response.json()
        alert(error.message || 'KYC submission failed')
      }
    } catch (error) {
      alert('Network error occurred')
    }
  }

  const copyReferralCode = () => {
    if (mlmData?.referralCode) {
      navigator.clipboard.writeText(mlmData.referralCode)
      alert('Referral code copied to clipboard!')
    }
  }

  const copyReferralLink = () => {
    const link = mlmData?.referralLink || (mlmData?.referralCode ? `${window.location.origin}/login-register?spid=${mlmData.referralCode}` : null)
    if (link) {
      navigator.clipboard.writeText(link)
      alert('Referral link copied to clipboard!')
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userData?.fullName || session?.user?.name || 'User'}! 👋
            </h1>
            <p className="text-indigo-100 text-lg">
              {userData?.isActive ? 'Your MLM account is active' : 'Complete your first purchase to activate MLM benefits'}
            </p>
            <div className="flex items-center mt-4 space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData?.isActive ? 'bg-green-500 bg-opacity-20 text-green-100' : 'bg-yellow-500 bg-opacity-20 text-yellow-100'
              }`}>
                {userData?.isActive ? '✓ Active Member' : '⏳ Pending Activation'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData?.isKycApproved ? 'bg-green-500 bg-opacity-20 text-green-100' : 'bg-red-500 bg-opacity-20 text-red-100'
              }`}>
                {userData?.isKycApproved ? '✓ KYC Verified' : '⚠ KYC Pending'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200 mb-1">Member Since</div>
            <div className="text-lg font-semibold">
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.totalOrders || 0}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                +{stats?.monthlyOrders || 0} this month
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-gray-800">₹{stats?.totalSpent || 0}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                ₹{stats?.monthlySpent || 0} this month
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Team Size</p>
              <p className="text-3xl font-bold text-gray-800">{mlmData?.totalReferrals || 0}</p>
              <p className="text-xs text-purple-600 font-medium mt-1">
                Level {mlmData?.level || 1} Member
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold text-gray-800">
                {showBalance ? `₹${(mlmData?.walletBalance || 0) / 100}` : '₹ ****'}
              </p>
              <p className="text-xs text-yellow-600 font-medium mt-1">
                +₹{(mlmData?.monthlyEarnings || 0) / 100} this month
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Wallet className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-blue-600" />
            Referral Program
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <code className="font-mono font-bold text-lg">
                  {mlmData?.referralCode || 'N/A'}
                </code>
                <button
                  onClick={copyReferralCode}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy code"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={copyReferralLink}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Copy Referral Link
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-green-600" />
            Quick Withdraw
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !userData?.isKycApproved}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {withdrawLoading ? 'Processing...' : 'Withdraw Funds'}
            </button>
            {!userData?.isKycApproved && (
              <p className="text-xs text-red-600 text-center">
                Complete KYC verification to withdraw funds
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            Account Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">MLM Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userData?.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {userData?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">KYC Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userData?.isKycApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userData?.isKycApproved ? 'Verified' : 'Pending'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('kyc')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {userData?.isKycApproved ? 'View KYC' : 'Complete KYC'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View All <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
        
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.total}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No orders yet</h4>
            <p className="text-gray-400 mb-4">Start shopping to see your orders here</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Orders</option>
            <option>Pending</option>
            <option>In Process</option>
            <option>Delivered</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
                    <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.deliveredAt && (
                      <p className="text-green-600 text-sm">
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'inProcess' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status === 'inProcess' ? 'In Process' : 
                     order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">₹{order.total}</p>
                    <p className="text-sm text-gray-500">
                      Including ₹{order.deliveryCharges} delivery
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Delivery Address</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{order.address}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>₹{(order.total - order.deliveryCharges - order.gstAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST:</span>
                        <span>₹{order.gstAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery:</span>
                        <span>₹{order.deliveryCharges}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total:</span>
                        <span>₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Download Invoice
                  </button>
                  {order.status === 'delivered' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Reorder
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No orders found</h3>
          <p className="text-gray-400 mb-6">You haven&apos;t placed any orders yet</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Start Shopping
          </button>
        </div>
      )}
    </div>
  )

  const renderWalletTab = () => {
    const wallet = walletData || {}
    const balance = wallet.balance || {}
    const earnings = wallet.earnings || {}
    const transactions = wallet.transactions?.data || []
    const pendingPayouts = wallet.pendingPayouts?.list || []
    
    return (
    <div className="space-y-8">
      {/* Wallet Header */}
      <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Wallet 💰</h2>
            <p className="text-green-100 mb-6">Track your earnings and manage withdrawals</p>
            <div className="flex items-center space-x-4">
              <div className="text-6xl font-bold">
                {showBalance ? `₹${balance.rupees?.toFixed(2) || '0.00'}` : '₹ ****'}
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-4 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300 hover:scale-110"
              >
                {showBalance ? <EyeOff size={28} /> : <Eye size={28} />}
              </button>
            </div>
            <p className="text-green-100 text-lg mt-3">Available for withdrawal</p>
          </div>
          <div className="text-right">
            <div className="p-6 bg-white bg-opacity-20 rounded-2xl">
              <Wallet className="w-16 h-16 mx-auto mb-3" />
              <p className="text-lg font-semibold">Digital Wallet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <TrendingUp className="w-10 h-10" />
            </div>
            <div>
              <p className="text-green-100 text-sm font-medium">Total Earnings</p>
              <p className="text-3xl font-bold">₹{earnings.total?.rupees?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-green-200 font-medium">Lifetime earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <Calendar className="w-10 h-10" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold">₹{earnings.monthly?.rupees?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-blue-200 font-medium">Current month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <CreditCard className="w-10 h-10" />
            </div>
            <div>
              <p className="text-purple-100 text-sm font-medium">Withdrawable</p>
              <p className="text-3xl font-bold">₹{balance.rupees?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-purple-200 font-medium">Ready to withdraw</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <Clock className="w-10 h-10" />
            </div>
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold">₹{wallet.pendingPayouts?.totalAmount?.rupees?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-orange-200 font-medium">{pendingPayouts.length} payouts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Purchase Status */}
      {wallet.monthlyPurchase && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center">
            <Award className="w-6 h-6 mr-3" />
            Monthly Purchase Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <p className="text-sm text-gray-600 mb-2">Current Month</p>
              <p className="text-3xl font-bold text-orange-600">₹{wallet.monthlyPurchase?.current?.rupees?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <p className="text-sm text-gray-600 mb-2">Required</p>
              <p className="text-3xl font-bold text-gray-800">₹{wallet.monthlyPurchase?.required?.rupees?.toFixed(2) || '500.00'}</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <span className={`inline-block px-6 py-3 rounded-xl text-lg font-bold ${
                wallet.monthlyPurchase?.isEligible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {wallet.monthlyPurchase?.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Withdraw Section */}
        <div className="bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg border-2 border-green-200">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-green-800">
            <Download className="w-6 h-6 mr-3" />
            Withdraw Funds
          </h3>
          {userData?.isKycApproved ? (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 text-xl font-semibold"
                    min="100"
                    max={balance.rupees || 0}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Minimum: ₹100 | Maximum: ₹{balance.rupees?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">Bank Transfer Details</h4>
                <p className="text-gray-700 mb-2">
                  Funds will be transferred to your registered bank account
                </p>
                <p className="text-sm text-gray-500">
                  Processing time: 1-3 business days
                </p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !withdrawAmount || withdrawAmount < 100}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
              >
                {withdrawLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-3" />
                    Withdraw Now
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h4 className="text-xl font-bold text-gray-600 mb-3">KYC Verification Required</h4>
              <p className="text-gray-500 mb-6">Complete your KYC verification to withdraw funds</p>
              <button
                onClick={() => setActiveTab('kyc')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold"
              >
                Complete KYC Now
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg border-2 border-blue-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold flex items-center text-blue-800">
              <Clock className="w-6 h-6 mr-3" />
              Recent Transactions
            </h3>
            <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {transactions.length > 0 ? (
              transactions.slice(0, 8).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-md border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      transaction.isCredit ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.isCredit ? 
                        <TrendingUp className="w-6 h-6 text-green-600" /> : 
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                      {transaction.levelDepth && (
                        <p className="text-xs text-blue-600 font-medium">Level {transaction.levelDepth}</p>
                      )}
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${
                    transaction.isCredit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.isCredit ? '+' : ''}₹{transaction.amount.rupees?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No transactions yet</p>
                <p className="text-gray-400">Start earning to see your transaction history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Earning Sources */}
      {earnings.byType && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-purple-200">
          <h3 className="text-2xl font-bold mb-8 text-purple-800 flex items-center">
            <Star className="w-6 h-6 mr-3" />
            Earning Sources Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {earnings.byType.sponsor_commission && (
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-blue-200">
                <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="font-bold text-gray-800 mb-3 text-lg">Sponsor Commissions</h4>
                <p className="text-3xl font-bold text-blue-600 mb-2">₹{earnings.byType.sponsor_commission.rupees?.toFixed(2) || '0.00'}</p>
                <p className="text-gray-600">From direct referrals</p>
              </div>
            )}
            
            {earnings.byType.repurchase_commission && (
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-green-200">
                <TrendingUp className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h4 className="font-bold text-gray-800 mb-3 text-lg">Repurchase Commissions</h4>
                <p className="text-3xl font-bold text-green-600 mb-2">₹{earnings.byType.repurchase_commission.rupees?.toFixed(2) || '0.00'}</p>
                <p className="text-gray-600">From team purchases</p>
              </div>
            )}
            
            {earnings.byType.self_joining_instalment && (
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-yellow-200">
                <Award className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h4 className="font-bold text-gray-800 mb-3 text-lg">Self Joining Bonus</h4>
                <p className="text-3xl font-bold text-yellow-600 mb-2">₹{earnings.byType.self_joining_instalment.rupees?.toFixed(2) || '0.00'}</p>
                <p className="text-gray-600">Weekly instalments</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

  const renderTeamTab = () => {
    const team = teamData || {}
    const hierarchy = team.hierarchy || {}
    const stats = team.stats || {}
    const directReferrals = team.directReferrals?.data || []
    const levels = team.levels || []
    
    return (
    <div className="space-y-8">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-white p-8 rounded-3xl shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">My Team 👥</h2>
            <p className="text-blue-100 mb-6 text-lg">Build and grow your network</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white bg-opacity-20 px-4 py-3 rounded-xl">
                <span className="text-blue-100 font-medium">Total Team Size:</span>
                <span className="font-bold text-2xl">{stats.totalMembers || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white bg-opacity-20 px-4 py-3 rounded-xl">
                <span className="text-blue-100 font-medium">Direct Referrals:</span>
                <span className="font-bold text-2xl">{stats.directReferrals || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white bg-opacity-20 px-4 py-3 rounded-xl">
                <span className="text-blue-100 font-medium">Active Members:</span>
                <span className="font-bold text-2xl">{stats.activeMembers || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-40 h-40 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Users className="w-20 h-20" />
              </div>
              <p className="text-xl font-bold">Team Leader</p>
              <p className="text-blue-200">Network Builder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <UserPlus className="w-10 h-10" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Direct Referrals</p>
              <p className="text-3xl font-bold">{stats.directReferrals || 0}</p>
              <p className="text-xs text-blue-200 font-medium">Your direct invites</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <Users className="w-10 h-10" />
            </div>
            <div>
              <p className="text-green-100 text-sm font-medium">Total Team</p>
              <p className="text-3xl font-bold">{stats.totalMembers || 0}</p>
              <p className="text-xs text-green-200 font-medium">All levels combined</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <TrendingUp className="w-10 h-10" />
            </div>
            <div>
              <p className="text-yellow-100 text-sm font-medium">Active Members</p>
              <p className="text-3xl font-bold">{stats.activeMembers || 0}</p>
              <p className="text-xs text-yellow-200 font-medium">Monthly active</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <Star className="w-10 h-10" />
            </div>
            <div>
              <p className="text-purple-100 text-sm font-medium">Max Level</p>
              <p className="text-3xl font-bold">{hierarchy.maxLevel || 0}</p>
              <p className="text-xs text-purple-200 font-medium">Deepest level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Referrals Section */}
      <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg border-2 border-blue-200">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-blue-800 flex items-center">
            <UserPlus className="w-7 h-7 mr-3" />
            Direct Referrals
          </h3>
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold flex items-center shadow-lg">
            <Share2 className="w-5 h-5 mr-2" />
            Invite Friends
          </button>
        </div>

        {directReferrals.length > 0 ? (
          <div className="space-y-4">
            {directReferrals.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
                    <p className="text-gray-600">{member.email}</p>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${
                    member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                  {member.totalPurchases && (
                    <p className="text-sm text-gray-600 mt-2">
                      Purchases: ₹{member.totalPurchases.rupees?.toFixed(2) || '0.00'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <UserPlus className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h4 className="text-xl font-bold text-gray-600 mb-3">No direct referrals yet</h4>
            <p className="text-gray-500 mb-8 text-lg">Start building your team by inviting friends and family</p>
            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-bold text-lg flex items-center mx-auto shadow-lg">
              <Share2 className="w-6 h-6 mr-3" />
              Invite Your First Referral
            </button>
          </div>
        )}
      </div>
    </div>
  )}

  const renderReferralTab = () => (
    <div className="space-y-6">
      {/* Referral Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Referral Program 🚀</h2>
            <p className="text-purple-100 mb-4">Invite friends and earn amazing rewards together!</p>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-3xl font-bold">{mlmData?.totalReferrals || 0}</div>
                <p className="text-purple-200 text-sm">Total Invites</p>
              </div>
              <div>
                <div className="text-3xl font-bold">₹{((mlmData?.referralEarnings || 0) / 100).toFixed(0)}</div>
                <p className="text-purple-200 text-sm">Earned</p>
              </div>
              <div>
                <div className="text-3xl font-bold">{mlmData?.activeReferrals || 0}</div>
                <p className="text-purple-200 text-sm">Active</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Share2 className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Share & Earn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Code */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <User className="w-5 h-5 mr-2 text-purple-600" />
            Your Referral Code
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your unique code</p>
                  <code className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {mlmData?.referralCode || 'LOADING...'}
                  </code>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title="Copy referral code"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share this code with friends during their registration to earn rewards!
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <Share2 className="w-5 h-5 mr-2 text-blue-600" />
            Direct Referral Link
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={mlmData?.referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login-register?spid=${mlmData.referralCode}` : 'Loading...'}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 font-medium"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Share2 size={16} />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send this link directly to friends for easy registration with your referral.
            </p>
          </div>
        </div>
      </div>

      {/* MLM Status Check */}
      {!mlmData?.isActive ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
          <UserPlus className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">MLM Not Activated</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Make your first purchase to activate your MLM account and start earning referral rewards.
          </p>
          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          {/* Commission Structure */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Commission Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { level: 1, rate: '30%', color: 'bg-green-500' },
                  { level: 2, rate: '25%', color: 'bg-blue-500' },
                  { level: 3, rate: '20%', color: 'bg-purple-500' }
                ].map((item) => (
                  <div key={item.level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="font-medium">Level {item.level}</span>
                    </div>
                    <span className="font-bold text-lg">{item.rate}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[
                  { level: 4, rate: '15%', color: 'bg-yellow-500' },
                  { level: 5, rate: '10%', color: 'bg-pink-500' }
                ].map((item) => (
                  <div key={item.level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="font-medium">Level {item.level}</span>
                    </div>
                    <span className="font-bold text-lg">{item.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referral Statistics */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-6">Your Referral Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">{mlmData?.totalReferrals || 0}</div>
                <p className="text-gray-600">Total Referrals</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-1">{mlmData?.activeReferrals || 0}</div>
                <p className="text-gray-600">Active Members</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-1">₹{((mlmData?.totalEarnings || 0) / 100).toFixed(2)}</div>
                <p className="text-gray-600">Total Earnings</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderKYCTab = () => (
    <div className="space-y-6">
      {/* KYC Header */}
      <div className={`p-8 rounded-2xl shadow-xl text-white ${
        kycData?.status === 'approved' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
        kycData?.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
        'bg-gradient-to-br from-orange-500 to-yellow-600'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">KYC Verification 🔐</h2>
            <p className="text-white opacity-90 mb-4">
              {kycData?.status === 'approved' ? 'Your identity has been verified successfully' :
               kycData?.status === 'rejected' ? 'Your KYC application was rejected' :
               kycData?.status === 'pending' ? 'Your KYC application is under review' :
               'Complete your KYC verification to unlock all features'}
            </p>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                kycData?.status === 'approved' ? 'bg-green-100 text-green-800' :
                kycData?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                kycData?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {kycData?.status === 'approved' ? '✓ Verified' :
                 kycData?.status === 'rejected' ? '✗ Rejected' :
                 kycData?.status === 'pending' ? '⏳ Under Review' :
                 '⚠ Not Submitted'}
              </span>
              {kycData?.submittedAt && (
                <span className="text-sm opacity-75">
                  Submitted: {new Date(kycData.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              {kycData?.status === 'approved' ? 
                <CheckCircle className="w-12 h-12 mx-auto mb-2" /> :
                kycData?.status === 'rejected' ? 
                <XCircle className="w-12 h-12 mx-auto mb-2" /> :
                <Shield className="w-12 h-12 mx-auto mb-2" />
              }
              <p className="text-sm">KYC Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Benefits */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Benefits of KYC Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-800">Withdraw Funds</p>
              <p className="text-sm text-gray-600">Transfer earnings to bank</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-800">Enhanced Security</p>
              <p className="text-sm text-gray-600">Protect your account</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
            <Award className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-800">Higher Limits</p>
              <p className="text-sm text-gray-600">Increased transaction limits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Notice */}
      {kycData?.status === 'rejected' && kycData?.reviewNote && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">KYC Application Rejected</h4>
              <p className="text-red-700 mb-4">{kycData.reviewNote}</p>
              <p className="text-sm text-red-600">Please correct the issues and resubmit your application.</p>
            </div>
          </div>
        </div>
      )}

      {/* KYC Form */}
      {(!kycData || kycData.status === 'rejected') && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-6">
            {kycData?.status === 'rejected' ? 'Resubmit KYC Information' : 'Submit KYC Information'}
          </h3>
          
          <form onSubmit={handleKycSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm({...kycForm, fullName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={kycForm.dateOfBirth}
                    onChange={(e) => setKycForm({...kycForm, dateOfBirth: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    required
                    value={kycForm.gender}
                    onChange={(e) => setKycForm({...kycForm, gender: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.fatherName}
                    onChange={(e) => setKycForm({...kycForm, fatherName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter father's name"
                  />
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Identity Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.aadharNumber}
                    onChange={(e) => setKycForm({...kycForm, aadharNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 12-digit Aadhar number"
                    pattern="[0-9]{12}"
                    maxLength="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.panNumber}
                    onChange={(e) => setKycForm({...kycForm, panNumber: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PAN number"
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    maxLength="10"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Bank Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.bankAccountNumber}
                    onChange={(e) => setKycForm({...kycForm, bankAccountNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.ifscCode}
                    onChange={(e) => setKycForm({...kycForm, ifscCode: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter IFSC code"
                    pattern="[A-Z]{4}[0-9]{7}"
                    maxLength="11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.bankName}
                    onChange={(e) => setKycForm({...kycForm, bankName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.branchName}
                    onChange={(e) => setKycForm({...kycForm, branchName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
            </div>

            {/* Nominee Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Nominee Details (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominee Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.nomineeName}
                    onChange={(e) => setKycForm({...kycForm, nomineeName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter nominee name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship with Nominee
                  </label>
                  <select
                    value={kycForm.nomineeRelation}
                    onChange={(e) => setKycForm({...kycForm, nomineeRelation: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {kycData?.status === 'rejected' ? 'Resubmit KYC Information' : 'Submit KYC Information'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                By submitting, you agree that all information provided is accurate and complete.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* KYC Status for Submitted/Approved */}
      {kycData && kycData.status !== 'rejected' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-6">Your KYC Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Personal Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{kycData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium">
                    {new Date(kycData.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium capitalize">{kycData.gender}</span>
                </div>
                {kycData.fatherName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Father&apos;s Name:</span>
                    <span className="font-medium">{kycData.fatherName}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Documents</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aadhar:</span>
                  <span className="font-medium">••••••••{kycData.aadharNumber?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PAN:</span>
                  <span className="font-medium">{kycData.panNumber}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Bank Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">••••••••{kycData.bankAccountNumber?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IFSC:</span>
                  <span className="font-medium">{kycData.ifscCode}</span>
                </div>
                {kycData.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">{kycData.bankName}</span>
                  </div>
                )}
              </div>
            </div>

            {(kycData.nomineeName || kycData.nomineeRelation) && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Nominee Details</h4>
                <div className="space-y-2 text-sm">
                  {kycData.nomineeName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{kycData.nomineeName}</span>
                    </div>
                  )}
                  {kycData.nomineeRelation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Relationship:</span>
                      <span className="font-medium capitalize">{kycData.nomineeRelation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {kycData.status === 'pending' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 font-medium">Under Review</p>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Your KYC application is being reviewed. This usually takes 1-2 business days.
              </p>
            </div>
          )}

          {kycData.status === 'approved' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Verification Complete</p>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your identity has been verified. You can now withdraw funds and access all features.
              </p>
              {kycData.reviewedAt && (
                <p className="text-green-600 text-xs mt-1">
                  Approved on {new Date(kycData.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={userData?.name || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={userData?.email || ''}
                  className="w-full border rounded px-3 py-2"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue={userData?.phone || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  defaultValue={userData?.address || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    defaultValue={userData?.city || ''}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    defaultValue={userData?.postalCode || ''}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Security</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Change Password
              </button>
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Enable Two-Factor Authentication
              </button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-4">
              Save Changes
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'from-green-400 to-emerald-500' },
    { id: 'team', label: 'My Team', icon: Users, color: 'from-blue-400 to-indigo-500' },
    { id: 'referral', label: 'Referral', icon: Share2, color: 'from-purple-400 to-pink-500' },
    { id: 'kyc', label: 'KYC Verification', icon: FileText, color: 'from-orange-400 to-red-500' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow border p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access your account dashboard.</p>
          <a 
            href="/login-register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome back, {userData?.fullName || session?.user?.name || 'User'}!
                </h1>
                <p className="text-gray-600">
                  {userData?.isActive ? 'Your MLM account is active and earning!' : 'Complete your first purchase to unlock earnings'}
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <div className="text-center bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-xl font-semibold text-gray-900">
                    ₹{walletData?.balance?.rupees?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm p-8 min-h-96">
          {activeTab === 'wallet' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">My Wallet</h2>
              
              {/* Balance Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-gray-900">₹{walletData?.balance?.rupees?.toFixed(2) || '0.00'}</p>
                  </div>
                  <Wallet className="w-12 h-12 text-blue-500" />
                </div>
              </div>

              {/* Wallet Options */}
              <WalletActions walletBalance={walletData?.balance?.rupees || 0} />

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-xl font-semibold text-gray-900">₹{walletData?.earnings?.total?.rupees?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xl font-semibold text-gray-900">₹{walletData?.earnings?.monthly?.rupees?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'team' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">My Team</h2>
              
              {/* Team Data Display */}
              <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Data Available</h3>
                <p className="text-gray-600 mb-4">When you have team members, they will be displayed here in list format.</p>
                <p className="text-sm text-gray-500">Start referring people to build your team!</p>
              </div>
            </div>
          )}
          
          {activeTab === 'referral' && (
            <div id="referral">
              {/* Referral Code Card */}
              <ReferralSection userData={userData} />
            </div>
          )}
          
          {activeTab === 'kyc' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">KYC Verification</h2>
              
              {/* KYC Status */}
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    userData?.isKycApproved ? 'bg-green-500' : 
                    kycData?.status === 'pending' ? 'bg-yellow-500' : 
                    kycData?.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <p className="font-medium">
                    Status: {
                      userData?.isKycApproved ? '✅ Verified' : 
                      kycData?.status === 'pending' ? '⏳ Under Review' :
                      kycData?.status === 'rejected' ? '❌ Rejected' : '⏳ Pending Verification'
                    }
                  </p>
                </div>
                {kycData?.status === 'rejected' && kycData?.reviewNote && (
                  <p className="text-red-600 mt-2 text-sm">Reason: {kycData.reviewNote}</p>
                )}
              </div>

              {/* KYC Form */}
              <KYCForm userData={userData} kycData={kycData} onSubmit={() => fetchKycData()} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccountDashboard
