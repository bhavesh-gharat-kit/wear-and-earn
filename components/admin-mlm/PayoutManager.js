'use client'
import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Send,
  Pause,
  Play,
  Settings,
  Users,
  CreditCard,
  TrendingUp,
  X
} from 'lucide-react'

export default function PayoutManager() {
  const [payoutSchedules, setPayoutSchedules] = useState([])
  const [withdrawalRequests, setWithdrawalRequests] = useState([])
  const [payoutStats, setPayoutStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('schedules')
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  // Fetch payout data
  const fetchPayoutData = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: searchTerm,
        page: filters.page,
        limit: filters.limit
      })

      // Fetch payout schedules
      const schedulesResponse = await fetch(`/api/admin/payout-schedules?${queryParams}`)
      const schedulesData = await schedulesResponse.json()

      if (schedulesData.success) {
        setPayoutSchedules(schedulesData.schedules)
      }

      // Fetch withdrawal requests
      const withdrawalsResponse = await fetch(`/api/admin/withdrawal-requests?${queryParams}`)
      const withdrawalsData = await withdrawalsResponse.json()

      if (withdrawalsData.success) {
        setWithdrawalRequests(withdrawalsData.withdrawals)
      }

      // Fetch payout statistics
      const statsResponse = await fetch('/api/admin/payout-stats')
      const statsData = await statsResponse.json()

      if (statsData.success) {
        setPayoutStats(statsData.stats)
      }
    } catch (err) {
      console.error('Error fetching payout data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayoutData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab])

  // Process scheduled payouts
  const processScheduledPayouts = async () => {
    if (!confirm('This will process all due scheduled payouts. Continue?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/process-scheduled-payouts', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert(`Processed ${data.processedCount} payouts totaling ₹${data.totalAmount.toLocaleString()}`)
        fetchPayoutData()
      } else {
        alert(`Processing failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Payout processing error:', error)
      alert('Error processing payouts')
    } finally {
      setLoading(false)
    }
  }

  // Approve withdrawal request
  const approveWithdrawal = async (withdrawalId, approvalNotes = '') => {
    try {
      const response = await fetch('/api/admin/approve-withdrawal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, approvalNotes })
      })

      const data = await response.json()

      if (data.success) {
        alert('Withdrawal approved successfully!')
        fetchPayoutData()
      } else {
        alert(`Approval failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Approval error:', error)
      alert('Error approving withdrawal')
    }
  }

  // Reject withdrawal request
  const rejectWithdrawal = async (withdrawalId, rejectionReason) => {
    try {
      const response = await fetch('/api/admin/reject-withdrawal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, rejectionReason })
      })

      const data = await response.json()

      if (data.success) {
        alert('Withdrawal rejected successfully!')
        fetchPayoutData()
      } else {
        alert(`Rejection failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Error rejecting withdrawal')
    }
  }

  // Pause/Resume payout schedule
  const togglePayoutSchedule = async (scheduleId, pause) => {
    try {
      const response = await fetch('/api/admin/toggle-payout-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, pause })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Payout schedule ${pause ? 'paused' : 'resumed'} successfully!`)
        fetchPayoutData()
      } else {
        alert(`Operation failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Toggle error:', error)
      alert('Error updating payout schedule')
    }
  }

  // Export payout data
  const exportPayoutData = async () => {
    try {
      const queryParams = new URLSearchParams(filters)
      queryParams.set('export', 'true')
      
      const response = await fetch(`/api/admin/export-payouts?${queryParams}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payouts-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting payout data')
    }
  }

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, page: 1 })
    fetchPayoutData()
  }

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'paused': 'bg-gray-100 text-gray-800',
      'active': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
          <button
            onClick={fetchPayoutData}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payout Management</h2>
            <p className="text-gray-600">Manage scheduled payouts and withdrawal approvals</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={processScheduledPayouts}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Process Payouts
            </button>
            
            <button
              onClick={exportPayoutData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={fetchPayoutData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'schedules', name: 'Scheduled Payouts', icon: Calendar },
              { id: 'withdrawals', name: 'Withdrawal Requests', icon: CreditCard },
              { id: 'stats', name: 'Statistics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Search by user, amount, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {payoutStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-xl font-bold text-gray-900">₹{payoutStats.totalPayouts?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-xl font-bold text-gray-900">₹{payoutStats.pendingPayouts?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Withdrawal Requests</p>
                <p className="text-xl font-bold text-gray-900">{payoutStats.withdrawalRequests || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Schedules</p>
                <p className="text-xl font-bold text-gray-900">{payoutStats.activeSchedules || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Payouts Tab */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Payouts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Payout</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{schedule.user?.fullName}</div>
                      <div className="text-sm text-gray-500">ID: {schedule.userId}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">₹{schedule.amount?.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {schedule.installmentsPaid || 0}/{schedule.totalInstallments} paid
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Every {schedule.frequency} weeks
                      </div>
                      <div className="text-sm text-gray-500">
                        Started: {new Date(schedule.startDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(schedule.nextPayoutDate).toLocaleDateString()}
                      </div>
                      <div className={`text-sm ${
                        new Date(schedule.nextPayoutDate) <= new Date() ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {new Date(schedule.nextPayoutDate) <= new Date() ? 'Due now' : 'Upcoming'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayout(schedule)
                          setShowPayoutModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {schedule.status === 'active' ? (
                        <button
                          onClick={() => togglePayoutSchedule(schedule.id, true)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => togglePayoutSchedule(schedule.id, false)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payoutSchedules.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No scheduled payouts found</p>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Requests Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawalRequests.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{withdrawal.user?.fullName}</div>
                      <div className="text-sm text-gray-500">ID: {withdrawal.userId}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">₹{withdrawal.amount?.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Fee: ₹{withdrawal.processingFee || 0}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{withdrawal.bankDetails?.accountNumber}</div>
                      <div className="text-sm text-gray-500">{withdrawal.bankDetails?.bankName}</div>
                      <div className="text-sm text-gray-500">IFSC: {withdrawal.bankDetails?.ifscCode}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              const notes = prompt('Approval notes (optional):')
                              approveWithdrawal(withdrawal.id, notes || '')
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:')
                              if (reason) rejectWithdrawal(withdrawal.id, reason)
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedPayout(withdrawal)
                          setShowPayoutModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {withdrawalRequests.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No withdrawal requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && payoutStats && (
        <div className="space-y-6">
          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payout Trends</h3>
            
            <div className="space-y-3">
              {payoutStats.monthlyTrends?.map(month => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.payoutCount} payouts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{month.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">₹{month.averageAmount} avg</p>
                  </div>
                </div>
              )) || []}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Status Breakdown</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {payoutStats.statusBreakdown?.map(status => (
                <div key={status.status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{status.status}</p>
                  <p className="text-xl font-bold text-gray-900">{status.count}</p>
                  <p className="text-sm text-gray-500">₹{status.totalAmount.toLocaleString()}</p>
                </div>
              )) || []}
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPayout.totalInstallments ? 'Scheduled Payout Details' : 'Withdrawal Request Details'}
              </h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="text-gray-900">{selectedPayout.user?.fullName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-gray-900 font-semibold">₹{selectedPayout.amount?.toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayout.status)}`}>
                    {selectedPayout.status.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created Date</label>
                  <p className="text-gray-900">{new Date(selectedPayout.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedPayout.totalInstallments && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Schedule Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Frequency</label>
                      <p className="text-gray-900">Every {selectedPayout.frequency} weeks</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Progress</label>
                      <p className="text-gray-900">
                        {selectedPayout.installmentsPaid || 0}/{selectedPayout.totalInstallments} installments
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Next Payout</label>
                      <p className="text-gray-900">{new Date(selectedPayout.nextPayoutDate).toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Amount per Installment</label>
                      <p className="text-gray-900">₹{(selectedPayout.amount / selectedPayout.totalInstallments).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPayout.bankDetails && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Number</label>
                      <p className="text-gray-900 font-mono">{selectedPayout.bankDetails.accountNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Bank Name</label>
                      <p className="text-gray-900">{selectedPayout.bankDetails.bankName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">IFSC Code</label>
                      <p className="text-gray-900 font-mono">{selectedPayout.bankDetails.ifscCode}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Holder</label>
                      <p className="text-gray-900">{selectedPayout.bankDetails.accountHolderName}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPayout.notes && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedPayout.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
