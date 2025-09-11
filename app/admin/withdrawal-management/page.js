'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  BarChart3,
  UserCheck,
  UserX,
  Timer,
  Award,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  MessageSquare,
  Ban,
  DollarSign,
  Users
} from 'lucide-react'

export default function WithdrawalManagementPanel() {
  const { data: session, status } = useSession()
  const [withdrawals, setWithdrawals] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('queue')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [processing, setProcessing] = useState({})
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    status: 'pending',
    search: '',
    page: 1,
    limit: 20
  })

  // Tab configuration
  const tabs = [
    { id: 'queue', label: 'Withdrawal Queue', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Timer },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: FileText }
  ]

  // Fetch withdrawals data
  const fetchWithdrawals = useCallback(async () => {
    if (status !== 'authenticated') return
    
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      })
      
      const response = await fetch(`/api/admin/withdrawals?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch withdrawals')
      
      const result = await response.json()
      if (result.success) {
        setWithdrawals(result.data)
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, status])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (status !== 'authenticated' || activeTab !== 'analytics') return
    
    try {
      const response = await fetch('/api/admin/withdrawal-analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const result = await response.json()
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }, [activeTab, status])

  // Handle withdrawal action (approve/reject)
  const handleWithdrawalAction = async (withdrawalId, action, adminNotes = '') => {
    try {
      setProcessing(prev => ({ ...prev, [withdrawalId]: true }))
      
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          adminNotes,
          transactionId: action === 'approve' ? prompt('Transaction ID (optional):') : null
        })
      })
      
      const result = await response.json()
      if (result.success) {
        // Show success message
        alert(`Withdrawal ${action}d successfully!`)
        // Refresh data
        await fetchWithdrawals()
        setSelectedWithdrawal(null)
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error)
      alert(`Failed to ${action} withdrawal`)
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawalId]: false }))
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (selectedIds, action) => {
    if (!selectedIds.length) {
      alert('Please select withdrawals to process')
      return
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedIds.length} withdrawal(s)?`
    if (!confirm(confirmMessage)) return

    const adminNotes = prompt(`${action === 'approve' ? 'Approval' : 'Rejection'} notes (optional):`) || `Bulk ${action}d by admin`

    try {
      setLoading(true)
      const promises = selectedIds.map(id => 
        handleWithdrawalAction(id, action, adminNotes)
      )
      await Promise.all(promises)
      alert(`Successfully ${action}d ${selectedIds.length} withdrawal(s)`)
    } catch (error) {
      alert(`Error processing bulk ${action}`)
    } finally {
      setLoading(false)
    }
  }

  // Export data
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/withdrawals/export?${new URLSearchParams(filters)}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Export failed. Please try again.')
    }
  }

  // Effects
  useEffect(() => {
    fetchWithdrawals()
  }, [fetchWithdrawals])

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics()
    }
  }, [fetchAnalytics, activeTab])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">Please log in to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Withdrawal Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage user withdrawal requests and track processing analytics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchWithdrawals}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.id === 'queue' && withdrawals?.withdrawals && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400 rounded-full">
                    {withdrawals.summary?.pending?.count || 0}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by user, email, or amount..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            {withdrawals?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {withdrawals.summary.pending?.count || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{((withdrawals.summary.pending?.amount || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {withdrawals.summary.approved?.count || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{((withdrawals.summary.approved?.amount || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Rejected</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {withdrawals.summary.rejected?.count || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{((withdrawals.summary.rejected?.amount || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Volume</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{(((withdrawals.summary.pending?.amount || 0) + 
                            (withdrawals.summary.approved?.amount || 0) + 
                            (withdrawals.summary.rejected?.amount || 0)) / 100).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        All time
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawals Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Withdrawal Requests
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                        <input type="checkbox" className="rounded" onChange={(e) => {
                          // Handle select all
                        }} />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">KYC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {withdrawals?.withdrawals?.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {withdrawal.user?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-300">
                                {withdrawal.user?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ₹{((withdrawal.amount || 0) / 100).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {withdrawal.method || 'Bank Transfer'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            withdrawal.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' :
                            withdrawal.status === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400' :
                            'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            withdrawal.user?.isKycApproved ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' :
                            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400'
                          }`}>
                            {withdrawal.user?.isKycApproved ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                  disabled={processing[withdrawal.id]}
                                  className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50"
                                >
                                  {processing[withdrawal.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Rejection reason:')
                                    if (reason) handleWithdrawalAction(withdrawal.id, 'reject', reason)
                                  }}
                                  disabled={processing[withdrawal.id]}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Loading withdrawals...
                            </div>
                          ) : (
                            'No withdrawal requests found'
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {withdrawals?.pagination && withdrawals.pagination.totalPages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page {withdrawals.pagination.page} of {withdrawals.pagination.totalPages}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters({...filters, page: filters.page - 1})}
                      disabled={!withdrawals.pagination.page || withdrawals.pagination.page <= 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFilters({...filters, page: filters.page + 1})}
                      disabled={withdrawals.pagination.page >= withdrawals.pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Processing Time</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2.3 days</p>
                  </div>
                  <Timer className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approval Rate</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">89%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Volume (30d)</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹1.2M</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Processing Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed analytics dashboard will be displayed here with charts and metrics.
              </p>
            </div>
          </div>
        )}

        {/* Processing Tab */}
        {activeTab === 'processing' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Processing Tools
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Bulk processing tools and advanced controls will be available here.
            </p>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Withdrawal History
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Complete withdrawal history with advanced filtering options.
            </p>
          </div>
        )}
      </div>

      {/* Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Withdrawal Details
              </h3>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">User</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedWithdrawal.user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedWithdrawal.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Amount</label>
                  <p className="text-gray-900 dark:text-gray-100">₹{((selectedWithdrawal.amount || 0) / 100).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedWithdrawal.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' :
                    selectedWithdrawal.status === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400' :
                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400'
                  }`}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      const notes = prompt('Approval notes (optional):') || 'Approved by admin'
                      handleWithdrawalAction(selectedWithdrawal.id, 'approve', notes)
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:')
                      if (reason) handleWithdrawalAction(selectedWithdrawal.id, 'reject', reason)
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
