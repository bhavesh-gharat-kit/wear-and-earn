"use client"
import { useState, useEffect } from 'react'

export default function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})
  const [filter, setFilter] = useState('pending')
  const [summary, setSummary] = useState({})

  useEffect(() => {
    fetchWithdrawals()
  }, [filter])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/withdrawals?status=${filter}&limit=20`)
      const data = await response.json()
      
      if (data.success) {
        setWithdrawals(data.data.withdrawals)
        setSummary(data.data.summary)
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawal = async (withdrawalId, action, notes = '') => {
    try {
      setProcessing(prev => ({ ...prev, [withdrawalId]: true }))
      
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          adminNotes: notes,
          transactionId: action === 'approve' ? prompt('Transaction ID (optional):') : null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Withdrawal ${action}d successfully!`)
        fetchWithdrawals() // Refresh list
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error)
      alert(`Failed to ${action} withdrawal`)
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawalId]: false }))
    }
  }

  const formatAmount = (amount) => `₹${amount.toFixed(2)}`
  const formatDate = (dateString) => new Date(dateString).toLocaleString()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Withdrawal Management</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800">Pending</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {summary.pending?.count || 0}
            </p>
            <p className="text-sm text-yellow-600">
              {formatAmount(summary.pending?.amount || 0)}
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">Approved</h3>
            <p className="text-2xl font-bold text-green-900">
              {summary.approved?.count || 0}
            </p>
            <p className="text-sm text-green-600">
              {formatAmount(summary.approved?.amount || 0)}
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800">Rejected</h3>
            <p className="text-2xl font-bold text-red-900">
              {summary.rejected?.count || 0}
            </p>
            <p className="text-sm text-red-600">
              {formatAmount(summary.rejected?.amount || 0)}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-4">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading withdrawals...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No {filter} withdrawals found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.user?.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          Balance: {formatAmount(withdrawal.user?.walletBalance || 0)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatAmount(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {withdrawal.method.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {withdrawal.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const notes = prompt('Admin notes (optional):')
                              if (notes !== null) {
                                handleWithdrawal(withdrawal.id, 'approve', notes)
                              }
                            }}
                            disabled={processing[withdrawal.id]}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processing[withdrawal.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Rejection reason:')
                              if (notes) {
                                handleWithdrawal(withdrawal.id, 'reject', notes)
                              }
                            }}
                            disabled={processing[withdrawal.id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs text-gray-500">
                            {withdrawal.processedAt && formatDate(withdrawal.processedAt)}
                          </div>
                          {withdrawal.adminNotes && (
                            <div className="text-xs text-gray-400 mt-1">
                              {withdrawal.adminNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
