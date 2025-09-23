'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Share2, 
  Copy, 
  Users, 
  UserPlus, 
  Mail, 
  MessageSquare, 
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

const ReferralSection = ({ userId }) => {
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState(null)

  const fetchReferralData = useCallback(async (retryCount = 0) => {
    try {
      setError(null)
      const response = await fetch('/api/account/referral')
      const data = await response.json()
      
      if (data.success) {
        setReferralData(data.data)
      } else {
        // Check if this is an activation-in-progress error
        if (data.hasOrders && retryCount < 2) {
          console.log('Account activation in progress, retrying in 3 seconds...')
          setTimeout(() => {
            fetchReferralData(retryCount + 1)
          }, 3000)
          return
        }
        setError(data.message || 'Failed to load referral data')
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReferralData()
  }, [fetchReferralData])

  const copyToClipboard = async (text, type = 'text') => {
    try {
      setCopying(type)
      await navigator.clipboard.writeText(text)
      
      // Show success feedback
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
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
        const message = data.data.message
        
        switch (platform) {
          case 'whatsapp':
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
            window.open(whatsappUrl, '_blank')
            break
          case 'email':
            const subject = encodeURIComponent('Join Wear And Earn - Earn Money While Shopping!')
            const body = encodeURIComponent(message)
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
            break
          case 'sms':
            window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
            break
          default:
            copyToClipboard(message, 'message')
        }
      }
    } catch (error) {
      console.error('Error generating share message:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Referral Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchReferralData()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!referralData?.isActive) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Program Not Active</h3>
          <p className="text-gray-600 mb-4">
            Complete your first purchase to activate your referral link and start earning commissions.
          </p>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Shop Now
          </button>
        </div>
      </div>
    )
  }

  const referralUrl = `https://wearnearn.com/register?spid=${userId}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
            <p className="text-blue-100">Share and earn commission on every referral</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{referralData.totalReferrals || 0}</div>
            <div className="text-sm text-blue-200">Total Referrals</div>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{referralData.totalReferrals || 0}</div>
              <div className="text-sm text-gray-500">Total Referrals</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{referralData.activeReferrals || 0}</div>
              <div className="text-sm text-gray-500">Active Referrals</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{referralData.monthlyReferrals || 0}</div>
              <div className="text-sm text-gray-500">This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code & Link */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Details</h3>
        
        {/* Referral Code */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-300 px-4 py-3 rounded-lg font-mono text-lg flex-1">
              {referralData.referralCode}
            </div>
            <button 
              onClick={() => copyToClipboard(referralData.referralCode, 'code')}
              disabled={copying === 'code'}
              className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              {copying === 'code' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Referral URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Referral URL</label>
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-300 px-4 py-3 rounded-lg text-sm flex-1 break-all">
              {referralUrl}
            </div>
            <button 
              onClick={() => copyToClipboard(referralUrl, 'url')}
              disabled={copying === 'url'}
              className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              {copying === 'url' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Share Options */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Referral Link</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => generateShareMessage('whatsapp')}
            className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-center group"
          >
            <Share2 className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-green-700">WhatsApp</p>
          </button>
          
          <button 
            onClick={() => generateShareMessage('email')}
            className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg hover:bg-indigo-100 transition-colors text-center group"
          >
            <Mail className="w-8 h-8 text-indigo-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-indigo-700">Email</p>
          </button>
          
          <button 
            onClick={() => generateShareMessage('sms')}
            className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center group"
          >
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-blue-700">SMS</p>
          </button>
          
          <button 
            onClick={() => generateShareMessage('copy')}
            className="bg-purple-50 border border-purple-200 p-4 rounded-lg hover:bg-purple-100 transition-colors text-center group"
          >
            <Copy className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-purple-700">Copy Message</p>
          </button>
        </div>
      </div>

      {/* Recent Referrals */}
      {referralData.recentReferrals && referralData.recentReferrals.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
          <div className="space-y-3">
            {referralData.recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{referral.name || 'New User'}</div>
                    <div className="text-sm text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${referral.isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                    {referral.isActive ? 'Active' : 'Pending'}
                  </div>
                  {referral.firstPurchase && (
                    <div className="text-xs text-gray-500">
                      ₹{referral.firstPurchase.toFixed(2)} earned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">How Referral Program Works:</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
            Share your referral code or link with friends and family
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
            When they register using your link and make their first purchase, you earn commission
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
            Build your team across 5 levels and earn from their purchases too
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
            More active referrals = higher commission eligibility and bonuses
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ReferralSection
