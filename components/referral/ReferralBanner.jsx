'use client'

import { useState, useEffect } from 'react'
import { X, Gift, ExternalLink, ChevronRight } from 'lucide-react'

const ReferralBanner = () => {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed this banner recently
    const dismissedTime = localStorage.getItem('referralBannerDismissed')
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
      return // Don't show if dismissed within last 24 hours
    }

    // Check if user is eligible for referral link
    const checkReferralEligibility = async () => {
      try {
        const response = await fetch('/api/account/referral')
        const data = await response.json()
        
        if (data.success && data.data?.isActive && data.data?.referralCode) {
          setShow(true)
        }
      } catch (error) {
        console.error('Error checking referral eligibility:', error)
      }
    }

    checkReferralEligibility()
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setShow(false)
    localStorage.setItem('referralBannerDismissed', Date.now().toString())
  }

  const handleGoToReferral = () => {
    window.location.href = '/account#referral'
  }

  if (!show || dismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                🎉 Your referral link is ready! Start sharing and earn from every referral.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToReferral}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            >
              Get Link
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReferralBanner
