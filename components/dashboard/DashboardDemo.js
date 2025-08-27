'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  ReferralSection,
  WalletBalance,
  MLMTreeView,
  EligibilityStatus,
  CommissionHistory
} from '@/components/dashboard'

const DashboardDemo = () => {
  const { data: session } = useSession()
  const [activeComponent, setActiveComponent] = useState('referral')

  const components = [
    { id: 'referral', name: 'Referral Section', component: ReferralSection },
    { id: 'wallet', name: 'Wallet Balance', component: WalletBalance },
    { id: 'tree', name: 'MLM Tree View', component: MLMTreeView },
    { id: 'eligibility', name: 'Eligibility Status', component: EligibilityStatus },
    { id: 'commission', name: 'Commission History', component: CommissionHistory }
  ]

  const ActiveComponent = components.find(c => c.id === activeComponent)?.component

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to login to access the dashboard components.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MLM Dashboard Components</h1>
          <p className="text-gray-600">Interactive components for MLM user dashboard</p>
        </div>

        {/* Component Selector */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Component:</h2>
            <div className="flex flex-wrap gap-2">
              {components.map(({ id, name }) => (
                <button
                  key={id}
                  onClick={() => setActiveComponent(id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeComponent === id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Component */}
        <div className="mb-8">
          {ActiveComponent && (
            <ActiveComponent 
              userId={session.user?.id}
              userData={session.user}
            />
          )}
        </div>

        {/* Component Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">ReferralSection</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Referral link generation</li>
                <li>• Copy to clipboard functionality</li>
                <li>• Social sharing options</li>
                <li>• Recent referrals list</li>
                <li>• Referral statistics</li>
              </ul>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">WalletBalance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Current balance display</li>
                <li>• Transaction history</li>
                <li>• Pending self-payouts</li>
                <li>• Withdrawal functionality</li>
                <li>• Balance visibility toggle</li>
              </ul>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">MLMTreeView</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visual tree representation</li>
                <li>• Expandable tree nodes</li>
                <li>• Direct referrals list</li>
                <li>• Team statistics</li>
                <li>• Level-wise filtering</li>
              </ul>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">EligibilityStatus</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• KYC approval status</li>
                <li>• 3-3 rule progress</li>
                <li>• Monthly purchase tracking</li>
                <li>• Commission eligibility</li>
                <li>• Quick action buttons</li>
              </ul>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">CommissionHistory</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Commission breakdown</li>
                <li>• Monthly/weekly analysis</li>
                <li>• Transaction filtering</li>
                <li>• Export functionality</li>
                <li>• Performance metrics</li>
              </ul>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Common Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Loading states</li>
                <li>• Error handling</li>
                <li>• Responsive design</li>
                <li>• Tailwind CSS styling</li>
                <li>• API integration ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Usage Instructions:</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Import:</strong> <code className="bg-blue-100 px-2 py-1 rounded">import &#123; ReferralSection &#125; from &apos;@/components/dashboard&apos;</code></p>
            <p><strong>Use:</strong> <code className="bg-blue-100 px-2 py-1 rounded">&lt;ReferralSection userId=&#123;userId&#125; /&gt;</code></p>
            <p><strong>Note:</strong> Each component fetches its own data from corresponding API endpoints.</p>
            <p><strong>APIs needed:</strong> /api/account/referral, /api/account/wallet, /api/account/mlm-tree, /api/account/eligibility, /api/account/commission-history</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardDemo
