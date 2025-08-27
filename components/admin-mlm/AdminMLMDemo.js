'use client'
import { useState } from 'react'
import { 
  Settings, 
  Users, 
  DollarSign, 
  FileText, 
  CreditCard,
  TreePine,
  Shield,
  BarChart3
} from 'lucide-react'

// Import admin MLM components
import {
  MLMTreeAdmin,
  CommissionManager,
  UserEligibilityManager,
  LedgerAdmin,
  PayoutManager
} from './index'

export default function AdminMLMDemo() {
  const [activeComponent, setActiveComponent] = useState('tree')

  const components = [
    {
      id: 'tree',
      name: 'MLM Tree Admin',
      description: 'Enhanced tree view with search and manual placement',
      icon: TreePine,
      component: MLMTreeAdmin,
      features: [
        'Visual matrix tree structure',
        'Search users in matrix',
        'Manual user placement',
        'Fix matrix issues',
        'Export matrix data',
        'Issue detection and orphan handling'
      ]
    },
    {
      id: 'commission',
      name: 'Commission Manager',
      description: 'Commission rate configuration and audit trails',
      icon: DollarSign,
      component: CommissionManager,
      features: [
        'Configure commission rates',
        'Company/User revenue split',
        'Commission calculation preview',
        'Audit log tracking',
        'Level-wise statistics',
        'Export commission data'
      ]
    },
    {
      id: 'eligibility',
      name: 'User Eligibility Manager',
      description: 'KYC and 3-3 rule management',
      icon: Shield,
      component: UserEligibilityManager,
      features: [
        'KYC approval/rejection',
        'MLM eligibility management',
        '3-3 rule compliance checking',
        'Bulk KYC operations',
        'User search and filtering',
        'Monthly purchase tracking'
      ]
    },
    {
      id: 'ledger',
      name: 'Ledger Admin',
      description: 'Complete financial reconciliation',
      icon: FileText,
      component: LedgerAdmin,
      features: [
        'Complete transaction history',
        'Financial reconciliation',
        'Ledger entry search',
        'Export capabilities',
        'Balance verification',
        'Transaction details'
      ]
    },
    {
      id: 'payout',
      name: 'Payout Manager',
      description: 'Scheduled payouts and withdrawal approvals',
      icon: CreditCard,
      component: PayoutManager,
      features: [
        'Scheduled payout management',
        'Withdrawal request approval',
        'Process bulk payouts',
        'Payout statistics',
        'Bank details management',
        'Status tracking'
      ]
    }
  ]

  const activeComponentData = components.find(comp => comp.id === activeComponent)
  const ActiveComponent = activeComponentData?.component

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin MLM Management Suite</h1>
                <p className="text-gray-600 mt-2">
                  Comprehensive MLM administration tools for your platform
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  5 Components
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Production Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">MLM Components</h2>
              
              <nav className="space-y-2">
                {components.map((component) => (
                  <button
                    key={component.id}
                    onClick={() => setActiveComponent(component.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeComponent === component.id
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <component.icon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{component.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {component.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Component Info */}
              {activeComponentData && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {activeComponentData.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <BarChart3 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </div>
  )
}
