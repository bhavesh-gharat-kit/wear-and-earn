'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  User, 
  Package, 
  Wallet, 
  Users, 
  Share2, 
  FileText, 
  Settings,
  Copy,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  UserPlus,
  Award,
  ChevronRight,
  Download,
  Upload,
  Check,
  X,
  AlertCircle,
  Calendar,
  CreditCard,
  Banknote,
  TrendingDown,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

const AccountDashboard = () => {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [showBalance, setShowBalance] = useState(true)
  const [userData, setUserData] = useState(null)
  const [mlmData, setMlmData] = useState(null)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [kycData, setKycData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kycForm, setKycForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    fatherName: '',
    aadharNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    nomineeName: '',
    nomineeRelation: ''
  })
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }
    
    if (session?.user?.id) {
      fetchUserData()
      fetchMlmData()
      fetchOrders()
      fetchStats()
      fetchKycData()
    } else {
      setLoading(false)
    }
  }, [session, status])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/account/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchMlmData = async () => {
    try {
      const response = await fetch('/api/account/mlm-profile')
      if (response.ok) {
        const data = await response.json()
        setMlmData(data)
      }
    } catch (error) {
      console.error('Error fetching MLM data:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/account/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/account/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchKycData = async () => {
    try {
      const response = await fetch('/api/account/kyc')
      if (response.ok) {
        const data = await response.json()
        setKycData(data)
        if (data) {
          setKycForm(data)
        }
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setWithdrawLoading(true)
    try {
      const response = await fetch('/api/account/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      })

      if (response.ok) {
        alert('Withdrawal request submitted successfully!')
        setWithdrawAmount('')
        fetchMlmData() // Refresh wallet data
      } else {
        const error = await response.json()
        alert(error.message || 'Withdrawal failed')
      }
    } catch (error) {
      alert('Network error occurred')
    }
    setWithdrawLoading(false)
  }

  const handleKycSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/account/kyc', {
        method: kycData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycForm)
      })

      if (response.ok) {
        alert('KYC information submitted successfully!')
        fetchKycData()
      } else {
        const error = await response.json()
        alert(error.message || 'KYC submission failed')
      }
    } catch (error) {
      alert('Network error occurred')
    }
  }

  const copyReferralCode = () => {
    if (mlmData?.referralCode) {
      navigator.clipboard.writeText(mlmData.referralCode)
      alert('Referral code copied to clipboard!')
    }
  }

  const copyReferralLink = () => {
    if (mlmData?.referralCode) {
      const link = `${window.location.origin}/login-register?ref=${mlmData.referralCode}`
      navigator.clipboard.writeText(link)
      alert('Referral link copied to clipboard!')
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userData?.fullName || session?.user?.name || 'User'}! 👋
            </h1>
            <p className="text-indigo-100 text-lg">
              {userData?.isActive ? 'Your MLM account is active' : 'Complete your first purchase to activate MLM benefits'}
            </p>
            <div className="flex items-center mt-4 space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData?.isActive ? 'bg-green-500 bg-opacity-20 text-green-100' : 'bg-yellow-500 bg-opacity-20 text-yellow-100'
              }`}>
                {userData?.isActive ? '✓ Active Member' : '⏳ Pending Activation'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData?.isKycApproved ? 'bg-green-500 bg-opacity-20 text-green-100' : 'bg-red-500 bg-opacity-20 text-red-100'
              }`}>
                {userData?.isKycApproved ? '✓ KYC Verified' : '⚠ KYC Pending'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200 mb-1">Member Since</div>
            <div className="text-lg font-semibold">
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.totalOrders || 0}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                +{stats?.monthlyOrders || 0} this month
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-gray-800">₹{stats?.totalSpent || 0}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                ₹{stats?.monthlySpent || 0} this month
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Team Size</p>
              <p className="text-3xl font-bold text-gray-800">{mlmData?.totalReferrals || 0}</p>
              <p className="text-xs text-purple-600 font-medium mt-1">
                Level {mlmData?.level || 1} Member
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold text-gray-800">
                {showBalance ? `₹${(mlmData?.walletBalance || 0) / 100}` : '₹ ****'}
              </p>
              <p className="text-xs text-yellow-600 font-medium mt-1">
                +₹{(mlmData?.monthlyEarnings || 0) / 100} this month
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Wallet className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-blue-600" />
            Referral Program
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <code className="font-mono font-bold text-lg">
                  {mlmData?.referralCode || 'N/A'}
                </code>
                <button
                  onClick={copyReferralCode}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy code"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={copyReferralLink}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Copy Referral Link
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-green-600" />
            Quick Withdraw
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !userData?.isKycApproved}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {withdrawLoading ? 'Processing...' : 'Withdraw Funds'}
            </button>
            {!userData?.isKycApproved && (
              <p className="text-xs text-red-600 text-center">
                Complete KYC verification to withdraw funds
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            Account Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">MLM Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userData?.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {userData?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">KYC Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userData?.isKycApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userData?.isKycApproved ? 'Verified' : 'Pending'}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('kyc')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {userData?.isKycApproved ? 'View KYC' : 'Complete KYC'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View All <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
        
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.total}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No orders yet</h4>
            <p className="text-gray-400 mb-4">Start shopping to see your orders here</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Orders</option>
            <option>Pending</option>
            <option>In Process</option>
            <option>Delivered</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
                    <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.deliveredAt && (
                      <p className="text-green-600 text-sm">
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'inProcess' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status === 'inProcess' ? 'In Process' : 
                     order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">₹{order.total}</p>
                    <p className="text-sm text-gray-500">
                      Including ₹{order.deliveryCharges} delivery
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Delivery Address</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{order.address}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>₹{(order.total - order.deliveryCharges - order.gstAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST:</span>
                        <span>₹{order.gstAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery:</span>
                        <span>₹{order.deliveryCharges}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total:</span>
                        <span>₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Download Invoice
                  </button>
                  {order.status === 'delivered' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Reorder
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No orders found</h3>
          <p className="text-gray-400 mb-6">You haven&apos;t placed any orders yet</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Start Shopping
          </button>
        </div>
      )}
    </div>
  )

  const renderWalletTab = () => (
    <div className="space-y-6">
      {/* Wallet Header */}
      <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Wallet 💰</h2>
            <p className="text-green-100 mb-4">Manage your earnings and withdrawals</p>
            <div className="flex items-center space-x-4">
              <div className="text-5xl font-bold">
                {showBalance ? `₹${((mlmData?.walletBalance || 0) / 100).toFixed(2)}` : '₹ ****'}
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              >
                {showBalance ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
            <p className="text-green-100 text-sm mt-2">Current wallet balance</p>
          </div>
          <div className="text-right">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <Wallet className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Available Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-800">₹{((mlmData?.totalEarnings || 0) / 100).toFixed(2)}</p>
              <p className="text-xs text-green-600 font-medium">All time earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold text-gray-800">₹{((mlmData?.monthlyEarnings || 0) / 100).toFixed(2)}</p>
              <p className="text-xs text-blue-600 font-medium">Current month earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Withdrawable</p>
              <p className="text-2xl font-bold text-gray-800">₹{((mlmData?.withdrawableBalance || 0) / 100).toFixed(2)}</p>
              <p className="text-xs text-purple-600 font-medium">Ready to withdraw</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Banknote className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Withdrawn</p>
              <p className="text-2xl font-bold text-gray-800">₹{((mlmData?.totalWithdrawn || 0) / 100).toFixed(2)}</p>
              <p className="text-xs text-yellow-600 font-medium">Lifetime withdrawals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdraw Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2 text-green-600" />
            Withdraw Funds
          </h3>
          {userData?.isKycApproved ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="1"
                    max={(mlmData?.withdrawableBalance || 0) / 100}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Min: ₹1 | Max: ₹{((mlmData?.withdrawableBalance || 0) / 100).toFixed(2)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Bank Details</h4>
                <p className="text-sm text-gray-600">
                  Funds will be transferred to your registered bank account
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Processing time: 1-3 business days
                </p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !withdrawAmount || withdrawAmount <= 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {withdrawLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-2">KYC Verification Required</h4>
              <p className="text-gray-400 mb-4">Complete your KYC verification to withdraw funds</p>
              <button
                onClick={() => setActiveTab('kyc')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete KYC
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Recent Transactions
            </h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All
            </button>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {mlmData?.recentTransactions?.length > 0 ? (
              mlmData.recentTransactions.map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.amount > 0 ? 
                        <TrendingUp className="w-4 h-4 text-green-600" /> : 
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount / 100).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400">Start earning to see your transaction history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Earning Sources */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-6">Earning Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800 mb-2">Referral Commissions</h4>
            <p className="text-2xl font-bold text-blue-600">₹{((mlmData?.referralEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-gray-600">From direct referrals</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800 mb-2">Level Commissions</h4>
            <p className="text-2xl font-bold text-green-600">₹{((mlmData?.levelEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-gray-600">From team levels</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
            <Award className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800 mb-2">Bonus Rewards</h4>
            <p className="text-2xl font-bold text-yellow-600">₹{((mlmData?.bonusEarnings || 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-gray-600">Achievement bonuses</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTeamTab = () => (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Team 👥</h2>
            <p className="text-purple-100 mb-4">Build and manage your MLM network</p>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-3xl font-bold">{mlmData?.totalReferrals || 0}</div>
                <p className="text-purple-200 text-sm">Total Members</p>
              </div>
              <div>
                <div className="text-3xl font-bold">{mlmData?.activeReferrals || 0}</div>
                <p className="text-purple-200 text-sm">Active Members</p>
              </div>
              <div>
                <div className="text-3xl font-bold">Level {mlmData?.level || 1}</div>
                <p className="text-purple-200 text-sm">Your Level</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Team Network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="p-3 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{mlmData?.totalReferrals || 0}</div>
          <p className="text-gray-600 text-sm font-medium">Total Referrals</p>
          <p className="text-xs text-blue-600 mt-1">All time referrals</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="p-3 bg-green-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{mlmData?.activeReferrals || 0}</div>
          <p className="text-gray-600 text-sm font-medium">Active Members</p>
          <p className="text-xs text-green-600 mt-1">Currently active</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="p-3 bg-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{mlmData?.level || 1}</div>
          <p className="text-gray-600 text-sm font-medium">Current Level</p>
          <p className="text-xs text-purple-600 mt-1">MLM hierarchy level</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center">
          <div className="p-3 bg-yellow-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">₹{((mlmData?.teamVolume || 0) / 100).toFixed(0)}</div>
          <p className="text-gray-600 text-sm font-medium">Team Volume</p>
          <p className="text-xs text-yellow-600 mt-1">Total team sales</p>
        </div>
      </div>

      {/* Level-wise Team Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-6">Level-wise Team Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
            <div key={level} className="text-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {mlmData?.levelBreakdown?.[`level${level}`] || 0}
              </div>
              <p className="text-sm text-gray-600 font-medium">Level {level}</p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((mlmData?.levelBreakdown?.[`level${level}`] || 0) / 10) * 100)}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Recent Team Members</h3>
          <div className="flex space-x-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>All Levels</option>
              <option>Level 1</option>
              <option>Level 2</option>
              <option>Level 3</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Export List
            </button>
          </div>
        </div>

        {mlmData?.teamMembers?.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mlmData.teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {member.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{member.name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-600">
                      Level {member.level || 1} • {member.email || 'No email'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined: {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-semibold text-gray-800">₹{((member.volume || 0) / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Volume</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-500 mb-2">No team members yet</h4>
            <p className="text-gray-400 mb-6">Start referring people to build your team</p>
            <button
              onClick={() => setActiveTab('referral')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Share Referral Link
            </button>
          </div>
        )}
      </div>

      {/* Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month&apos;s Sales</span>
              <span className="font-bold text-gray-800">₹{((mlmData?.monthlyTeamSales || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Team Earnings</span>
              <span className="font-bold text-gray-800">₹{((mlmData?.totalTeamEarnings || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Your Commission</span>
              <span className="font-bold text-green-600">₹{((mlmData?.teamCommission || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Members This Month</span>
              <span className="font-bold text-blue-600">{mlmData?.monthlyNewMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Rate</span>
              <span className="font-bold text-green-600">
                {mlmData?.totalReferrals ? Math.round((mlmData.activeReferrals / mlmData.totalReferrals) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg. Volume per Member</span>
              <span className="font-bold text-purple-600">
                ₹{mlmData?.totalReferrals ? ((mlmData.teamVolume || 0) / mlmData.totalReferrals / 100).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReferralTab = () => (
    <div className="space-y-6">
      {/* Referral Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Referral Program 🚀</h2>
            <p className="text-purple-100 mb-4">Invite friends and earn amazing rewards together!</p>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-3xl font-bold">{mlmData?.totalReferrals || 0}</div>
                <p className="text-purple-200 text-sm">Total Invites</p>
              </div>
              <div>
                <div className="text-3xl font-bold">₹{((mlmData?.referralEarnings || 0) / 100).toFixed(0)}</div>
                <p className="text-purple-200 text-sm">Earned</p>
              </div>
              <div>
                <div className="text-3xl font-bold">{mlmData?.activeReferrals || 0}</div>
                <p className="text-purple-200 text-sm">Active</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Share2 className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Share & Earn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Code */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-purple-600" />
            Your Referral Code
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your unique code</p>
                  <code className="text-3xl font-bold text-purple-600 font-mono">
                    {mlmData?.referralCode || 'LOADING...'}
                  </code>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title="Copy referral code"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Share this code with friends during their registration to earn rewards!
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-blue-600" />
            Direct Referral Link
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={mlmData?.referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login-register?ref=${mlmData.referralCode}` : 'Loading...'}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700 font-medium"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Share2 size={16} />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Send this link directly to friends for easy registration with your referral.
            </p>
          </div>
        </div>
      </div>

      {/* MLM Status Check */}
      {!mlmData?.isActive ? (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
          <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">MLM Not Activated</h3>
          <p className="text-gray-600 mb-6">
            Make your first purchase to activate your MLM account and start earning referral rewards.
          </p>
          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          {/* Commission Structure */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-6">Commission Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { level: 1, rate: '10%', color: 'bg-green-500' },
                  { level: 2, rate: '5%', color: 'bg-blue-500' },
                  { level: 3, rate: '3%', color: 'bg-purple-500' },
                  { level: 4, rate: '2%', color: 'bg-yellow-500' }
                ].map((item) => (
                  <div key={item.level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="font-medium">Level {item.level}</span>
                    </div>
                    <span className="font-bold text-lg">{item.rate}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[
                  { level: 5, rate: '1%', color: 'bg-pink-500' },
                  { level: 6, rate: '1%', color: 'bg-indigo-500' },
                  { level: 7, rate: '1%', color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="font-medium">Level {item.level}</span>
                    </div>
                    <span className="font-bold text-lg">{item.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referral Statistics */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-6">Your Referral Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">{mlmData?.totalReferrals || 0}</div>
                <p className="text-gray-600">Total Referrals</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-1">{mlmData?.activeReferrals || 0}</div>
                <p className="text-gray-600">Active Members</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-1">₹{((mlmData?.totalEarnings || 0) / 100).toFixed(2)}</div>
                <p className="text-gray-600">Total Earnings</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderKYCTab = () => (
    <div className="space-y-6">
      {/* KYC Header */}
      <div className={`p-8 rounded-2xl shadow-xl text-white ${
        kycData?.status === 'approved' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
        kycData?.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
        'bg-gradient-to-br from-orange-500 to-yellow-600'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">KYC Verification 🔐</h2>
            <p className="text-white opacity-90 mb-4">
              {kycData?.status === 'approved' ? 'Your identity has been verified successfully' :
               kycData?.status === 'rejected' ? 'Your KYC application was rejected' :
               kycData?.status === 'pending' ? 'Your KYC application is under review' :
               'Complete your KYC verification to unlock all features'}
            </p>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                kycData?.status === 'approved' ? 'bg-green-100 text-green-800' :
                kycData?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                kycData?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {kycData?.status === 'approved' ? '✓ Verified' :
                 kycData?.status === 'rejected' ? '✗ Rejected' :
                 kycData?.status === 'pending' ? '⏳ Under Review' :
                 '⚠ Not Submitted'}
              </span>
              {kycData?.submittedAt && (
                <span className="text-sm opacity-75">
                  Submitted: {new Date(kycData.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              {kycData?.status === 'approved' ? 
                <CheckCircle className="w-12 h-12 mx-auto mb-2" /> :
                kycData?.status === 'rejected' ? 
                <XCircle className="w-12 h-12 mx-auto mb-2" /> :
                <Shield className="w-12 h-12 mx-auto mb-2" />
              }
              <p className="text-sm">KYC Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Benefits */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Benefits of KYC Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-800">Withdraw Funds</p>
              <p className="text-sm text-gray-600">Transfer earnings to bank</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-800">Enhanced Security</p>
              <p className="text-sm text-gray-600">Protect your account</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
            <Award className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-800">Higher Limits</p>
              <p className="text-sm text-gray-600">Increased transaction limits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Notice */}
      {kycData?.status === 'rejected' && kycData?.reviewNote && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">KYC Application Rejected</h4>
              <p className="text-red-700 mb-4">{kycData.reviewNote}</p>
              <p className="text-sm text-red-600">Please correct the issues and resubmit your application.</p>
            </div>
          </div>
        </div>
      )}

      {/* KYC Form */}
      {(!kycData || kycData.status === 'rejected') && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-6">
            {kycData?.status === 'rejected' ? 'Resubmit KYC Information' : 'Submit KYC Information'}
          </h3>
          
          <form onSubmit={handleKycSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm({...kycForm, fullName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={kycForm.dateOfBirth}
                    onChange={(e) => setKycForm({...kycForm, dateOfBirth: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    required
                    value={kycForm.gender}
                    onChange={(e) => setKycForm({...kycForm, gender: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.fatherName}
                    onChange={(e) => setKycForm({...kycForm, fatherName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter father's name"
                  />
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Identity Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.aadharNumber}
                    onChange={(e) => setKycForm({...kycForm, aadharNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 12-digit Aadhar number"
                    pattern="[0-9]{12}"
                    maxLength="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.panNumber}
                    onChange={(e) => setKycForm({...kycForm, panNumber: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PAN number"
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    maxLength="10"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Bank Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.bankAccountNumber}
                    onChange={(e) => setKycForm({...kycForm, bankAccountNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.ifscCode}
                    onChange={(e) => setKycForm({...kycForm, ifscCode: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter IFSC code"
                    pattern="[A-Z]{4}[0-9]{7}"
                    maxLength="11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.bankName}
                    onChange={(e) => setKycForm({...kycForm, bankName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.branchName}
                    onChange={(e) => setKycForm({...kycForm, branchName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
            </div>

            {/* Nominee Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Nominee Details (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominee Name
                  </label>
                  <input
                    type="text"
                    value={kycForm.nomineeName}
                    onChange={(e) => setKycForm({...kycForm, nomineeName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter nominee name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship with Nominee
                  </label>
                  <select
                    value={kycForm.nomineeRelation}
                    onChange={(e) => setKycForm({...kycForm, nomineeRelation: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {kycData?.status === 'rejected' ? 'Resubmit KYC Information' : 'Submit KYC Information'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                By submitting, you agree that all information provided is accurate and complete.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* KYC Status for Submitted/Approved */}
      {kycData && kycData.status !== 'rejected' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-6">Your KYC Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Personal Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{kycData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium">
                    {new Date(kycData.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium capitalize">{kycData.gender}</span>
                </div>
                {kycData.fatherName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Father&apos;s Name:</span>
                    <span className="font-medium">{kycData.fatherName}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Documents</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aadhar:</span>
                  <span className="font-medium">••••••••{kycData.aadharNumber?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PAN:</span>
                  <span className="font-medium">{kycData.panNumber}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Bank Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">••••••••{kycData.bankAccountNumber?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IFSC:</span>
                  <span className="font-medium">{kycData.ifscCode}</span>
                </div>
                {kycData.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">{kycData.bankName}</span>
                  </div>
                )}
              </div>
            </div>

            {(kycData.nomineeName || kycData.nomineeRelation) && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Nominee Details</h4>
                <div className="space-y-2 text-sm">
                  {kycData.nomineeName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{kycData.nomineeName}</span>
                    </div>
                  )}
                  {kycData.nomineeRelation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Relationship:</span>
                      <span className="font-medium capitalize">{kycData.nomineeRelation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {kycData.status === 'pending' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 font-medium">Under Review</p>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Your KYC application is being reviewed. This usually takes 1-2 business days.
              </p>
            </div>
          )}

          {kycData.status === 'approved' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Verification Complete</p>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your identity has been verified. You can now withdraw funds and access all features.
              </p>
              {kycData.reviewedAt && (
                <p className="text-green-600 text-xs mt-1">
                  Approved on {new Date(kycData.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={userData?.name || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={userData?.email || ''}
                  className="w-full border rounded px-3 py-2"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue={userData?.phone || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  defaultValue={userData?.address || ''}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    defaultValue={userData?.city || ''}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    defaultValue={userData?.postalCode || ''}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Security</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Change Password
              </button>
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Enable Two-Factor Authentication
              </button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-4">
              Save Changes
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'referral', label: 'Referral', icon: Share2 },
    { id: 'kyc', label: 'KYC', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow border p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access your account dashboard.</p>
          <a 
            href="/login-register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {userData?.fullName || session?.user?.name || 'User'}! 👋
                </h1>
                <p className="text-indigo-100 text-lg mb-4">
                  {userData?.isActive ? 'Your MLM account is active' : 'Complete your first purchase to activate MLM benefits'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    userData?.isActive ? 'bg-green-500 bg-opacity-80 text-white' : 'bg-yellow-500 bg-opacity-80 text-white'
                  }`}>
                    {userData?.isActive ? '✓ MLM Active' : '⏳ MLM Inactive'}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    userData?.isKycApproved ? 'bg-green-500 bg-opacity-80 text-white' : 'bg-red-500 bg-opacity-80 text-white'
                  }`}>
                    {userData?.isKycApproved ? '✓ KYC Verified' : '⚠ KYC Pending'}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-right">
                  <div className="text-sm text-indigo-200 mb-1">Member Since</div>
                  <div className="text-lg font-semibold">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <IconComponent size={20} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'orders' && renderOrdersTab()}
          {activeTab === 'wallet' && renderWalletTab()}
          {activeTab === 'team' && renderTeamTab()}
          {activeTab === 'referral' && renderReferralTab()}
          {activeTab === 'kyc' && renderKYCTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </div>
  )
}

export default AccountDashboard
