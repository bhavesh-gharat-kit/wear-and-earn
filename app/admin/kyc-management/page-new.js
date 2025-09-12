'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
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
  const [loading, setLoading] = useState(true)
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
      const result = await response.json()
      
      if (result.success) {
        setKycQueue(result.data)
      }
    } catch (error) {
      console.error('Error fetching KYC queue:', error)
    }
  }, [filters])

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'loading') return
      
      if (!session?.user?.role || session.user.role !== 'admin') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        await fetchKycQueue()
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, status, fetchKycQueue])

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
      url: user.kycData?.[documentType]
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
      'Submitted At': user.kycData?.submittedAt ? new Date(user.kycData.submittedAt).toLocaleDateString() : 'N/A',
      'Waiting Days': user.waitingDays,
      'Aadhaar Number': user.kycData?.aadharNumber || 'N/A',
      'PAN Number': user.kycData?.panNumber || 'N/A',
    }))

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0]).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `kyc_data_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && !kycQueue.users) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-300">Loading KYC data...</p>
        </div>
      </div>
    )
  }

  // If user is not admin, show access denied
  if (!session?.user?.role || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">KYC Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage user KYC submissions and approval workflow</p>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => fetchKycQueue()}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KYC Queue */}
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
                    {kycQueue.statistics.averageProcessingDays || 0}d
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or mobile..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={exportKycData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* KYC Queue Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KYC Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {kycQueue.users && kycQueue.users.length > 0 ? (
                  kycQueue.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.mobileNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          <div>Aadhaar: {user.kycData?.aadharNumber || 'N/A'}</div>
                          <div>PAN: {user.kycData?.panNumber || 'N/A'}</div>
                          <div>Bank: {user.kycData?.bankName || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.kycData?.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                          user.kycData?.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                        }`}>
                          {user.kycData?.status || 'pending'}
                        </span>
                        {user.waitingDays > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {user.waitingDays} days ago
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.kycData?.submittedAt ? new Date(user.kycData.submittedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {user.kycData?.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleKycAction(user.id, 'approve', 'Admin approved KYC')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleKycAction(user.id, 'reject', 'Admin rejected KYC', ['Incomplete documents'])}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              <XCircle className="w-4 h-4 inline mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No KYC submissions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {kycQueue.pagination && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, kycQueue.pagination.total)} of {kycQueue.pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters({...filters, page: filters.page - 1})}
                  disabled={!kycQueue.pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {filters.page} of {kycQueue.pagination.totalPages}
                </span>
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                KYC Details - {selectedUser.fullName}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Full Name:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.fullName || selectedUser.fullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedUser.kycData?.dateOfBirth ? new Date(selectedUser.kycData.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Gender:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Father&apos;s Name:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.fatherName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Identity Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Aadhaar Number:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.aadharNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">PAN Number:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.panNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Bank Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Account Number:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.bankAccountNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">IFSC Code:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.ifscCode || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Bank Name:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Branch Name:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.branchName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Nominee Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Nominee Name:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.nomineeName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Nominee Relation:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedUser.kycData?.nomineeRelation || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {selectedUser.kycData?.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        handleKycAction(selectedUser.id, 'approve', 'Admin approved KYC')
                        setSelectedUser(null)
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve KYC
                    </button>
                    <button
                      onClick={() => {
                        handleKycAction(selectedUser.id, 'reject', 'Admin rejected KYC', ['Incomplete documents'])
                        setSelectedUser(null)
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject KYC
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentDocument.documentType} - {currentDocument.user.fullName}
              </h3>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="relative w-full h-96">
                <Image 
                  src={currentDocument.url} 
                  alt="KYC Document"
                  fill
                  className="object-contain rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
