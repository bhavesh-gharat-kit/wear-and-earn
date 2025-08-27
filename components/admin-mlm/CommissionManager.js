'use client'
import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Save,
  History,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  RefreshCw,
  Edit,
  Plus,
  X
} from 'lucide-react'

export default function CommissionManager() {
  const [commissionRates, setCommissionRates] = useState({
    level1: 25,
    level2: 20,
    level3: 15,
    level4: 10,
    level5: 10,
    companyShare: 30,
    userShare: 70
  })
  const [originalRates, setOriginalRates] = useState({})
  const [auditLog, setAuditLog] = useState([])
  const [commissionStats, setCommissionStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [activeTab, setActiveTab] = useState('rates')

  // Fetch commission configuration and stats
  useEffect(() => {
    fetchCommissionData()
  }, [])

  const fetchCommissionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current commission rates
      const ratesResponse = await fetch('/api/admin/commission-rates')
      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json()
        setCommissionRates(ratesData.rates)
        setOriginalRates(ratesData.rates)
      }

      // Fetch commission statistics
      const statsResponse = await fetch('/api/admin/commission-stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCommissionStats(statsData)
      }

      // Fetch audit log
      const auditResponse = await fetch('/api/admin/commission-audit')
      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAuditLog(auditData.logs || [])
      }
    } catch (err) {
      console.error('Error fetching commission data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Save commission rates
  const saveCommissionRates = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/commission-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: commissionRates })
      })

      const data = await response.json()

      if (data.success) {
        setOriginalRates(commissionRates)
        alert('Commission rates updated successfully!')
        fetchCommissionData() // Refresh audit log
      } else {
        throw new Error(data.message || 'Failed to update rates')
      }
    } catch (err) {
      console.error('Error saving rates:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Reset rates to original
  const resetRates = () => {
    setCommissionRates(originalRates)
  }

  // Check if rates have changed
  const hasChanges = JSON.stringify(commissionRates) !== JSON.stringify(originalRates)

  // Export commission data
  const exportCommissionData = async () => {
    try {
      const response = await fetch('/api/admin/export-commission-data')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `commission-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting commission data')
    }
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
            onClick={fetchCommissionData}
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
            <h2 className="text-xl font-semibold text-gray-900">Commission Management</h2>
            <p className="text-gray-600">Configure commission rates and monitor distribution</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View Audit Log
            </button>
            
            <button
              onClick={exportCommissionData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
            
            <button
              onClick={fetchCommissionData}
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
              { id: 'rates', name: 'Commission Rates', icon: Settings },
              { id: 'stats', name: 'Statistics', icon: TrendingUp },
              { id: 'distribution', name: 'Distribution', icon: DollarSign }
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
      </div>

      {/* Commission Rates Tab */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Commission Rate Configuration</h3>
            
            <div className="flex items-center gap-3">
              {hasChanges && (
                <>
                  <button
                    onClick={resetRates}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={saveCommissionRates}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Level Commission Rates */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Level Commission Rates (%)</h4>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Level {level} Commission
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionRates[`level${level}`]}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          [`level${level}`]: parseFloat(e.target.value) || 0
                        })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                      />
                      <span className="ml-2 text-sm text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Level Commission */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total Level Commission</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {(commissionRates.level1 + commissionRates.level2 + commissionRates.level3 + commissionRates.level4 + commissionRates.level5).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Company/User Split */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue Split (%)</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Company Share
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRates.companyShare}
                      onChange={(e) => {
                        const companyShare = parseFloat(e.target.value) || 0
                        setCommissionRates({
                          ...commissionRates,
                          companyShare,
                          userShare: 100 - companyShare
                        })
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                    />
                    <span className="ml-2 text-sm text-gray-500">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    User Share
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRates.userShare}
                      onChange={(e) => {
                        const userShare = parseFloat(e.target.value) || 0
                        setCommissionRates({
                          ...commissionRates,
                          userShare,
                          companyShare: 100 - userShare
                        })
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                    />
                    <span className="ml-2 text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>

              {/* Validation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Split</span>
                  <div className="flex items-center">
                    <span className={`text-sm font-semibold ${
                      (commissionRates.companyShare + commissionRates.userShare === 100) 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(commissionRates.companyShare + commissionRates.userShare).toFixed(1)}%
                    </span>
                    {(commissionRates.companyShare + commissionRates.userShare === 100) ? (
                      <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Calculation Preview */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Commission Calculation Preview</h4>
            <p className="text-sm text-gray-600 mb-3">Example calculation for ₹1000 order:</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Level Commissions:</p>
                <ul className="mt-1 space-y-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <li key={level} className="flex justify-between">
                      <span>Level {level}:</span>
                      <span>₹{((commissionRates[`level${level}`] / 100) * 1000 * (commissionRates.userShare / 100)).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Revenue Split:</p>
                <ul className="mt-1 space-y-1">
                  <li className="flex justify-between">
                    <span>Company:</span>
                    <span>₹{((commissionRates.companyShare / 100) * 1000).toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>MLM Pool:</span>
                    <span>₹{((commissionRates.userShare / 100) * 1000).toFixed(2)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Commission Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Distributed</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{commissionStats?.totalDistributed?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{commissionStats?.thisMonth?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Company Earnings</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{commissionStats?.companyEarnings?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-xl font-bold text-gray-900">
                    {commissionStats?.totalTransactions?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Level-wise Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Level-wise Commission Distribution</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Level</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Commission Rate</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total Paid</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Transactions</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Avg. per Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[1, 2, 3, 4, 5].map(level => {
                    const levelStats = commissionStats?.levelStats?.find(stat => stat.level === level) || {}
                    return (
                      <tr key={level}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">Level {level}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{commissionRates[`level${level}`]}%</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{levelStats.totalPaid?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{levelStats.transactions || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ₹{levelStats.transactions ? (levelStats.totalPaid / levelStats.transactions).toFixed(2) : 0}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Commission Trends</h3>
            
            <div className="space-y-3">
              {commissionStats?.monthlyTrends?.map(month => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.transactions} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{month.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">₹{month.average} avg</p>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          {/* Top Earners */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Commission Earners</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total Earned</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">This Month</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Direct Referrals</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commissionStats?.topEarners?.map(earner => (
                    <tr key={earner.userId}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{earner.fullName}</p>
                          <p className="text-xs text-gray-500">ID: {earner.userId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        ₹{earner.totalEarned.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ₹{earner.thisMonth.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {earner.directReferrals}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          earner.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {earner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commission Distribution Chart placeholder */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Distribution Overview</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Commission Configuration Audit Log</h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {auditLog.map(log => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>By: {log.adminName} | {new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {log.changes && (
                      <button
                        onClick={() => alert(JSON.stringify(log.changes, null, 2))}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      >
                        <Eye className="h-3 w-3 inline mr-1" />
                        View Changes
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {auditLog.length === 0 && (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No audit logs available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
