'use client'

import { useState, useEffect } from 'react'
import { 
  Copy, 
  Share2, 
  MessageSquare, 
  Mail, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Gift,
  Users,
  TrendingUp
} from 'lucide-react'

const ReferralShare = ({ className = "", variant = "full" }) => {
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchReferralData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/account/referral')
      const data = await response.json()
      
      if (data.success) {
        setReferralData(data.data)
      } else {
        setError(data.message || 'Failed to load referral data')
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchReferralData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchReferralData()
  }

  const copyToClipboard = async (text, type = 'text') => {
    try {
      setCopying(type)
      await navigator.clipboard.writeText(text)
      
      // Show success feedback
      setTimeout(() => setCopying(false), 1500)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopying(false)
    }
  }

  const shareViaWhatsApp = () => {
    if (!referralData) return
    
    const message = `🎉 Hey! I found this amazing shopping platform where you can earn money while shopping!

Join WearEarn using my referral code: ${referralData.referralCode}

✨ What you get:
• Quality products at great prices
• Earn commissions on every purchase
• Build your own earning network
• Weekly income payments

Register here: ${referralData.referralUrl}

Start earning today! 💰`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const shareViaEmail = () => {
    if (!referralData) return
    
    const subject = 'Join WearEarn - Start Earning While Shopping!'
    const body = `Hi there!

I wanted to share something exciting with you. I've been using WearEarn, a platform where you can shop for quality products AND earn money at the same time!

Here's what makes it special:
• Earn commissions on every purchase you make
• Get additional income by building your referral network
• Weekly payouts directly to your account
• Quality products at competitive prices

Use my referral code: ${referralData.referralCode}
Or register directly: ${referralData.referralUrl}

It's completely free to join and you start earning from your very first purchase!

Best regards,
${referralData.userName || 'Your Friend'}`

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  if (loading) {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} bg-yellow-50 border border-yellow-200 rounded-lg p-6`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 mb-1">Referral Link Not Available</h3>
            <p className="text-yellow-700 text-sm mb-3">{error}</p>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-yellow-700 hover:text-yellow-800 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!referralData?.isActive) {
    return (
      <div className={`${className} bg-blue-50 border border-blue-200 rounded-lg p-6`}>
        <div className="text-center">
          <Gift className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="font-semibold text-blue-900 mb-2">Get Your Referral Link!</h3>
          <p className="text-blue-700 text-sm mb-4">
            Complete your first purchase to unlock your referral link and start earning commissions.
          </p>
          <button 
            onClick={() => window.location.href = '/products'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Shop Now
          </button>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`${className} bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="font-medium text-gray-900">Share & Earn</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded font-mono text-sm flex-1">
            {referralData.referralCode}
          </div>
          <button 
            onClick={() => copyToClipboard(referralData.referralCode, 'code')}
            disabled={copying === 'code'}
            className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {copying === 'code' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={shareViaWhatsApp}
            className="flex-1 bg-green-500 text-white py-2 rounded text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
          <button 
            onClick={() => copyToClipboard(referralData.referralUrl, 'url')}
            className="flex-1 bg-gray-500 text-white py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            {copying === 'url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-white rounded-lg shadow-sm border`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share & Earn More</h2>
            <p className="text-gray-600 text-sm">Invite friends and earn commissions on their purchases</p>
          </div>
        </div>

        {/* Stats Row */}
        {referralData.stats && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{referralData.stats.totalReferrals || 0}</div>
              <div className="text-xs text-gray-500">Total Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{referralData.stats.activeReferrals || 0}</div>
              <div className="text-xs text-gray-500">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{((referralData.stats.totalEarnings || 0) / 100).toFixed(0)}</div>
              <div className="text-xs text-gray-500">Total Earned</div>
            </div>
          </div>
        )}

        {/* Referral Code Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Code</label>
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 rounded-lg font-mono text-lg flex-1">
              {referralData.referralCode}
            </div>
            <button 
              onClick={() => copyToClipboard(referralData.referralCode, 'code')}
              disabled={copying === 'code'}
              className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
            >
              {copying === 'code' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Quick Share Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={shareViaWhatsApp}
                className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-center group"
              >
                <Share2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Share on WhatsApp</p>
                <p className="text-xs text-green-600">With pre-written message</p>
              </button>
              
              <button 
                onClick={shareViaEmail}
                className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center group"
              >
                <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-700">Share via Email</p>
                <p className="text-xs text-blue-600">Professional template</p>
              </button>
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or copy your referral link</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={referralData.referralUrl} 
                readOnly 
                className="bg-gray-50 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm flex-1"
              />
              <button 
                onClick={() => copyToClipboard(referralData.referralUrl, 'url')}
                disabled={copying === 'url'}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[90px] justify-center"
              >
                {copying === 'url' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            How it works
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share your code with friends and family</li>
            <li>• They get special offers on their first purchase</li>
            <li>• You earn commissions from their purchases</li>
            <li>• Build a team and earn from multiple levels</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ReferralShare
