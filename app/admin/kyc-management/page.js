'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, 
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
  MessageSquare
} from 'lucide-react'

export default function KYCManagementPanel() {
  const { data: session, status } = useSession()
  const [kycQueue, setKycQueue] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('queue')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [currentDocument, setCurrentDocument] = useState(null)
  const [filters, setFilters] = useState({
    status: 'pending',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'submittedAt',
    sortOrder: 'desc'
  })

  const fetchKycQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`/api/admin/kyc-queue?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setKycQueue(data.data)
      }
    } catch (error) {
      console.error('Error fetching KYC queue:', error)
    }
  }, [filters])

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/kyc-analytics')
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching KYC analytics:', error)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'loading') return
      
      if (!session?.user?.role || session.user.role !== 'admin') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        if (activeTab === 'queue') {
          await fetchKycQueue()
        } else if (activeTab === 'analytics') {
          await fetchAnalytics()
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, status, activeTab, fetchKycQueue, fetchAnalytics])

  const handleKycAction = async (userId, action, reason, rejectionReasons = null) => {
    try {
      const response = await fetch(`/api/admin/approve-kyc/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, rejectionReasons })
      })

      const result = await response.json()

      if (result.success) {
        alert(`KYC ${action}d successfully!`)
        await fetchKycQueue()
        if (analytics) await fetchAnalytics()
        setSelectedUser(null)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error processing KYC:', error)
      alert('Failed to process KYC')
    }
  }

  const handleDocumentView = (user, documentType) => {
    setCurrentDocument({
      user,
      documentType,
      url: user.kycDocument[documentType]
    })
    setShowDocumentViewer(true)
  }

  const exportKycData = () => {
    if (!kycQueue.users || kycQueue.users.length === 0) {
      alert('No data to export')
      return
    }

    const csvData = kycQueue.users.map(user => ({
      'User ID': user.id,
      'Full Name': user.fullName,
      'Email': user.email,
      'Mobile': user.mobileNo,
      'KYC Status': user.kycStatus,
      'Submitted At': user.kycDocument?.submittedAt ? new Date(user.kycDocument.submittedAt).toLocaleDateString() : 'N/A',
      'Waiting Days': user.waitingDays,
      'Document Type': user.kycDocument?.documentType || 'N/A',
      'Has Documents': user.kycDocument?.hasDocuments ? 'Yes' : 'No'
    }))

    const headers = Object.keys(csvData[0]).join(',')
    const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kyc_queue_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">KYC Management Panel</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage user KYC submissions, document verification, and approval workflow</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'queue', name: 'KYC Queue', icon: Users },
            { id: 'review', name: 'Document Review', icon: FileText },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 },
            { id: 'history', name: 'History', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
        
        {/* Refresh Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              if (activeTab === 'queue') fetchKycQueue()
              else if (activeTab === 'analytics') fetchAnalytics()
            }}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KYC Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          {kycQueue.statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Submissions</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {kycQueue.statistics.total}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Review</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {kycQueue.statistics.pending}
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
                      {kycQueue.statistics.approved}
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Processing</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {kycQueue.statistics.averageProcessingDays}d
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or mobile..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="submittedAt">Submission Date</option>
                  <option value="fullName">Name</option>
                  <option value="status">Status</option>
                </select>
              </div>
              
              <button
                onClick={exportKycData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center mt-6"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* KYC Queue List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Waiting</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {kycQueue.users?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">{user.mobileNo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {user.kycDocument?.frontImageUrl && (
                            <button
                              onClick={() => handleDocumentView(user, 'frontImageUrl')}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {user.kycDocument?.backImageUrl && (
                            <button
                              onClick={() => handleDocumentView(user, 'backImageUrl')}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          {user.kycDocument?.selfieUrl && (
                            <button
                              onClick={() => handleDocumentView(user, 'selfieUrl')}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.kycStatus === 'APPROVED' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' :
                          user.kycStatus === 'REJECTED' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.kycDocument?.submittedAt ? new Date(user.kycDocument.submittedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.waitingDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.kycStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleKycAction(user.id, 'approve', 'Approved by admin')}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:')
                                  if (reason) handleKycAction(user.id, 'reject', reason, [reason])
                                }}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
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
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
                        No KYC submissions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {kycQueue.pagination && kycQueue.pagination.totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {kycQueue.pagination.currentPage} of {kycQueue.pagination.totalPages}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({...filters, page: filters.page - 1})}
                    disabled={!kycQueue.pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFilters({...filters, page: filters.page + 1})}
                    disabled={!kycQueue.pagination.hasNext}
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
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">KYC Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(analytics.overview.kycCompletionRate)}%
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approval Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(analytics.overview.approvalRate)}%
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(analytics.processingMetrics.averageProcessingHours)}h
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Queue</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analytics.overview.pendingCount}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-200">Pending</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {analytics.statusBreakdown.PENDING || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-200">Approved</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {analytics.statusBreakdown.APPROVED || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-200">Rejected</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {analytics.statusBreakdown.REJECTED || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Processing Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Average Approval Time:</span>
                  <span className="font-medium dark:text-gray-100">
                    {Math.round(analytics.processingMetrics.averageApprovalHours)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Average Rejection Time:</span>
                  <span className="font-medium dark:text-gray-100">
                    {Math.round(analytics.processingMetrics.averageRejectionHours)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Fastest Processing:</span>
                  <span className="font-medium dark:text-gray-100">
                    {Math.round(analytics.processingMetrics.fastestProcessingHours)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Processed:</span>
                  <span className="font-medium dark:text-gray-100">
                    {analytics.processingMetrics.totalProcessed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Performance */}
          {analytics.adminPerformance && analytics.adminPerformance.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Processed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Approvals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Approval Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {analytics.adminPerformance.map((admin) => (
                      <tr key={admin.adminId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{admin.adminName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">{admin.adminEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {admin.totalProcessed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {admin.approvals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            admin.approvalRate >= 80 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' :
                            admin.approvalRate >= 60 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400' :
                            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400'
                          }`}>
                            {Math.round(admin.approvalRate)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {Math.round(admin.averageProcessingHours)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejection Reasons */}
          {analytics.rejectionReasons && Object.keys(analytics.rejectionReasons).length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Rejection Reasons</h3>
              <div className="space-y-3">
                {Object.entries(analytics.rejectionReasons)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-200">{reason}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentDocument.user.fullName} - {currentDocument.documentType.replace('ImageUrl', '').replace('Url', '')}
              </h3>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentDocument.url}
                alt={currentDocument.documentType}
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                style={{ maxHeight: '60vh' }}
              />
            </div>
            
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => window.open(currentDocument.url, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <ZoomIn className="w-4 h-4 mr-2" />
                View Full Size
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
