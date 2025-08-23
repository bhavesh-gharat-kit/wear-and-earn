"use client";

import { useState, useEffect } from 'react';

export default function MLMStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMLMStats();
  }, []);

  const fetchMLMStats = async () => {
    try {
      const response = await fetch('/api/admin/mlm-stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch MLM stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-xl">Failed to load MLM statistics</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">MLM System Statistics</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800">Total Users</h3>
          <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800">Active Users</h3>
          <p className="text-3xl font-bold text-green-900">{stats.activeUsers}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800">Total Commission Paid</h3>
          <p className="text-3xl font-bold text-purple-900">₹{stats.totalCommissionPaid}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-800">Company Revenue</h3>
          <p className="text-3xl font-bold text-orange-900">₹{stats.companyRevenue}</p>
        </div>
      </div>

      {/* Level-wise Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Level-wise User Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {stats.levelDistribution.map((level, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-blue-600">{level.count}</p>
              <p className="text-sm text-gray-600">Level {level.level}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Commission Types</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Sponsor Commission:</span>
              <span className="font-semibold">₹{stats.sponsorCommission}</span>
            </div>
            <div className="flex justify-between">
              <span>Repurchase Commission:</span>
              <span className="font-semibold">₹{stats.repurchaseCommission}</span>
            </div>
            <div className="flex justify-between">
              <span>Self Commission:</span>
              <span className="font-semibold">₹{stats.selfCommission}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Pending Payouts:</span>
              <span className="font-semibold">{stats.pendingPayouts}</span>
            </div>
            <div className="flex justify-between">
              <span>KYC Approved:</span>
              <span className="font-semibold">{stats.kycApproved}</span>
            </div>
            <div className="flex justify-between">
              <span>Eligible for Repurchase:</span>
              <span className="font-semibold">{stats.eligibleRepurchase}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent MLM Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-left py-2">Level</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map((transaction, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">{transaction.user?.fullName || 'Company'}</td>
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
                  <td className="py-2 text-right font-semibold">₹{transaction.amount}</td>
                  <td className="py-2">{transaction.levelDepth || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
