'use client'
import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Users, 
  Plus, 
  Move,
  Eye,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
  Settings,
  UserPlus,
  Shuffle,
  X
} from 'lucide-react'

export default function MLMTreeAdmin() {
  const [matrixData, setMatrixData] = useState(null)
  const [searchUser, setSearchUser] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [placementData, setPlacementData] = useState({ userId: '', parentId: '', position: '' })
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'all',
    hasIssues: false
  })

  // Fetch matrix data
  const fetchMatrixData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/matrix-view')
      const data = await response.json()
      
      if (data.success) {
        setMatrixData(data.matrix)
      } else {
        throw new Error(data.message || 'Failed to fetch matrix data')
      }
    } catch (err) {
      console.error('Error fetching matrix:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatrixData()
  }, [fetchMatrixData])

  // Search user in matrix
  const searchUserInMatrix = async () => {
    if (!searchUser.trim()) return
    
    try {
      const response = await fetch(`/api/admin/search-user-in-matrix?query=${encodeURIComponent(searchUser)}`)
      const data = await response.json()
      
      if (data.success && data.user) {
        setSelectedUser(data.user)
        // Scroll to user or highlight
        const element = document.getElementById(`user-${data.user.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-4', 'ring-blue-500')
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500')
          }, 3000)
        }
      } else {
        alert('User not found in matrix')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Error searching user')
    }
  }

  // Manual user placement
  const handleManualPlacement = async () => {
    try {
      const response = await fetch('/api/admin/manual-placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placementData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('User placed successfully!')
        setShowPlacementModal(false)
        setPlacementData({ userId: '', parentId: '', position: '' })
        fetchMatrixData()
      } else {
        alert(`Placement failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Placement error:', error)
      alert('Error during placement')
    }
  }

  // Fix matrix issues
  const fixMatrixIssues = async () => {
    if (!confirm('This will attempt to fix matrix placement issues. Continue?')) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/admin/fix-matrix-issues', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Fixed ${data.fixed} matrix issues`)
        fetchMatrixData()
      } else {
        alert(`Fix failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Fix error:', error)
      alert('Error fixing matrix issues')
    } finally {
      setLoading(false)
    }
  }

  // Export matrix data
  const exportMatrix = async () => {
    try {
      const response = await fetch('/api/admin/export-matrix')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matrix-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting matrix data')
    }
  }

  // Filter matrix data
  const filteredMatrix = matrixData?.filter(node => {
    if (filters.level !== 'all' && node.level !== parseInt(filters.level)) return false
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !node.user?.isActive) return false
      if (filters.status === 'inactive' && node.user?.isActive) return false
    }
    if (filters.hasIssues) {
      // Check for placement issues
      const hasIssue = !node.user || (node.level > 1 && !node.parentId)
      if (!hasIssue) return false
    }
    return true
  })

  // Build tree structure for visualization
  const buildTreeStructure = (nodes) => {
    const tree = {}
    const orphans = []
    
    nodes.forEach(node => {
      if (node.level === 1) {
        tree[node.id] = { ...node, children: [] }
      } else if (node.parentId && tree[node.parentId]) {
        tree[node.parentId].children.push(node)
      } else {
        orphans.push(node)
      }
    })
    
    return { tree: Object.values(tree), orphans }
  }

  const { tree, orphans } = matrixData ? buildTreeStructure(filteredMatrix || matrixData) : { tree: [], orphans: [] }

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
            onClick={fetchMatrixData}
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
          <h2 className="text-xl font-semibold text-gray-900">MLM Tree Administration</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search user by name, ID, or referral code..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUserInMatrix()}
                className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <button
                onClick={searchUserInMatrix}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 border border-blue-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowPlacementModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Manual Placement
            </button>

            <button
              onClick={fixMatrixIssues}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Fix Issues
            </button>

            <button
              onClick={exportMatrix}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            <button
              onClick={fetchMatrixData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>

          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasIssues}
              onChange={(e) => setFilters({ ...filters, hasIssues: e.target.checked })}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Show Issues Only</span>
          </label>
        </div>
      </div>

      {/* Matrix Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Nodes</p>
              <p className="text-xl font-bold text-gray-900">{matrixData?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-xl font-bold text-gray-900">
                {matrixData?.filter(node => node.user?.isActive).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Issues</p>
              <p className="text-xl font-bold text-gray-900">{orphans.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Max Level</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.max(...(matrixData?.map(node => node.level) || [0]))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Tree Visualization */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MLM Tree Structure</h3>
        
        {/* Tree nodes */}
        <div className="space-y-6">
          {tree.map(node => (
            <div key={node.id} className="border border-gray-200 rounded-lg p-4">
              <div 
                id={`user-${node.id}`}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-3">
                    L{node.level}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {node.user?.fullName || 'Empty Node'}
                    </p>
                    <p className="text-sm text-gray-600">
                      ID: {node.user?.id} | Code: {node.user?.referralCode || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    node.user?.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {node.user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => setSelectedUser(node)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Children */}
              {node.children && node.children.length > 0 && (
                <div className="mt-4 ml-8 space-y-2">
                  {node.children.map(child => (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">
                          L{child.level}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {child.user?.fullName || 'Empty Node'}
                          </p>
                          <p className="text-xs text-gray-600">
                            Position: {child.position} | ID: {child.user?.id}
                          </p>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        child.user?.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {child.user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Orphaned nodes */}
        {orphans.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Orphaned Nodes ({orphans.length})
            </h4>
            <div className="space-y-2">
              {orphans.map(node => (
                <div key={node.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {node.user?.fullName || 'Empty Node'}
                    </p>
                    <p className="text-sm text-red-600">
                      Level {node.level} | Expected Parent ID: {node.parentId} | Issue: Missing parent connection
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPlacementData({ 
                        userId: node.user?.id || '', 
                        parentId: '', 
                        position: node.position || ''
                      })
                      setShowPlacementModal(true)
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Fix Placement
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {matrixData && matrixData.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No matrix data available</p>
          </div>
        )}
      </div>

      {/* Manual Placement Modal */}
      {showPlacementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual User Placement</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={placementData.userId}
                  onChange={(e) => setPlacementData({ ...placementData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter user ID to place"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent User ID</label>
                <input
                  type="text"
                  value={placementData.parentId}
                  onChange={(e) => setPlacementData({ ...placementData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter parent user ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  value={placementData.position}
                  onChange={(e) => setPlacementData({ ...placementData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select position</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPlacementModal(false)
                  setPlacementData({ userId: '', parentId: '', position: '' })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualPlacement}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Place User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-gray-900">{selectedUser.user?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">User ID</p>
                  <p className="text-gray-900">{selectedUser.user?.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Referral Code</p>
                  <p className="text-gray-900 font-mono">{selectedUser.user?.referralCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.user?.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Matrix Level</p>
                  <p className="text-gray-900">{selectedUser.level}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Position</p>
                  <p className="text-gray-900">{selectedUser.position || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Parent ID</p>
                  <p className="text-gray-900">{selectedUser.parentId || 'Root'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Wallet Balance</p>
                  <p className="text-gray-900">₹{selectedUser.user?.walletBalance?.rupees || 0}</p>
                </div>
              </div>
              
              {selectedUser.parent && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Parent Details</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Name:</span> {selectedUser.parent.user?.fullName}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Code:</span> {selectedUser.parent.user?.referralCode}
                    </p>
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
