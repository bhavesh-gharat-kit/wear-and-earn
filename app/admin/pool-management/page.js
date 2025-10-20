'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award,
  Eye,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  Wallet,
  Target,
  Crown,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'

export default function PoolManagementPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [poolStats, setPoolStats] = useState(null)
  const [poolDistribution, setPoolDistribution] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDistributing, setIsDistributing] = useState(false)
  const [distributionProgress, setDistributionProgress] = useState(0)
  const [showDistributionDialog, setShowDistributionDialog] = useState(false)
  const [distributionPreview, setDistributionPreview] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'all',
    page: 1,
    limit: 20,
    search: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    const fetchPoolData = async () => {
      if (status === 'loading') return
      
      if (!session?.user?.role || session.user.role !== 'admin') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Fetch pool overview stats
        const [statsRes, distributionRes] = await Promise.all([
          fetch('/api/admin/pool-management'),
          fetch('/api/admin/pool-distribution')
        ])
        
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setPoolStats(statsData)
        }
        
        if (distributionRes.ok) {
          const distributionData = await distributionRes.json()
          setPoolDistribution(distributionData)
        }
        
      } catch (error) {
        console.error('Error fetching pool data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPoolData()
  }, [session, status])

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/teams?level=${filters.level}&status=${filters.status}&page=${filters.page}&limit=${filters.limit}`)
      
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }, [filters.level, filters.status, filters.page, filters.limit])

  useEffect(() => {
    if (activeTab === 'teams') {
      fetchTeams()
    }
  }, [activeTab, filters, fetchTeams])

  const handleDistributePool = async () => {
    // First show preview dialog
    await fetchDistributionPreview()
    setShowDistributionDialog(true)
  }

  const fetchDistributionPreview = async () => {
    try {
      const response = await fetch('/api/admin/pool-distribution')
      if (response.ok) {
        const data = await response.json()
        setDistributionPreview(data)
      }
    } catch (error) {
      console.error('Error fetching distribution preview:', error)
    }
  }

  const confirmDistribution = async () => {
    try {
      setIsDistributing(true)
      setDistributionProgress(0)
      setShowDistributionDialog(false)

      const response = await fetch('/api/admin/pool-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'distribute' })
      })

      // Simulate progress tracking
      const progressInterval = setInterval(() => {
        setDistributionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 500)

      if (response.ok) {
        const result = await response.json()
        setDistributionProgress(100)
        setTimeout(() => {
          const amount = result.data?.totalAmountDistributed || '0'
          const users = result.data?.usersRewarded || 0
          alert(`🎉 Pool Distribution Completed Successfully!\n\n💰 Total Amount Distributed: ₹${amount}\n👥 Users Rewarded: ${users}\n\n✅ All amounts have been added to user wallets.`)
          // Refresh data
          refreshData()
          setIsDistributing(false)
          setDistributionProgress(0)
        }, 1000)
      } else {
        const error = await response.json()
        alert('Error distributing pool: ' + error.message)
        setIsDistributing(false)
        setDistributionProgress(0)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to distribute pool')
      setIsDistributing(false)
      setDistributionProgress(0)
    }
  }

  const handleViewUserDetails = (userId) => {
    router.push(`/admin/user-details/${userId}`)
  }

  const exportDistributionHistory = () => {
    // Create CSV data
    const csvData = poolDistribution?.recentDistributions?.map(dist => {
      const distributionAmount = dist.amount / 100; // Convert paisa to rupees
      const totalMLMAmount = Math.round(distributionAmount / 0.7);
      const companyShare = Math.round(distributionAmount * 0.3 / 0.7);
      
      return {
        Date: new Date(dist.createdAt).toLocaleDateString(),
        'Total MLM Amount (100%)': totalMLMAmount,
        'Distribution Amount (70%)': distributionAmount,
        'Company Share (30%)': companyShare,
        Users: dist.userCount,
        Status: 'Completed'
      };
    }) || []

    if (csvData.length === 0) {
      alert('No data to export')
      return
    }

    // Convert to CSV
    const headers = Object.keys(csvData[0]).join(',')
    const rows = csvData.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pool_distribution_history_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      // Fetch pool overview stats
      const [statsRes, distributionRes] = await Promise.all([
        fetch('/api/admin/pool-management'),
        fetch('/api/admin/pool-distribution')
      ])
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setPoolStats(statsData)
      }
      
      if (distributionRes.ok) {
        const distributionData = await distributionRes.json()
        setPoolDistribution(distributionData)
      }
      
    } catch (error) {
      console.error('Error fetching pool data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100) // Convert paisa to rupees
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pool Management Panel</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage the new pool-based MLM system, teams, and distributions</p>
      </div>

      {/* Tab Navigation */}
  <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: TrendingUp },
            { id: 'distribution', name: 'Pool Distribution', icon: DollarSign },
            { id: 'teams', name: 'Teams', icon: Users },
            { id: 'levels', name: 'Level Management', icon: Crown },
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
        
        {/* Real-time Refresh Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Pool Amount</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {poolStats ? formatCurrency(poolStats.totalPoolAmount || 0) : '₹0'}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Teams</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {poolStats ? poolStats.activeTeams || 0 : 0}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">L5 Users</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {poolStats ? poolStats.l5Users || 0 : 0}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Distributions</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {poolStats ? poolStats.pendingDistributions || 0 : 0}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                  <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Level Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">User Level Distribution</h3>
            <div className="space-y-4">
              {poolStats?.levelDistribution && Object.entries(poolStats.levelDistribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Crown className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
                    <span className="font-medium dark:text-gray-200">Level {level}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{count} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pool Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pool Distribution Control</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDistributePool}
                  disabled={isDistributing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {isDistributing ? 'Distributing...' : 'Distribute Pool Now'}
                </button>
                <button
                  onClick={exportDistributionHistory}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export History
                </button>
              </div>
            </div>
            
            {/* Distribution Progress */}
            {isDistributing && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-800 dark:text-blue-200 font-medium">Distribution in Progress...</span>
                  <span className="text-blue-600 dark:text-blue-400">{Math.round(distributionProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${distributionProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Current Pool Status</h4>
                <div className="space-y-2">
                  <p>Total Amount: <span className="font-bold text-green-600 dark:text-green-400">{poolDistribution ? formatCurrency(poolDistribution.totalAmount || 0) : '₹0'}</span></p>
                  <p>Eligible Users: <span className="font-bold text-blue-600 dark:text-blue-400">{poolDistribution ? poolDistribution.eligibleUsers || 0 : 0}</span></p>
                  <p>Last Distribution: <span className="font-medium dark:text-gray-200">{poolDistribution?.lastDistribution?.date ? new Date(poolDistribution.lastDistribution.date).toLocaleDateString() : 'Never'}</span></p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Distribution by Level</h4>
                <div className="space-y-2">
                  {poolDistribution?.levelBreakdown && Object.entries(poolDistribution.levelBreakdown).map(([level, data]) => {
                    const hasUsers = data.users > 0;
                    const displayAmount = hasUsers ? data.amount : 0;
                    const companyRetainedAmount = hasUsers ? 0 : data.amount;
                    
                    return (
                      <p key={level}>
                        L{level}: <span className="font-bold dark:text-gray-100">{data.users} users</span> - 
                        <span className={`${hasUsers ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formatCurrency(displayAmount)}
                        </span>
                        {!hasUsers && companyRetainedAmount > 0 && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                            (₹{(companyRetainedAmount / 100).toFixed(2)} retained by company)
                          </span>
                        )}
                      </p>
                    );
                  })}
                  
                  {/* Show total company retained amount */}
                  {poolDistribution?.levelBreakdown && (() => {
                    const totalCompanyRetained = Object.values(poolDistribution.levelBreakdown)
                      .reduce((sum, data) => sum + (data.users === 0 ? data.amount : 0), 0);
                    
                    if (totalCompanyRetained > 0) {
                      return (
                        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            Total Company Retained: {formatCurrency(totalCompanyRetained)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Distributions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Distribution History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">MLM Breakdown</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Level Breakdown</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {poolDistribution?.recentDistributions?.map((dist, index) => {
                    const distributionAmount = dist.amount;
                    const totalMLMAmount = Math.round(distributionAmount / 0.7);
                    const companyShare = Math.round(distributionAmount * 0.3 / 0.7);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(dist.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300 text-xs">A. Total MLM (100%):</span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(totalMLMAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300 text-xs">B. Distribution (70%):</span>
                              <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(distributionAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-300 text-xs">C. Company Share (30%):</span>
                              <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(companyShare)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {dist.userCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {/* Show level breakdown if available */}
                          {dist.levelBreakdown ? (
                            <div className="space-y-1">
                              {Object.entries(dist.levelBreakdown).map(([level, info]) => (
                                <div key={level} className="flex justify-between text-xs">
                                  <span className="font-semibold">L{level}:</span>
                                  <span>{info.users} users</span>
                                  <span>₹{info.amount}</span>
                                </div>
                              ))}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          Completed
                        </td>
                      </tr>
                    );
                  }) || (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
                        No recent distributions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({...filters, level: e.target.value, page: 1})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button
                onClick={fetchTeams}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mt-6"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Teams List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Team Leader</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Team Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{team.leaderName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">{team.leaderEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        Level {team.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {team.teamCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          team.isActive ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400'
                        }`}>
                          {team.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <button 
                          onClick={() => handleViewUserDetails(team.userId)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                          title="View User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Level Management Tab */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Level Promotion Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Crown className={`w-8 h-8 mx-auto mb-2 ${level === 5 ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  <h4 className="font-bold text-lg dark:text-gray-100">Level {level}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {level === 1 ? '1 Team' : 
                     level === 2 ? '9 Teams' :
                     level === 3 ? '27 Teams' :
                     level === 4 ? '81 Teams' :
                     '243 Teams'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Pool: {level === 1 ? '30%' : level === 2 ? '20%' : level === 3 ? '20%' : level === 4 ? '15%' : '15%'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Level Statistics</h3>
            <div className="space-y-4">
              {poolStats?.levelStats && Object.entries(poolStats.levelStats).map(([level, stats]) => (
                <div key={level} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center">
                    <Crown className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <span className="font-medium dark:text-gray-200">Level {level}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg dark:text-gray-100">{stats.users} users</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{formatCurrency(stats.totalEarnings)} earned</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Distribution Confirmation Dialog */}
      {showDistributionDialog && distributionPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Pool Distribution</h3>
              <button
                onClick={() => setShowDistributionDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Distribution Preview</span>
                </div>
                
                {/* MLM Amount Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-3 border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">MLM Amount Breakdown:</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">A. Total MLM Amount (100%):</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {distributionPreview ? formatCurrency(Math.round((distributionPreview.totalAmount || 0) / 0.7)) : '₹0'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">B. Distribution Amount (70%):</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {distributionPreview ? formatCurrency(distributionPreview.totalAmount || 0) : '₹0'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">C. Company Share (30%):</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {distributionPreview ? formatCurrency(Math.round((distributionPreview.totalAmount || 0) * 0.3 / 0.7)) : '₹0'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Eligible Users: <span className="font-bold">{distributionPreview ? distributionPreview.eligibleUsers || 0 : 0}</span>
                </p>
              </div>
              
              {distributionPreview?.levelBreakdown && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">Level-wise Distribution:</p>
                  {Object.entries(distributionPreview.levelBreakdown).map(([level, data]) => (
                    <div key={level} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Level {level}:</span>
                      <span className="font-medium dark:text-gray-100">
                        {data.users} users × {formatCurrency(data.amount / (data.users || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDistributionDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDistribution}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
