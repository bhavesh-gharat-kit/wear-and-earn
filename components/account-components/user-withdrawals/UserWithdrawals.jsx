"use client"
import { useState, useEffect } from 'react'

export default function UserWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [summary, setSummary] = useState({})
  
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank_transfer',
    details: {}
  })

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wallet/withdraw')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.amount || parseFloat(formData.amount) < 100) {
      alert('Minimum withdrawal amount is ₹100')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Withdrawal request submitted successfully!')
        setFormData({ amount: '', method: 'bank_transfer', details: {} })
        setShowForm(false)
        fetchWithdrawals() // Refresh list
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      alert('Failed to submit withdrawal request')
    } finally {
      setSubmitting(false)
    }
  }

  const formatAmount = (amount) => `₹${amount.toFixed(2)}`
  const formatDate = (dateString) => new Date(dateString).toLocaleString()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">My Withdrawals</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            {showForm ? 'Cancel' : 'New Withdrawal'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">Total Withdrawn</h3>
            <p className="text-2xl font-bold text-green-900">
              {formatAmount(summary.totalWithdrawn || 0)}
            </p>
            <p className="text-sm text-green-600">
              {summary.totalRequests || 0} requests
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800">Pending</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {formatAmount(summary.pendingAmount || 0)}
            </p>
            <p className="text-sm text-yellow-600">Under review</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800">Available</h3>
            <p className="text-2xl font-bold text-blue-900">
              {formatAmount(0)} {/* This would come from user wallet balance */}
            </p>
            <p className="text-sm text-blue-600">Current balance</p>
          </div>
        </div>

        {/* Withdrawal Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">New Withdrawal Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum ₹100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal amount is ₹100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="paytm">Paytm</option>
                </select>
              </div>

              {formData.method === 'bank_transfer' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Account Number"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      details: { ...prev.details, accountNumber: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      details: { ...prev.details, ifscCode: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      details: { ...prev.details, bankName: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {formData.method === 'upi' && (
                <input
                  type="text"
                  placeholder="UPI ID (e.g., user@paytm)"
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    details: { ...prev.details, upiId: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}

              {formData.method === 'paytm' && (
                <input
                  type="text"
                  placeholder="Paytm Number"
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    details: { ...prev.details, paytmNumber: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Withdrawals History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Withdrawal History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading withdrawals...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : '-'}
                      {withdrawal.adminNotes && (
                        <div className="text-xs text-gray-400 mt-1">
                          {withdrawal.adminNotes}
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
