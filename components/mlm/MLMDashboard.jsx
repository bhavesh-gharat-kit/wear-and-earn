import React from 'react';

const MLMDashboard = ({ dashboardData }) => {
  if (!dashboardData) {
    return <div className="p-6">Loading...</div>;
  }

  const { user, matrixInfo, teamStats, earnings, recentTransactions, referralLink } = dashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">MLM Dashboard</h1>
      
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="font-semibold">{user.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Referral Code</p>
            <p className="font-semibold">{user.referralCode}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <span className={`px-2 py-1 rounded text-sm ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800">Wallet Balance</h3>
          <p className="text-2xl font-bold text-blue-900">₹{earnings.walletBalance.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800">Sponsor Commission</h3>
          <p className="text-2xl font-bold text-green-900">₹{earnings.totalSponsorCommission.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800">Repurchase Commission</h3>
          <p className="text-2xl font-bold text-purple-900">₹{earnings.totalRepurchaseCommission.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-800">Pending Payouts</h3>
          <p className="text-2xl font-bold text-orange-900">₹{earnings.totalPendingAmount.toFixed(2)}</p>
          <p className="text-sm text-orange-600">{earnings.pendingPayouts} pending</p>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Team Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{teamStats.directReferrals}</p>
            <p className="text-gray-600">Direct Referrals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{teamStats.level1Count}</p>
            <p className="text-gray-600">Level 1</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{teamStats.level2Count}</p>
            <p className="text-gray-600">Level 2</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{teamStats.level3Count}</p>
            <p className="text-gray-600">Level 3</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{teamStats.totalTeamSize}</p>
            <p className="text-gray-600">Total Team</p>
          </div>
        </div>
      </div>

      {/* Matrix Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Matrix Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Matrix Position</p>
            <p className="font-semibold">{matrixInfo.position || 'Root'}</p>
          </div>
          <div>
            <p className="text-gray-600">Parent</p>
            <p className="font-semibold">{matrixInfo.parentName}</p>
            {matrixInfo.parentReferralCode && (
              <p className="text-sm text-gray-500">({matrixInfo.parentReferralCode})</p>
            )}
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button 
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-left py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      transaction.type === 'sponsor_commission' ? 'bg-green-100 text-green-800' :
                      transaction.type === 'repurchase_commission' ? 'bg-purple-100 text-purple-800' :
                      transaction.type === 'self_commission' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold">₹{transaction.amount.toFixed(2)}</td>
                  <td className="py-2 text-sm text-gray-600">{transaction.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentTransactions.length === 0 && (
            <p className="text-center py-4 text-gray-500">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLMDashboard;
