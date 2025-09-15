'use client'

import { useState, useEffect } from 'react'
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const WalletBalance = () => {
  const [walletData, setWalletData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBalance, setShowBalance] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview, transactions, payouts

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/account/wallet')
      const data = await response.json()
      
      if (response.ok) {
        setWalletData(data)
      } else {
        setError(data.message || 'Failed to load wallet data')
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (parseFloat(withdrawAmount) < 500) {
      alert('Minimum withdrawal amount is ₹300')
      return
    }

    if (parseFloat(withdrawAmount) > (walletData?.balance?.rupees || 0)) {
      alert('Insufficient balance')
      return
    }

    setWithdrawLoading(true)
    try {
      const response = await fetch('/api/account/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Withdrawal request submitted successfully!')
        setWithdrawAmount('')
        fetchWalletData() // Refresh wallet data
      } else {
        alert(result.message || 'Withdrawal failed')
      }
    } catch (error) {
      alert('Network error occurred')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const formatAmount = (amount) => {
    if (typeof amount === 'object' && amount !== null) {
      return amount.rupees?.toFixed(2) || '0.00'
    }
    return (amount / 100).toFixed(2) || '0.00'
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'sponsor_commission':
      case 'repurchase_commission':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'withdrawal_debit':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      case 'self_payout':
        return <DollarSign className="w-4 h-4 text-blue-600" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'sponsor_commission':
      case 'repurchase_commission':
      case 'self_payout':
        return 'text-green-600'
      case 'withdrawal_debit':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
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
              <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Wallet</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchWalletData}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const balance = walletData?.balance || {}
  const earnings = walletData?.earnings || {}
  const transactions = walletData?.transactions?.data || []
  const pendingPayouts = walletData?.pendingPayouts?.list || []

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">My Wallet</h2>
            <p className="text-green-100 mb-4">Track your earnings and manage withdrawals</p>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold">
                {showBalance ? `₹${formatAmount(balance)}` : '₹ ****'}
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300"
              >
                {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-green-100">Available for withdrawal</p>
          </div>
          <div className="text-right">
            <div className="p-4 bg-white bg-opacity-20 rounded-lg">
              <Wallet className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm font-medium">Digital Wallet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{formatAmount(earnings.total)}</div>
              <div className="text-sm text-gray-500">Total Earnings</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">₹{formatAmount(earnings.monthly)}</div>
              <div className="text-sm text-gray-500">This Month</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{pendingPayouts.length}</div>
              <div className="text-sm text-gray-500">Pending Payouts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Section */}
      {(balance.rupees || 0) >= 500 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Enter amount (Min ₹300)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="500"
                max={balance.rupees || 0}
              />
              <p className="text-sm text-gray-500 mt-1">
                Available balance: ₹{formatAmount(balance)}
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 500}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {withdrawLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {withdrawLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Wallet },
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'payouts', label: 'Pending Payouts', icon: Clock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'payouts' && pendingPayouts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                    {pendingPayouts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                  <div className="text-2xl font-bold text-gray-900">₹{formatAmount(balance)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Withdrawn</div>
                  <div className="text-2xl font-bold text-gray-900">₹{formatAmount(earnings.withdrawn)}</div>
                </div>
              </div>
              {(balance.rupees || 0) < 500 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      Minimum withdrawal amount is ₹300. Current balance: ₹{formatAmount(balance)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.description || transaction.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                          {transaction.levelDepth && (
                            <div className="text-xs text-blue-600">Level {transaction.levelDepth}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type.includes('debit') ? '-' : '+'}₹{formatAmount(transaction.amount)}
                        </div>
                        {transaction.balanceAfter && (
                          <div className="text-xs text-gray-500">
                            Balance: ₹{formatAmount(transaction.balanceAfter)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Self-Payouts</h3>
              {pendingPayouts.length > 0 ? (
                <div className="space-y-3">
                  {pendingPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Self Payout - Week {payout.week || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Due: {new Date(payout.dueAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-blue-600">
                            From Order #{payout.orderId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          ₹{formatAmount(payout.amount)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          payout.status === 'scheduled' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : payout.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payout.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending payouts</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletBalance
