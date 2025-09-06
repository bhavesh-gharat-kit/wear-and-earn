'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Copy, Share2, X, Gift } from 'lucide-react'

const PaymentSuccessModal = ({ 
  isOpen, 
  onClose, 
  orderData, 
  referralCode,
  onGoToOrder 
}) => {
  const [copying, setCopying] = useState(false)
  const [autoCloseTimer, setAutoCloseTimer] = useState(15)

  useEffect(() => {
    let interval
    if (isOpen && autoCloseTimer > 0) {
      interval = setInterval(() => {
        setAutoCloseTimer(prev => prev - 1)
      }, 1000)
    } else if (autoCloseTimer === 0) {
      onGoToOrder()
    }

    return () => clearInterval(interval)
  }, [isOpen, autoCloseTimer, onGoToOrder])

  const copyReferralCode = async () => {
    if (!referralCode) return
    
    try {
      setCopying(true)
      await navigator.clipboard.writeText(referralCode)
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopying(false)
    }
  }

  const shareOnWhatsApp = () => {
    if (!referralCode) return
    
    const message = `🎉 Great news! I just shopped on WearEarn and it's amazing!

Want to join me and start earning? Use my referral code: ${referralCode}

✨ What you get:
• Quality products at great prices
• Earn money on every purchase
• Build your income network
• Weekly payouts

Register now and start earning! 🚀`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h2>
          <p className="text-green-100">Your order has been placed successfully</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {referralCode ? (
            <>
              {/* Referral Code Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Your Referral Code is Ready!</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-white border-2 border-purple-300 text-purple-900 px-4 py-2 rounded-lg font-mono font-bold text-center flex-1">
                    {referralCode}
                  </div>
                  <button 
                    onClick={copyReferralCode}
                    disabled={copying}
                    className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 min-w-[70px] flex items-center justify-center"
                  >
                    {copying ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-purple-700 text-sm">
                  Share this code with friends and earn commission on their purchases!
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 mb-4">
                <button 
                  onClick={shareOnWhatsApp}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share Now
                </button>
                
                <button 
                  onClick={() => window.location.href = '/account#referral'}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Manage Referrals
                </button>
              </div>
            </>
          ) : (
            <div className="text-center mb-4">
              <p className="text-gray-600">Your referral code will be available shortly in your account dashboard.</p>
            </div>
          )}

          {/* Order Info */}
          {orderData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
              <p className="text-sm text-gray-600">Order #: {orderData.id}</p>
              <p className="text-sm text-gray-600">Amount: ₹{(orderData.total / 100).toFixed(2)}</p>
            </div>
          )}

          {/* Auto Close Timer */}
          <div className="text-center">
            <button
              onClick={onGoToOrder}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              View Order Details ({autoCloseTimer}s)
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Automatically redirecting in {autoCloseTimer} seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessModal
