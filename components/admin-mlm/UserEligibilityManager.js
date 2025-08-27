'use client'
import { useState, useEffect } from 'react'
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  RefreshCw,
  UserCheck,
  UserX,
  Award,
  TrendingUp,
  X
} from 'lucide-react'

export default function UserEligibilityManager() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    kycStatus: 'all', // all, pending, approved, rejected
    eligibilityStatus: 'all', // all, eligible, not_eligible
    page: 1,
    limit: 20
  })
  const [showUserModal, setShowUserModal] = useState(false)
  const [kycDetails, setKycDetails] = useState(null)

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        search: searchTerm,
        kycStatus: filters.kycStatus,
        eligibilityStatus: filters.eligibilityStatus,
        page: filters.page,
        limit: filters.limit
      })

      const response = await fetch(`/api/admin/user-eligibility?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
      } else {
        throw new Error(data.message || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Update KYC status
  const updateKycStatus = async (userId, status, rejectionReason = '') => {
    try {
      const response = await fetch('/api/admin/update-kyc-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, rejectionReason })
      })

      const data = await response.json()

      if (data.success) {
        alert(`KYC status updated to ${status}`)
        fetchUsers()
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, kycStatus: status })
        }
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('KYC update error:', error)
      alert('Error updating KYC status')
    }
  }

  // Manual eligibility override
  const updateEligibilityStatus = async (userId, isEligible, reason) => {
    try {
      const response = await fetch('/api/admin/update-eligibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isEligible, reason })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Eligibility status updated`)
        fetchUsers()
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, isEligible })
        }
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Eligibility update error:', error)
      alert('Error updating eligibility status')
    }
  }

  // Check 3-3 rule compliance
  const check33RuleCompliance = async (userId) => {
    try {
      const response = await fetch(`/api/admin/check-33-rule/${userId}`)
      const data = await response.json()

      if (data.success) {
        alert(`3-3 Rule Status:\n\nLeft Side: ${data.leftCount} referrals\nRight Side: ${data.rightCount} referrals\nCompliant: ${data.isCompliant ? 'Yes' : 'No'}\n\nDetails:\n${data.details}`)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('3-3 rule check error:', error)
      alert('Error checking 3-3 rule compliance')
    }
  }

  // Search users
  const handleSearch = () => {
    setFilters({ ...filters, page: 1 })
    fetchUsers()
  }

  // View user details
  const viewUserDetails = async (user) => {
    try {
      setSelectedUser(user)
      
      // Fetch detailed KYC information
      const response = await fetch(`/api/admin/kyc-details/${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setKycDetails(data.kycDetails)
      }
      
      setShowUserModal(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
      setKycDetails(null)
      setShowUserModal(true)
    }
  }

  // Bulk approve KYC
  const bulkApproveKyc = async () => {
    const pendingUsers = users.filter(user => user.kycStatus === 'pending')
    
    if (pendingUsers.length === 0) {
      alert('No pending KYC applications found')
      return
    }

    if (!confirm(`This will approve KYC for ${pendingUsers.length} users. Continue?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/bulk-approve-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: pendingUsers.map(u => u.id) })
      })

      const data = await response.json()

      if (data.success) {
        alert(`KYC approved for ${data.approvedCount} users`)
        fetchUsers()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Bulk approval error:', error)
      alert('Error during bulk approval')
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
            onClick={fetchUsers}
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
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Eligibility Management</h2>
            <p className="text-gray-600">Manage KYC approvals and MLM eligibility status</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={bulkApproveKyc}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Bulk Approve KYC
            </button>
            
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Search by name, email, phone, or referral code..."
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
              value={filters.kycStatus}
              onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All KYC Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={filters.eligibilityStatus}
              onChange={(e) => setFilters({ ...filters, eligibilityStatus: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Eligibility</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not Eligible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">KYC Approved</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(user => user.kycStatus === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">KYC Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(user => user.kycStatus === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">MLM Eligible</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(user => user.isEligible).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">User Eligibility Overview</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MLM Eligible</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3-3 Rule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Purchase</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.id} | Code: {user.referralCode}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.kycStatus === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : user.kycStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.kycStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.kycStatus || 'Not Submitted'}
                    </span>

                    {user.kycStatus === 'pending' && (
                      <div className="mt-2 space-x-1">
                        <button
                          onClick={() => updateKycStatus(user.id, 'approved')}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:')
                            if (reason) updateKycStatus(user.id, 'rejected', reason)
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.isEligible ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm text-gray-900">
                        {user.isEligible ? 'Eligible' : 'Not Eligible'}
                      </span>
                    </div>

                    <div className="mt-2 space-x-1">
                      {user.isEligible ? (
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for making ineligible:')
                            if (reason) updateEligibilityStatus(user.id, false, reason)
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Make Ineligible
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for making eligible:')
                            if (reason) updateEligibilityStatus(user.id, true, reason)
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Make Eligible
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      L: {user.leftReferrals || 0} | R: {user.rightReferrals || 0}
                    </div>
                    <button
                      onClick={() => check33RuleCompliance(user.id)}
                      className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Check Compliance
                    </button>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{user.monthlyPurchase?.toLocaleString() || 0}
                    </div>
                    <div className={`text-xs ${
                      (user.monthlyPurchase || 0) >= 3000 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(user.monthlyPurchase || 0) >= 3000 ? 'Meets Min' : 'Below Min'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewUserDetails(user)}
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

        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">User Information</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{selectedUser.fullName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedUser.mobileNo}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Referral Code</label>
                    <p className="text-gray-900 font-mono">{selectedUser.referralCode}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Joined</label>
                    <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* KYC Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">KYC Information</h4>
                
                {kycDetails ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Document Type</label>
                      <p className="text-gray-900">{kycDetails.documentType}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Document Number</label>
                      <p className="text-gray-900">{kycDetails.documentNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        kycDetails.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : kycDetails.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {kycDetails.status}
                      </span>
                    </div>
                    
                    {kycDetails.documents?.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Documents</label>
                        <div className="mt-2 space-y-2">
                          {kycDetails.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">{doc.name}</span>
                              <button
                                onClick={() => window.open(doc.url, '_blank')}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No KYC details available</p>
                )}
              </div>
            </div>

            {/* MLM Status */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">MLM Status</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">Eligibility Status</p>
                  <div className="flex items-center mt-2">
                    {selectedUser.isEligible ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-900">
                      {selectedUser.isEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">Monthly Purchase</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    ₹{selectedUser.monthlyPurchase?.toLocaleString() || 0}
                  </p>
                  <p className={`text-xs mt-1 ${
                    (selectedUser.monthlyPurchase || 0) >= 3000 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Min: ₹3,000
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">Wallet Balance</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    ₹{selectedUser.walletBalance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
