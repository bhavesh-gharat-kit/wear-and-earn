'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  Award, 
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react'

const CommissionHistory = () => {
  const [commissionData, setCommissionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // overview, history, breakdown
  const [timeFilter, setTimeFilter] = useState('all') // all, week, month, quarter, year
  const [typeFilter, setTypeFilter] = useState('all') // all, joining, repurchase, self
  const [expandedMonth, setExpandedMonth] = useState(null)

  useEffect(() => {
    fetchCommissionData()
  }, [timeFilter, typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCommissionData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (timeFilter !== 'all') params.append('period', timeFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const response = await fetch(`/api/account/commission-history?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setCommissionData(data)
      } else {
        setError(data.message || 'Failed to load commission data')
      }
    } catch (error) {
      console.error('Error fetching commission data:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) => {
    if (typeof amount === 'object' && amount !== null) {
      return amount.rupees?.toFixed(2) || '0.00'
    }
    return (amount / 100).toFixed(2) || '0.00'
  }

  const getCommissionTypeIcon = (type) => {
    switch (type) {
      case 'sponsor_commission':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'repurchase_commission':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'self_payout':
        return <DollarSign className="w-4 h-4 text-purple-600" />
      default:
        return <Award className="w-4 h-4 text-gray-600" />
    }
  }

  const getCommissionTypeColor = (type) => {
    switch (type) {
      case 'sponsor_commission':
        return 'text-blue-600 bg-blue-50'
      case 'repurchase_commission':
        return 'text-green-600 bg-green-50'
      case 'self_payout':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCommissionTypeName = (type) => {
    switch (type) {
      case 'sponsor_commission':
        return 'Joining Commission'
      case 'repurchase_commission':
        return 'Repurchase Commission'
      case 'self_payout':
        return 'Self Payout'
      default:
        return type.replace('_', ' ').toUpperCase()
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-60 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Commission Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchCommissionData}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!commissionData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Commission Data</h3>
          <p className="text-gray-600">Start building your network to earn commissions.</p>
        </div>
      </div>
    )
  }

  const {
    summary,
    monthlyBreakdown,
    commissionHistory,
    typeBreakdown,
    levelBreakdown
  } = commissionData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Commission History</h2>
            <p className="text-green-100">Track your earnings and commission performance</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">₹{formatAmount(summary?.totalEarnings)}</div>
            <div className="text-sm text-green-200">Total Earnings</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{formatAmount(summary?.joiningCommissions)}</div>
              <div className="text-sm text-gray-500">Joining Commissions</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{formatAmount(summary?.repurchaseCommissions)}</div>
              <div className="text-sm text-gray-500">Repurchase Commissions</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{formatAmount(summary?.selfPayouts)}</div>
              <div className="text-sm text-gray-500">Self Payouts</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{formatAmount(summary?.thisMonth)}</div>
              <div className="text-sm text-gray-500">This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="joining">Joining Commissions</option>
            <option value="repurchase">Repurchase Commissions</option>
            <option value="self">Self Payouts</option>
          </select>

          <button 
            onClick={fetchCommissionData}
            className="ml-auto flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'history', label: 'Transaction History', icon: Clock },
              { id: 'breakdown', label: 'Breakdown Analysis', icon: PieChart }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Monthly Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
                {monthlyBreakdown && monthlyBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {monthlyBreakdown.map((month) => (
                      <div key={month.month} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === month.month ? null : month.month)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {month.transactionCount} transactions
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-right mr-4">
                              <div className="text-lg font-bold text-gray-900">₹{formatAmount(month.totalAmount)}</div>
                              <div className="text-xs text-gray-500">Total Earned</div>
                            </div>
                            {expandedMonth === month.month ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {expandedMonth === month.month && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="text-center p-3 bg-blue-50 rounded">
                                <div className="font-bold text-blue-600">₹{formatAmount(month.joiningCommissions)}</div>
                                <div className="text-xs text-blue-500">Joining</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded">
                                <div className="font-bold text-green-600">₹{formatAmount(month.repurchaseCommissions)}</div>
                                <div className="text-xs text-green-500">Repurchase</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="font-bold text-purple-600">₹{formatAmount(month.selfPayouts)}</div>
                                <div className="text-xs text-purple-500">Self Payouts</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No monthly data available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              {commissionHistory && commissionHistory.length > 0 ? (
                <div className="space-y-3">
                  {commissionHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${getCommissionTypeColor(transaction.type)}`}>
                          {getCommissionTypeIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getCommissionTypeName(transaction.type)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                          {transaction.levelDepth && (
                            <div className="text-xs text-blue-600">Level {transaction.levelDepth}</div>
                          )}
                          {transaction.description && (
                            <div className="text-xs text-gray-500">{transaction.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          +₹{formatAmount(transaction.amount)}
                        </div>
                        {transaction.ref && (
                          <div className="text-xs text-gray-500">Ref: {transaction.ref}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No commission history found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              {/* Type Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission by Type</h3>
                {typeBreakdown && Object.keys(typeBreakdown).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(typeBreakdown).map(([type, data]) => (
                      <div key={type} className={`p-4 rounded-lg border-2 ${getCommissionTypeColor(type)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{getCommissionTypeName(type)}</span>
                          {getCommissionTypeIcon(type)}
                        </div>
                        <div className="text-2xl font-bold">₹{formatAmount(data.total)}</div>
                        <div className="text-sm opacity-75">{data.count} transactions</div>
                        <div className="text-xs opacity-60">
                          Avg: ₹{formatAmount(data.average)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No breakdown data available</p>
                  </div>
                )}
              </div>

              {/* Level Breakdown */}
              {levelBreakdown && Object.keys(levelBreakdown).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission by Level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(levelBreakdown).map(([level, data]) => (
                      <div key={level} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-900">Level {level}</div>
                          <div className="text-2xl font-bold text-indigo-600 my-2">₹{formatAmount(data.total)}</div>
                          <div className="text-sm text-indigo-500">{data.count} transactions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            <Download className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium">Export to CSV</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <Download className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">Export to PDF</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 font-medium">Detailed Report</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommissionHistory
