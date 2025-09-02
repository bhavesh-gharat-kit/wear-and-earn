'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  Eye,
  ArrowLeft,
  Calendar,
  CreditCard
} from 'lucide-react'

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (session?.user?.id) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/account/orders')
      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'inProcess':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inProcess': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered'
      case 'pending': return 'Pending'
      case 'inProcess': return 'In Process'
      default: return status
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Please Login</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to view your orders.</p>
          <Link 
            href="/login-register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Link 
            href="/account"
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        </div>
        
        {/* Filter Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-600">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'inProcess', label: 'In Process' },
              { key: 'delivered', label: 'Delivered' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                    {orders.filter(order => order.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        Order #{order.id}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{(order.totalInRupees || order.total / 100).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.itemCount} items</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Ordered: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}</span>
                  </div>
                  {order.deliveredAt && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Delivered: {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                  )}
                  {order.paymentId && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Payment ID: {order.paymentId}</span>
                    </div>
                  )}
                </div>

                {/* Products Preview */}
                {order.products && order.products.length > 0 && (
                  <div className="border-t dark:border-gray-600 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{product.title}</span>
                          <div className="text-right">
                            <span className="text-gray-900 dark:text-white font-medium">Qty: {product.quantity}</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-300">₹{(product.totalPriceInRupees || product.totalPrice / 100).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {order.itemCount > order.products.length && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          +{order.itemCount - order.products.length} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Actions */}
                <div className="mt-6 flex justify-between items-center pt-4 border-t dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {order.orderNotice && (
                      <span>Note: {order.orderNotice}</span>
                    )}
                  </div>
                  <Link 
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Start shopping to see your orders here!' 
                : `You don&apos;t have any ${filter} orders.`
              }
            </p>
            {filter === 'all' && (
              <Link 
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}