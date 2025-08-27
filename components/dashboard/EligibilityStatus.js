'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Users, 
  TrendingUp, 
  RefreshCw,
  FileText,
  CreditCard,
  Target,
  Clock,
  Award,
  DollarSign,
  ShoppingCart
} from 'lucide-react'

const EligibilityStatus = () => {
  const [eligibilityData, setEligibilityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEligibilityData()
  }, [])

  const fetchEligibilityData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/account/eligibility')
      const data = await response.json()
      
      if (response.ok) {
        setEligibilityData(data)
      } else {
        setError(data.message || 'Failed to load eligibility data')
      }
    } catch (error) {
      console.error('Error fetching eligibility data:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'eligible':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'rejected':
      case 'ineligible':
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'eligible':
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'rejected':
      case 'ineligible':
      case 'inactive':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const calculateProgress = (current, required) => {
    if (!required || required === 0) return 100
    return Math.min((current / required) * 100, 100)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
            ))}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Eligibility</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchEligibilityData}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!eligibilityData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Eligibility Data</h3>
          <p className="text-gray-600">Complete your profile to check eligibility status.</p>
        </div>
      </div>
    )
  }

  const {
    kycStatus,
    threThreeRule,
    monthlyPurchase,
    commissionEligibility,
    nextEligibilityDate,
    overallStatus
  } = eligibilityData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Eligibility Status</h2>
            <p className="text-purple-100">Track your commission and benefit eligibility</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              overallStatus === 'eligible' 
                ? 'bg-green-500 bg-opacity-20 text-green-100' 
                : 'bg-yellow-500 bg-opacity-20 text-yellow-100'
            }`}>
              {getStatusIcon(overallStatus)}
              <span className="ml-2">
                {overallStatus === 'eligible' ? 'Fully Eligible' : 'Partially Eligible'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KYC Status */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(kycStatus?.status)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">KYC Verification</h3>
                <p className="text-sm opacity-75">Know Your Customer verification</p>
              </div>
            </div>
            {getStatusIcon(kycStatus?.status)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className="font-medium capitalize">{kycStatus?.status || 'Not Submitted'}</span>
            </div>
            {kycStatus?.submittedAt && (
              <div className="flex justify-between text-sm">
                <span>Submitted:</span>
                <span>{new Date(kycStatus.submittedAt).toLocaleDateString()}</span>
              </div>
            )}
            {kycStatus?.reviewedAt && (
              <div className="flex justify-between text-sm">
                <span>Reviewed:</span>
                <span>{new Date(kycStatus.reviewedAt).toLocaleDateString()}</span>
              </div>
            )}
            {kycStatus?.reviewNote && (
              <div className="mt-3 p-3 bg-white bg-opacity-50 rounded text-sm">
                <strong>Review Note:</strong> {kycStatus.reviewNote}
              </div>
            )}
          </div>

          {kycStatus?.status === 'pending' && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Your KYC is under review. You&apos;ll be notified once approved.
            </div>
          )}

          {kycStatus?.status === 'rejected' && (
            <div className="mt-4">
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                Resubmit KYC
              </button>
            </div>
          )}
        </div>

        {/* 3-3 Rule Status */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(threThreeRule?.status)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">3-3 Rule Status</h3>
                <p className="text-sm opacity-75">Repurchase commission eligibility</p>
              </div>
            </div>
            {getStatusIcon(threThreeRule?.status)}
          </div>

          <div className="space-y-3">
            {/* Direct Referrals Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Direct Referrals:</span>
                <span className="font-medium">{threThreeRule?.directReferrals || 0}/3</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress(threThreeRule?.directReferrals || 0, 3)}%` }}
                />
              </div>
            </div>

            {/* Qualifying Referrals Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Qualifying Referrals:</span>
                <span className="font-medium">{threThreeRule?.qualifyingReferrals || 0}/3</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress(threThreeRule?.qualifyingReferrals || 0, 3)}%` }}
                />
              </div>
            </div>

            {threThreeRule?.status === 'eligible' && (
              <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                You&apos;re eligible for repurchase commissions!
              </div>
            )}

            {threThreeRule?.status === 'ineligible' && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                <Target className="w-4 h-4 inline mr-2" />
                Need {3 - (threThreeRule?.directReferrals || 0)} more direct referrals with 3+ referrals each.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Purchase Progress */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(monthlyPurchase?.status)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Monthly Purchase</h3>
                <p className="text-sm opacity-75">₹500 minimum requirement</p>
              </div>
            </div>
            {getStatusIcon(monthlyPurchase?.status)}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Current Month:</span>
                <span className="font-medium">₹{(monthlyPurchase?.currentAmount || 0).toFixed(2)}/₹500</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div 
                  className="bg-current h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress(monthlyPurchase?.currentAmount || 0, 500)}%` }}
                />
              </div>
            </div>

            <div className="text-sm">
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="font-medium">
                  ₹{Math.max(500 - (monthlyPurchase?.currentAmount || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {monthlyPurchase?.status === 'met' && (
              <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Monthly purchase requirement met!
              </div>
            )}

            {monthlyPurchase?.status === 'pending' && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Purchase ₹{(500 - (monthlyPurchase?.currentAmount || 0)).toFixed(2)} more this month.
              </div>
            )}
          </div>
        </div>

        {/* Commission Eligibility */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(commissionEligibility?.status)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg mr-3">
                <Award className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Commission Eligibility</h3>
                <p className="text-sm opacity-75">Overall eligibility status</p>
              </div>
            </div>
            {getStatusIcon(commissionEligibility?.status)}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block font-medium">Joining Commissions:</span>
                <span className={`inline-flex items-center ${
                  commissionEligibility?.joining ? 'text-green-600' : 'text-red-600'
                }`}>
                  {commissionEligibility?.joining ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Eligible</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Not Eligible</>
                  )}
                </span>
              </div>
              <div>
                <span className="block font-medium">Repurchase Commissions:</span>
                <span className={`inline-flex items-center ${
                  commissionEligibility?.repurchase ? 'text-green-600' : 'text-red-600'
                }`}>
                  {commissionEligibility?.repurchase ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Eligible</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Not Eligible</>
                  )}
                </span>
              </div>
            </div>

            {commissionEligibility?.blockedReasons && commissionEligibility.blockedReasons.length > 0 && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                <strong>Issues to resolve:</strong>
                <ul className="mt-1 ml-4 list-disc">
                  {commissionEligibility.blockedReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Eligibility Check */}
      {nextEligibilityDate && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Next Eligibility Review</h3>
              <p className="text-blue-700">
                Your eligibility will be automatically reviewed on{' '}
                <span className="font-medium">
                  {new Date(nextEligibilityDate).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kycStatus?.status !== 'approved' && (
            <button className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-700 font-medium">Complete KYC</span>
            </button>
          )}
          
          {monthlyPurchase?.status !== 'met' && (
            <button className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">Shop Now</span>
            </button>
          )}
          
          {threThreeRule?.status !== 'eligible' && (
            <button className="flex items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-700 font-medium">Invite Friends</span>
            </button>
          )}
        </div>
      </div>

      {/* Eligibility Guide */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Understanding Eligibility Requirements:</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
            <span><strong>KYC Verification:</strong> Required for all commission payouts and withdrawals</span>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
            <span><strong>3-3 Rule:</strong> Need 3 direct referrals, each having 3+ referrals for repurchase commissions</span>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
            <span><strong>Monthly Purchase:</strong> Minimum ₹500 monthly purchase to maintain active status</span>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
            <span><strong>Commission Types:</strong> Joining commissions (immediate) vs Repurchase commissions (3-3 rule required)</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default EligibilityStatus
