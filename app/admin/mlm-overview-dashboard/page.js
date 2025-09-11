'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  UserCheck,
  Wallet,
  Target,
  Activity,
  Filter
} from 'lucide-react'

export default function MLMOverviewDashboard() {
  const { data: session, status } = useSession()
  const [overviewData, setOverviewData] = useState(null)
  const [revenueMetrics, setRevenueMetrics] = useState(null)
  const [userEngagement, setUserEngagement] = useState(null)
  const [pendingPayments, setPendingPayments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('revenue')
  const [dateRange, setDateRange] = useState('30') // days
  const [filters, setFilters] = useState({
    period: '30',
    level: 'all',
    status: 'all'
  })

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)

      // Fetch comprehensive MLM overview data
      const [overviewRes, revenueRes, engagementRes, paymentsRes] = await Promise.all([
        fetch(`/api/admin/mlm-overview-enhanced?period=${filters.period}`),
        fetch(`/api/admin/mlm-revenue-metrics?period=${filters.period}`),
        fetch(`/api/admin/mlm-user-engagement?period=${filters.period}`),
        fetch(`/api/admin/mlm-pending-payments`)
      ])

      if (overviewRes.ok) {
        const data = await overviewRes.json()
        setOverviewData(data.data)
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json()
        setRevenueMetrics(data.data)
      }

      if (engagementRes.ok) {
        const data = await engagementRes.json()
        setUserEngagement(data.data)
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPendingPayments(data.data)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  // Check admin access
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session?.user?.role || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const handleExport = async (type) => {
    try {
      const response = await fetch(`/api/admin/mlm-export?type=${type}&period=${filters.period}`, {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mlm-${type}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100) // Convert from paisa to rupees
  }

  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading MLM overview dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MLM Overview Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comprehensive business intelligence and performance metrics
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <select
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('revenue')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'revenue', name: 'Revenue Metrics', icon: DollarSign },
                { id: 'engagement', name: 'User Engagement', icon: Users },
                { id: 'payments', name: 'Pending Payments', icon: Clock },
                { id: 'intelligence', name: 'Business Intelligence', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Metrics Cards */}
        {overviewData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {overviewData.overview.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    +{overviewData.overview.newUsersInPeriod} this period ({overviewData.overview.userGrowthRate}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Commissions</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(overviewData.commissions.totalAmount)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(overviewData.commissions.periodAmount)} this period
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Wallet className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending Withdrawals</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(overviewData.withdrawals.pending.amount)}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {overviewData.withdrawals.pending.count} requests
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">KYC Approval</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {overviewData.kyc.approvalRate}%
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {overviewData.kyc.approved} of {overviewData.overview.totalUsers} users
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'revenue' && revenueMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Sales Breakdown</h3>
                  <PieChart className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Product Revenue</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(revenueMetrics?.productRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">MLM Revenue</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(revenueMetrics?.mlmRevenue || 0)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 dark:text-white">Total Revenue</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency((revenueMetrics?.productRevenue || 0) + (revenueMetrics?.mlmRevenue || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company vs Pool Share */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company vs Pool Share</h3>
                  <Target className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Company Share (30%)</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(revenueMetrics?.companyShare || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Pool Share (70%)</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(revenueMetrics?.poolShare || 0)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 dark:text-white">MLM Total</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency((revenueMetrics?.companyShare || 0) + (revenueMetrics?.poolShare || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Time-based Analytics Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time-based Analytics</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Revenue trend chart will be displayed here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && userEngagement && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Registration to Purchase Conversion */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Conversion</h3>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPercentage(userEngagement?.conversionRate || 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {userEngagement?.purchasedUsers || 0} of {userEngagement?.totalRegistered || 0} registered
                  </p>
                </div>
              </div>

              {/* Active Referrer Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Referrers</h3>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {userEngagement?.activeReferrers || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {formatPercentage(userEngagement?.referrerRate || 0)} of users active
                  </p>
                </div>
              </div>

              {/* Referral Success Rates */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referral Success</h3>
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPercentage(userEngagement?.referralSuccessRate || 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Average successful referrals
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && pendingPayments && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Self Income Due List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Self Income Due</h3>
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">This Week</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(pendingPayments?.selfIncomeThisWeek || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Next Week</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(pendingPayments?.selfIncomeNextWeek || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Users Awaiting</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {pendingPayments?.usersAwaitingPayment || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Failed Payment Alerts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed Payments</h3>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Failed Count</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {pendingPayments?.failedPaymentCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Amount Affected</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(pendingPayments?.failedPaymentAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Retry Required</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {pendingPayments?.retryRequired || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && overviewData && (
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performers</h3>
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {overviewData.topPerformers.map((performer, index) => (
                      <tr key={performer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{performer.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{performer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(performer.totalEarnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Level Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Level Distribution</h3>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {overviewData.matrix.distribution.map((level) => (
                  <div key={level.level} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">L{level.level}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{level.count}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">users</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
