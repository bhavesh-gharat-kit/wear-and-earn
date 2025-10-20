'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import moment from 'moment'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  EyeOff,
  Building,
  Calendar,
  Shield,
  DollarSign,
  Users,
  Award,
  TrendingUp
} from 'lucide-react'
import LoaderEffect from '@/components/ui/LoaderEffect'

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal')
  const [showWalletDetails, setShowWalletDetails] = useState(false)

  const userId = params.userId

  useEffect(() => {
    if (!session?.user?.role || session.user.role !== 'admin') {
      router.push('/admin/login')
      return
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/admin/users/${userId}`)
        
        if (response.data.success) {
          setUserDetails(response.data.data)
        } else {
          console.error('Failed to fetch user details:', response.data.message)
        }
      } catch (error) {
        console.error('Error fetching user details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId, session, router])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'REJECTED':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      case 'PENDING':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoaderEffect />
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userDetails.fullName || 'User Details'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">{userDetails.email}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userDetails.isActive 
                        ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' 
                        : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {userDetails.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userDetails.kycStatus)}`}>
                      KYC: {userDetails.kycStatus || 'Not Submitted'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {moment(userDetails.createdAt).format('DD MMM YYYY')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'personal', name: 'Personal Details', icon: User },
              { id: 'kyc', name: 'KYC Information', icon: Shield },
              { id: 'address', name: 'Address', icon: MapPin },
              { id: 'wallet', name: 'Wallet & Earnings', icon: Wallet },
              { id: 'orders', name: 'Order History', icon: CreditCard },
              { id: 'mlm', name: 'MLM Details', icon: Users },
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
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Personal Details Tab */}
          {activeTab === 'personal' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                  <p className="text-gray-900 dark:text-white mt-1">{userDetails.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {userDetails.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobile Number</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {userDetails.mobileNo || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                  <p className="text-gray-900 dark:text-white mt-1">{userDetails.gender || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Referral Code</label>
                  <p className="text-gray-900 dark:text-white mt-1 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {userDetails.referralCode || 'Not generated'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</label>
                  <p className={`mt-1 font-medium flex items-center ${
                    userDetails.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {userDetails.isActive ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                    {userDetails.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Registration Date</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {moment(userDetails.createdAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {moment(userDetails.updatedAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KYC Information Tab */}
          {activeTab === 'kyc' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                KYC Information
              </h3>
              {userDetails.kycData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">KYC Status</label>
                    <p className={`mt-1 font-medium flex items-center ${getStatusColor(userDetails.kycStatus).replace('bg-', '').replace('dark:bg-', '')}`}>
                      {userDetails.kycStatus === 'APPROVED' && <CheckCircle className="w-4 h-4 mr-1" />}
                      {userDetails.kycStatus === 'REJECTED' && <XCircle className="w-4 h-4 mr-1" />}
                      {userDetails.kycStatus === 'PENDING' && <Clock className="w-4 h-4 mr-1" />}
                      {userDetails.kycStatus || 'Not Submitted'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Father&apos;s Name</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.kycData.fatherName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {userDetails.kycData.dateOfBirth 
                        ? moment(userDetails.kycData.dateOfBirth).format('DD/MM/YYYY')
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Aadhar Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">
                      {userDetails.kycData.aadharNumber || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PAN Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">
                      {userDetails.kycData.panNumber || 'Not provided'}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      Banking Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</label>
                        <p className="text-gray-900 dark:text-white mt-1">{userDetails.kycData.bankName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Number</label>
                        <p className="text-gray-900 dark:text-white mt-1 font-mono">
                          {userDetails.kycData.bankAccountNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IFSC Code</label>
                        <p className="text-gray-900 dark:text-white mt-1 font-mono">
                          {userDetails.kycData.ifscCode || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Branch Name</label>
                        <p className="text-gray-900 dark:text-white mt-1">{userDetails.kycData.branchName || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No KYC information submitted yet</p>
                </div>
              )}
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Address Information
              </h3>
              {userDetails.address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">House Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {userDetails.address.houseNumber || userDetails.address.houseNo || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Area</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.address.area || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Landmark</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.address.landmark || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Village/City</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.address.villageOrCity || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Taluka</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.address.taluka || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">District</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.address.district || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">State</label>
                    <p className="text-gray-900 dark:text-white mt-1">{userDetails.address.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">PIN Code</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">{userDetails.address.pinCode || 'Not provided'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No delivery address provided yet</p>
                </div>
              )}
            </div>
          )}

          {/* Wallet & Earnings Tab */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* Wallet Balance */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Wallet className="w-5 h-5 mr-2" />
                    Wallet Balance
                  </h3>
                  <button
                    onClick={() => setShowWalletDetails(!showWalletDetails)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                  >
                    {showWalletDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showWalletDetails ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Balance</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {showWalletDetails ? formatCurrency(userDetails.walletBalance || 0) : '****'}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">MLM Earnings</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {showWalletDetails ? formatCurrency(userDetails.mlmEarnings || 0) : '****'}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Pool Earnings</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {showWalletDetails ? formatCurrency(userDetails.poolEarnings || 0) : '****'}
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Withdrawn</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {showWalletDetails ? formatCurrency(userDetails.totalWithdrawn || 0) : '****'}
                        </p>
                      </div>
                      <CreditCard className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Order History
              </h3>
              {userDetails.orders && userDetails.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Items</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {userDetails.orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {moment(order.createdAt).format('DD/MM/YYYY')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {order.items?.length || 0} items
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No orders found</p>
                </div>
              )}
            </div>
          )}

          {/* MLM Details Tab */}
          {activeTab === 'mlm' && (
            <div className="space-y-6">
              {/* MLM Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  MLM Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Current Level</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          Level {userDetails.mlmLevel || 1}
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Direct Referrals</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {userDetails.directReferrals || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Team Size</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {userDetails.teamSize || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Referral Code</p>
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300 font-mono">
                          {userDetails.referralCode || 'N/A'}
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}