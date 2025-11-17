'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  User, 
  Package, 
  Settings, 
  ShoppingCart, 
  MapPin, 
  Bell,
  Eye,
  TrendingUp,
  Heart,
  CreditCard,
  Share2,
  Copy,
  Users,
  Wallet,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  UserCheck,
  FileText,
  RefreshCw,
  TrendingDown
} from 'lucide-react'

export default function AccountDashboard() {
  const { data: session, status } = useSession()
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    cartItems: 0,
    totalSpent: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [mlmData, setMlmData] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [kycData, setKycData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Fetch all user data in parallel
      const [statsRes, ordersRes, profileRes, mlmRes, teamRes, kycRes] = await Promise.all([
        fetch(`/api/account/stats`),
        fetch(`/api/account/recent-orders`),
        fetch(`/api/account/profile`),
        fetch(`/api/account/mlm-profile`),
        fetch(`/api/account/team?limit=5`),
        fetch(`/api/account/kyc`)
      ])

      if (statsRes.ok) {
        const stats = await statsRes.json()
        setUserStats(stats)
      }

      if (ordersRes.ok) {
        const orders = await ordersRes.json()
        setRecentOrders(orders)
      }

      if (profileRes.ok) {
        const profile = await profileRes.json()
        setUserProfile(profile)
      }

      if (mlmRes.ok) {
        const mlm = await mlmRes.json()
        setMlmData(mlm)
      }

      if (teamRes.ok) {
        const team = await teamRes.json()
        setTeamData(team)
      }

      if (kycRes.ok) {
        const kyc = await kycRes.json()
        setKycData(kyc)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (mlmData?.user?.referralLink) {
      try {
        await navigator.clipboard.writeText(mlmData.user.referralLink)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const shareReferralLink = async () => {
    if (mlmData?.user?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Wear & Earn',
          text: 'Join me on Wear & Earn and start earning!',
          url: mlmData.user.referralLink
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }
  // Note: This file is deprecated and kept for reference. The active account page is page.js.

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your account dashboard.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const quickActions = [
    { 
      name: 'View Orders', 
      href: '/account/orders', 
      icon: Package, 
      color: 'bg-blue-500',
      description: 'Track your orders'
    },
    { 
      name: 'My Cart', 
      href: '/cart', 
      icon: ShoppingCart, 
      color: 'bg-green-500',
      description: `${userStats.cartItems} items`
    },
    { 
      name: 'Account Settings', 
      href: '/account/settings', 
      icon: Settings, 
      color: 'bg-purple-500',
      description: 'Update profile'
    },
    { 
      name: 'Addresses', 
      href: '/account/settings', 
      icon: MapPin, 
      color: 'bg-orange-500',
      description: 'Manage addresses'
    }
  ]

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inProcess': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session.user?.fullName || userProfile?.fullName || session.user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here&apos;s what&apos;s happening with your account
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-500">Member since</span>
              <p className="font-semibold text-gray-900">
                {session.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {userStats.totalOrders}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Orders
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {userStats.pendingOrders}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cart Items
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {userStats.cartItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-xl">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Spent
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ₹{userStats.totalSpent.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className={`${action.color} p-2 rounded-lg mr-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.name}
                    </h4>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link 
                href="/account/orders"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                View all
                <Eye className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Order #{order.id}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>₹{order.total.toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
                <Link 
                  href="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <User className="h-8 w-8 text-gray-400 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">
                {userProfile?.fullName || session.user?.fullName || session.user?.name || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Bell className="h-8 w-8 text-gray-400 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">
                {userProfile?.email || session.user?.email || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Heart className="h-8 w-8 text-gray-400 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Mobile</p>
              <p className="font-medium text-gray-900">
                {userProfile?.mobileNo || session.user?.mobileNo || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional Profile Info */}
        {userProfile && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProfile.gender && (
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <User className="h-8 w-8 text-blue-400 mr-4" />
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">{userProfile.gender}</p>
                </div>
              </div>
            )}
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Bell className="h-8 w-8 text-green-400 mr-4" />
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="font-medium text-gray-900">
                  {userProfile.isVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
            {userProfile.address && (
              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <MapPin className="h-8 w-8 text-purple-400 mr-4" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {userProfile.address.villageOrCity}, {userProfile.address.district}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Link 
            href="/account/settings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
