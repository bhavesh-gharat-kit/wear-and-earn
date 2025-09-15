'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Wallet,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react'

export default function PoolWithdrawalsPage() {
  const { data: session, status } = useSession()
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})
  const [processing, setProcessing] = useState(false)

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/pool-withdrawals?status=${filters.status}&method=${filters.method}&page=${filters.page}&limit=${filters.limit}`)
      
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
        setPagination(data.pagination || {})
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.method, filters.page, filters.limit])

  useEffect(() => {
    if (status !== 'loading' && session?.user?.role === 'admin') {
      fetchWithdrawals()
    }
  }, [session, status, filters, fetchWithdrawals])

  const handleWithdrawalAction = async (withdrawalId, action, remarks = '') => {
    if (!confirm(`Are you sure you want to ${action} this withdrawal request?`)) {
      return
    }

    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/pool-withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          withdrawalId,
          action,
          adminNotes: remarks
        })
      })

      if (response.ok) {
        alert(`Withdrawal ${action}ed successfully!`)
        fetchWithdrawals() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      alert('Failed to process withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100) // Convert paisa to rupees
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'requested':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'requested':
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user?.role || session.user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pool Withdrawals Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage withdrawal requests from the pool MLM system</p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Method</label>
            <select
              value={filters.method}
              onChange={(e) => setFilters({...filters, method: e.target.value, page: 1})}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          
          <button
            onClick={fetchWithdrawals}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mt-6"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center mt-6">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {withdrawals.filter(w => w.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {withdrawals.filter(w => w.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {withdrawals.filter(w => w.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {withdrawals.filter(w => w.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Rejected</div>
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-300">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
            <h3 className="text-lg font-medium mb-2 dark:text-gray-100">No Withdrawal Requests</h3>
            <p>No withdrawal requests match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider min-w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{withdrawal.user?.fullName || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">{withdrawal.user?.email || 'N/A'}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">ID: {withdrawal.user?.id || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{withdrawal.amountRs?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                        Bank Transfer
                      </div>
                      {withdrawal.bankDetails && (
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          {withdrawal.bankDetails.bankName}
                          <br />
                          ****{withdrawal.bankDetails.accountNumber?.slice(-4)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)} dark:${getStatusColor(withdrawal.status).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '900').replace('800', '400')}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="ml-1 capitalize">{withdrawal.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div>{new Date(withdrawal.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        {new Date(withdrawal.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2 min-w-[150px]">
                        {(withdrawal.status === 'requested' || withdrawal.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const remarks = prompt('Enter rejection reason:')
                                if (remarks) handleWithdrawalAction(withdrawal.id, 'reject', remarks)
                              }}
                              disabled={processing}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Reject
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'approved' && (
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center text-sm font-medium">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Approved
                          </div>
                        )}
                        {withdrawal.status === 'rejected' && (
                          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-center text-sm font-medium">
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Rejected
                          </div>
                        )}
                        <button 
                          onClick={() => {
                            // Add view details functionality
                            alert(`Withdrawal Details:\nUser: ${withdrawal.user?.fullName}\nAmount: ₹${withdrawal.amountRs?.toFixed(2)}\nBank: ${withdrawal.bankDetails?.bankName}\nAccount: ${withdrawal.bankDetails?.accountNumber}\nStatus: ${withdrawal.status}\n${withdrawal.adminNotes ? 'Notes: ' + withdrawal.adminNotes : ''}`)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-xs font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Showing page {pagination.page} of {pagination.totalPages} 
            ({pagination.total} total requests)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-100">
              {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
