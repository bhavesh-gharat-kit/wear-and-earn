'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Gift, Users, CheckCircle } from 'lucide-react'

const PostPurchaseReferral = ({ orderId, className = "" }) => {
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        // Small delay to ensure order processing is complete
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const response = await fetch('/api/account/referral')
        const data = await response.json()
        
        if (data.success && data.data?.isActive) {
          setReferralData(data.data)
        }
      } catch (error) {
        console.error('Error fetching referral data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferralData()
  }, [orderId])

  const copyReferralCode = async () => {
    if (!referralData) return
    
    try {
      setCopying(true)
      await navigator.clipboard.writeText(referralData.referralCode)
      
      // Show success state
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopying(false)
    }
  }

  const shareOnWhatsApp = () => {
    if (!referralData) return
    
    const message = `🎉 I just shopped on WearEarn and got amazing deals!

You should try it too! Use my code: ${referralData.referralCode}

✨ Benefits:
• Quality products at great prices  
• Earn money on every purchase
• Build your income network
• Weekly payouts

Join here: ${referralData.referralUrl}

Happy shopping! 🛍️`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className={`${className} bg-purple-50 border border-purple-200 rounded-lg p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-purple-200 rounded mb-4"></div>
          <div className="h-4 bg-purple-200 rounded mb-2"></div>
          <div className="h-10 bg-purple-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!referralData) {
    return null
  }

  return (
    <div className={`${className} bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-500 p-2 rounded-full">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-purple-900">🎉 Congratulations on your purchase!</h3>
          <p className="text-purple-700 text-sm">Your referral link is now active - start earning more!</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-purple-800 mb-2">Your Referral Code</label>
        <div className="flex items-center gap-2">
          <div className="bg-white border-2 border-purple-300 text-purple-900 px-4 py-2 rounded-lg font-mono font-bold text-center flex-1">
            {referralData.referralCode}
          </div>
          <button 
            onClick={copyReferralCode}
            disabled={copying}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[80px] justify-center"
          >
            {copying ? (
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

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button 
          onClick={shareOnWhatsApp}
          className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Share2 className="w-4 h-4" />
          Share on WhatsApp
        </button>
        
        <button 
          onClick={() => window.location.href = '/account#referral'}
          className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Users className="w-4 h-4" />
          View Dashboard
        </button>
      </div>

      {/* Benefits */}
      <div className="bg-white/60 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">Start earning now:</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Share your code with friends and family</li>
          <li>• Earn commission when they make purchases</li>
          <li>• Build your team for recurring income</li>
          <li>• Get weekly payouts directly to your account</li>
        </ul>
      </div>
    </div>
  )
}

export default PostPurchaseReferral
