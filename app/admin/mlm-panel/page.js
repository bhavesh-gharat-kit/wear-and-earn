'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  Wallet
} from 'lucide-react'

export default function AdminMLMPanel() {
  const { data: session, status } = useSession()
  const [mlmOverview, setMlmOverview] = useState(null)
  const [commissions, setCommissions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    userFilter: 'all',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.role === 'admin') {
        try {
          setLoading(true)
          
          // Fetch MLM overview
          const overviewRes = await fetch(`/api/admin/mlm-overview?page=${filters.page}&limit=${filters.limit}&filter=${filters.userFilter}`)
          if (overviewRes.ok) {
            const overviewData = await overviewRes.json()
            setMlmOverview(overviewData)
          }

          // Fetch commission data
          const commissionsRes = await fetch(`/api/admin/commissions?page=1&limit=50`)
          if (commissionsRes.ok) {
            const commissionsData = await commissionsRes.json()
            setCommissions(commissionsData)
          }
        } catch (error) {
          console.error('Error fetching MLM data:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchData()
  }, [session?.user?.role, filters.page, filters.limit, filters.userFilter])

  const fetchMLMData = async () => {
    try {
      setLoading(true)
      
      // Fetch MLM overview
      const overviewRes = await fetch(`/api/admin/mlm-overview?page=${filters.page}&limit=${filters.limit}&filter=${filters.userFilter}`)
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json()
        setMlmOverview(overviewData)
      }

      // Fetch commission data
      const commissionsRes = await fetch(`/api/admin/commissions?page=1&limit=50`)
      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json()
        setCommissions(commissionsData)
      }
    } catch (error) {
      console.error('Error fetching MLM data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page requires admin access.</p>
        </div>
      </div>
    )
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{mlmOverview?.stats?.users?.total || 0}</p>
              <p className="text-xs text-green-600">{mlmOverview?.stats?.users?.active || 0} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">KYC Approved</p>
              <p className="text-2xl font-bold text-gray-900">{mlmOverview?.stats?.users?.kycApproved || 0}</p>
              <p className="text-xs text-blue-600">{mlmOverview?.stats?.users?.withReferrals || 0} with referrals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Commission Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{mlmOverview?.stats?.commissions?.totalPaid?.rupees || 0}</p>
              <p className="text-xs text-purple-600">₹{mlmOverview?.stats?.commissions?.monthlyPaid?.rupees || 0} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-orange-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Company Fund</p>
              <p className="text-2xl font-bold text-gray-900">₹{mlmOverview?.stats?.company?.fund?.rupees || 0}</p>
              <p className="text-xs text-orange-600">{mlmOverview?.stats?.monthly?.orders || 0} orders this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Level Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {mlmOverview?.levelDistribution?.map((level) => (
            <div key={level.level} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Level {level.level}</p>
              <p className="text-xl font-bold text-gray-900">{level.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Referral Code</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total Earnings</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Direct Referrals</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mlmOverview?.topPerformers?.map((performer) => (
                <tr key={performer.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{performer.fullName}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{performer.referralCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">₹{performer.totalEarnings?.rupees || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{performer.directReferrals}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      performer.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {performer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <div className="flex items-center space-x-4">
            <select
              value={filters.userFilter}
              onChange={(e) => setFilters({...filters, userFilter: e.target.value, page: 1})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
            </select>
            <button
              onClick={fetchMLMData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Contact</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Referral Code</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Wallet Balance</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Monthly Purchase</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mlmOverview?.users?.data?.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{user.mobileNo}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {user.referralCode || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ₹{user.walletBalance?.rupees || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ₹{user.monthlyPurchase?.rupees || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.isKycApproved && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          KYC
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {mlmOverview?.users?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, mlmOverview.users.pagination.total)} of {mlmOverview.users.pagination.total} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({...filters, page: filters.page + 1})}
                disabled={filters.page >= mlmOverview.users.pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderCommissionsTab = () => (
    <div className="space-y-6">
      {/* Commission Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Commissions</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{commissions?.summary?.totalCommissions?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{commissions?.summary?.thisMonth?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {commissions?.transactions?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Commission Transactions</h3>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Level</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions?.transactions?.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.user?.fullName || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'COMMISSION' 
                        ? 'bg-green-100 text-green-800' 
                        : transaction.type === 'ACTIVATION'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ₹{transaction.amount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.metadata?.level || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commission Analytics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Commission by Level</h4>
            <div className="space-y-2">
              {commissions?.levelStats?.map((level) => (
                <div key={level.level} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Level {level.level}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">₹{level.totalAmount?.toLocaleString() || 0}</span>
                    <span className="text-xs text-gray-500">({level.count} transactions)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Commission Types</h4>
            <div className="space-y-2">
              {commissions?.typeStats?.map((type) => (
                <div key={type.type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{type.type}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">₹{type.totalAmount?.toLocaleString() || 0}</span>
                    <span className="text-xs text-gray-500">({type.count} transactions)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MLM Management Panel</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your MLM system</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'commissions', name: 'Commissions', icon: DollarSign },
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

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'commissions' && renderCommissionsTab()}
      </div>
    </div>
  )
}
