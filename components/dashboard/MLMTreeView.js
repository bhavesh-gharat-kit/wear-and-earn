'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  User, 
  TrendingUp, 
  Eye, 
  ChevronRight, 
  ChevronDown,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Crown,
  Award,
  Target
} from 'lucide-react'

const MLMTreeView = () => {
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']))
  const [selectedLevel, setSelectedLevel] = useState(1)

  useEffect(() => {
    fetchTreeData()
  }, [])

  const fetchTreeData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/account/mlm-tree')
      const data = await response.json()
      
      if (response.ok) {
        setTreeData(data)
      } else {
        setError(data.message || 'Failed to load tree data')
      }
    } catch (error) {
      console.error('Error fetching tree data:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderTreeNode = (node, level = 0, isLast = false) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isActive = node.isActive
    const isCurrentUser = node.isCurrentUser

    return (
      <div key={node.id} className="relative">
        {/* Connection lines */}
        {level > 0 && (
          <div className="absolute left-0 top-0 h-full w-6 flex items-start justify-center pt-6">
            <div className={`w-px bg-gray-300 ${isLast ? 'h-6' : 'h-full'}`} />
          </div>
        )}
        {level > 0 && (
          <div className="absolute left-0 top-6 w-6 h-px bg-gray-300" />
        )}

        {/* Node content */}
        <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
          isCurrentUser 
            ? 'border-purple-500 bg-purple-50' 
            : isActive 
            ? 'border-green-200 bg-green-50 hover:bg-green-100' 
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        } ${level > 0 ? 'ml-8' : ''}`}>
          
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}

          {/* User avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            isCurrentUser 
              ? 'bg-purple-500 text-white' 
              : isActive 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-400 text-white'
          }`}>
            {isCurrentUser ? (
              <Crown className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {node.name || `User ${node.id}`}
                {isCurrentUser && <span className="text-purple-600 ml-1">(You)</span>}
              </span>
              {isActive && <CheckCircle className="w-4 h-4 text-green-500" />}
              {!isActive && <XCircle className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="text-sm text-gray-500">
              Level {level + 1} • ID: {node.id}
              {node.referralCode && (
                <span className="ml-2 text-blue-600">Code: {node.referralCode}</span>
              )}
            </div>
            {node.joinedAt && (
              <div className="text-xs text-gray-400">
                Joined: {new Date(node.joinedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {node.directReferrals || 0} Direct
            </div>
            <div className="text-xs text-gray-500">
              ₹{(node.totalEarnings || 0).toFixed(2)}
            </div>
          </div>

          {/* View details button */}
          <button className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
            {node.children.map((child, index) => 
              renderTreeNode(child, level + 1, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tree</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchTreeData}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!treeData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tree Data</h3>
          <p className="text-gray-600">Complete your first purchase to start building your MLM tree.</p>
        </div>
      </div>
    )
  }

  const stats = treeData.stats || {}
  const tree = treeData.tree || {}
  const directReferrals = treeData.directReferrals || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">My MLM Tree</h2>
            <p className="text-blue-100">Visual representation of your downline network</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.totalTeamSize || 0}</div>
            <div className="text-sm text-blue-200">Total Team Members</div>
          </div>
        </div>
      </div>

      {/* Tree Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.directReferrals || 0}</div>
              <div className="text-sm text-gray-500">Direct Referrals</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeMembers || 0}</div>
              <div className="text-sm text-gray-500">Active Members</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTeamSize || 0}</div>
              <div className="text-sm text-gray-500">Total Network</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.maxLevel || 0}</div>
              <div className="text-sm text-gray-500">Max Depth</div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">View by Level</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedLevel === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Level {level}
              {stats.levelCounts && stats.levelCounts[level] && (
                <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {stats.levelCounts[level]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Tree Structure (First 3 Levels)</h3>
          <button
            onClick={fetchTreeData}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {tree.root ? (
          <div className="space-y-4">
            {renderTreeNode(tree.root)}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tree structure will appear here once you start building your network.</p>
          </div>
        )}
      </div>

      {/* Direct Referrals List */}
      {directReferrals.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Direct Referrals</h3>
          <div className="space-y-3">
            {directReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    referral.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {referral.name || `User ${referral.id}`}
                      {referral.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {referral.id} • 
                      Joined: {new Date(referral.joinedAt).toLocaleDateString()}
                    </div>
                    {referral.referralCode && (
                      <div className="text-xs text-blue-600">Code: {referral.referralCode}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {referral.directReferrals || 0} referrals
                  </div>
                  <div className="text-xs text-gray-500">
                    ₹{(referral.totalPurchases || 0).toFixed(2)} purchases
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                    referral.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {referral.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tree Guide */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Understanding Your MLM Tree:</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
            <span><strong>Direct Referrals:</strong> People who joined using your referral code</span>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
            <span><strong>Levels:</strong> Each level represents the depth of referrals (up to 5 levels)</span>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
            <span><strong>Active Members:</strong> Users who have made at least one purchase</span>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
            <span><strong>Matrix Placement:</strong> Users are placed in a 3-wide tree structure</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default MLMTreeView
