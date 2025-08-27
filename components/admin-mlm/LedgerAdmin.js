'use client'
import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Download,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  BarChart3,
  X
} from 'lucide-react'

export default function LedgerAdmin() {
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    userId: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch ledger data
  const fetchLedgerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        userId: filters.userId,
        type: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: searchTerm,
        page: filters.page,
        limit: filters.limit
      })

      // Fetch ledger entries
      const entriesResponse = await fetch(`/api/admin/ledger-entries?${queryParams}`)
      const entriesData = await entriesResponse.json()

      if (entriesData.success) {
        setLedgerEntries(entriesData.entries)
      }

      // Fetch summary
      const summaryResponse = await fetch(`/api/admin/ledger-summary?${queryParams}`)
      const summaryData = await summaryResponse.json()

      if (summaryData.success) {
        setSummary(summaryData.summary)
      }
    } catch (err) {
      console.error('Error fetching ledger data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgerData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Export ledger data
  const exportLedger = async () => {
    try {
      const queryParams = new URLSearchParams(filters)
      queryParams.set('export', 'true')
      
      const response = await fetch(`/api/admin/export-ledger?${queryParams}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ledger-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting ledger data')
    }
  }

  // Reconcile ledger
  const reconcileLedger = async () => {
    if (!confirm('This will run a full ledger reconciliation. This may take some time. Continue?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/reconcile-ledger', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert(`Reconciliation completed:\n\nChecked: ${data.checkedEntries} entries\nFixed: ${data.fixedEntries} entries\nErrors: ${data.errors} entries`)
        fetchLedgerData()
      } else {
        alert(`Reconciliation failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Reconciliation error:', error)
      alert('Error during reconciliation')
    } finally {
      setLoading(false)
    }
  }

  // View entry details
  const viewEntryDetails = async (entry) => {
    try {
      const response = await fetch(`/api/admin/ledger-entry-details/${entry.id}`)
      const data = await response.json()

      if (data.success) {
        setSelectedEntry(data.entryDetails)
        setShowDetails(true)
      } else {
        alert('Error fetching entry details')
      }
    } catch (error) {
      console.error('Error fetching entry details:', error)
      alert('Error fetching entry details')
    }
  }

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, page: 1 })
    fetchLedgerData()
  }

  // Get transaction type color
  const getTypeColor = (type) => {
    const colors = {
      'sponsor_commission': 'bg-green-100 text-green-800',
      'repurchase_commission': 'bg-blue-100 text-blue-800',
      'self_joining_instalment': 'bg-purple-100 text-purple-800',
      'company_fund': 'bg-orange-100 text-orange-800',
      'rollup_to_company': 'bg-red-100 text-red-800',
      'withdrawal': 'bg-yellow-100 text-yellow-800',
      'adjustment': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
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
            onClick={fetchLedgerData}
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
            <h2 className="text-xl font-semibold text-gray-900">Ledger Administration</h2>
            <p className="text-gray-600">Complete financial reconciliation and transaction management</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={reconcileLedger}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Reconcile
            </button>
            
            <button
              onClick={exportLedger}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={fetchLedgerData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Search by user, description, reference..."
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
            <input
              type="text"
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="sponsor_commission">Sponsor Commission</option>
              <option value="repurchase_commission">Repurchase Commission</option>
              <option value="self_joining_instalment">Self Joining</option>
              <option value="company_fund">Company Fund</option>
              <option value="rollup_to_company">Rollup to Company</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="adjustment">Adjustment</option>
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-xl font-bold text-gray-900">₹{summary.totalCredits?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-xl font-bold text-gray-900">₹{summary.totalDebits?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-xl font-bold ${
                  (summary.totalCredits - summary.totalDebits) >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  ₹{(summary.totalCredits - summary.totalDebits)?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">{summary.totalTransactions?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Entries Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ledger Entries</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.createdAt).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.user?.fullName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">ID: {entry.userId}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(entry.type)}`}>
                      {entry.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.amount >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        entry.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{Math.abs(entry.amount).toLocaleString()}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {entry.description}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {entry.ref || 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewEntryDetails(entry)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, ledgerEntries.length)} entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={ledgerEntries.length < filters.limit}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {ledgerEntries.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No ledger entries found</p>
          </div>
        )}
      </div>

      {/* Entry Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ledger Entry Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Entry ID</label>
                  <p className="text-gray-900 font-mono">{selectedEntry.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="text-gray-900">{new Date(selectedEntry.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="text-gray-900">{selectedEntry.user?.fullName} (ID: {selectedEntry.userId})</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedEntry.type)}`}>
                    {selectedEntry.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className={`text-lg font-semibold ${
                    selectedEntry.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedEntry.amount >= 0 ? '+' : '-'}₹{Math.abs(selectedEntry.amount).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Reference</label>
                  <p className="text-gray-900 font-mono">{selectedEntry.ref || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEntry.description}</p>
              </div>

              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEntry.relatedTransactions && selectedEntry.relatedTransactions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Related Transactions</label>
                  <div className="space-y-2 mt-2">
                    {selectedEntry.relatedTransactions.map((related, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-900">{related.description}</p>
                        <p className="text-xs text-gray-600">Amount: ₹{related.amount} | Ref: {related.ref}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
