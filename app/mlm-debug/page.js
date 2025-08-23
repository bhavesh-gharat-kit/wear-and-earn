'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function MLMDebugPage() {
  const { data: session } = useSession();
  const [mlmStatus, setMLMStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testOrderId, setTestOrderId] = useState('');

  const fetchMLMStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mlm-status');
      const data = await response.json();
      setMLMStatus(data);
    } catch (error) {
      console.error('Error fetching MLM status:', error);
    }
    setLoading(false);
  };

  const simulatePayment = async () => {
    if (!testOrderId || !session?.user?.id) {
      alert('Please enter an order ID and make sure you are logged in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          orderId: testOrderId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Payment simulation successful! Refreshing status...');
        await fetchMLMStatus();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error simulating payment:', error);
      alert('Error simulating payment');
    }
    setLoading(false);
  };

  const activateMLM = async () => {
    if (!session?.user?.id) {
      alert('Please make sure you are logged in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/activate-mlm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        await fetchMLMStatus();
      } else {
        alert('Error: ' + result.message || result.error);
      }
    } catch (error) {
      console.error('Error activating MLM:', error);
      alert('Error activating MLM');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchMLMStatus();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Please log in to view MLM status</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">MLM Debug Dashboard</h1>
        
        {/* User Info */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">User Session</h2>
          <p><strong>User ID:</strong> {session.user.id}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Name:</strong> {session.user.name}</p>
        </div>

        {/* Test Payment Simulation */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Payment Simulation</h2>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Enter Order ID"
              value={testOrderId}
              onChange={(e) => setTestOrderId(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={simulatePayment}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Simulate Payment
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This will mark the order as paid and trigger MLM activation if it&apos;s your first order.
          </p>
        </div>

        {/* Manual Activation */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Manual MLM Activation</h2>
          <button
            onClick={activateMLM}
            disabled={loading}
            className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Activate MLM (For Existing Orders)
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Use this if you have paid orders but MLM was not activated. This will process your first order for MLM activation.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchMLMStatus}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh MLM Status'}
          </button>
        </div>

        {/* MLM Status */}
        {mlmStatus && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">MLM Status Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded ${mlmStatus.data.status.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <h3 className="font-medium">Account Status</h3>
                  <p className={mlmStatus.data.status.isActive ? 'text-green-600' : 'text-red-600'}>
                    {mlmStatus.data.status.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className={`p-4 rounded ${mlmStatus.data.status.hasReferralCode ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <h3 className="font-medium">Referral Code</h3>
                  <p className={mlmStatus.data.status.hasReferralCode ? 'text-green-600' : 'text-yellow-600'}>
                    {mlmStatus.data.user.referralCode || 'Not Generated'}
                  </p>
                </div>
                <div className="p-4 rounded bg-blue-100">
                  <h3 className="font-medium">Paid Orders</h3>
                  <p className="text-blue-600">{mlmStatus.data.status.paidOrdersCount}</p>
                </div>
                <div className={`p-4 rounded ${mlmStatus.data.status.is33RuleEligible ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <h3 className="font-medium">3-3 Rule</h3>
                  <p className={mlmStatus.data.status.is33RuleEligible ? 'text-green-600' : 'text-gray-600'}>
                    {mlmStatus.data.status.is33RuleEligible ? 'Eligible' : 'Not Eligible'}
                  </p>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">User Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Full Name:</strong> {mlmStatus.data.user.fullName}</p>
                  <p><strong>Email:</strong> {mlmStatus.data.user.email}</p>
                  <p><strong>Sponsor ID:</strong> {mlmStatus.data.user.sponsorId || 'None'}</p>
                  <p><strong>KYC Approved:</strong> {mlmStatus.data.user.isKycApproved ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p><strong>Wallet Balance:</strong> ₹{(mlmStatus.data.user.walletBalance / 100).toFixed(2)}</p>
                  <p><strong>Monthly Purchase:</strong> ₹{(mlmStatus.data.user.monthlyPurchase / 100).toFixed(2)}</p>
                  <p><strong>Repurchase Eligible:</strong> {mlmStatus.data.user.isEligibleRepurchase ? 'Yes' : 'No'}</p>
                  <p><strong>Joined:</strong> {new Date(mlmStatus.data.user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Orders History</h2>
              {mlmStatus.data.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2">Order ID</th>
                        <th className="border border-gray-300 px-4 py-2">Total</th>
                        <th className="border border-gray-300 px-4 py-2">Status</th>
                        <th className="border border-gray-300 px-4 py-2">Joining Order</th>
                        <th className="border border-gray-300 px-4 py-2">Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mlmStatus.data.orders.map((order) => (
                        <tr key={order.id}>
                          <td className="border border-gray-300 px-4 py-2">{order.id}</td>
                          <td className="border border-gray-300 px-4 py-2">₹{order.total}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {order.isJoiningOrder ? 'Yes' : 'No'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {order.paidAt ? new Date(order.paidAt).toLocaleString() : 'Not Paid'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No orders found</p>
              )}
            </div>

            {/* Team Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Team Information</h2>
              <p><strong>Direct Referrals:</strong> {mlmStatus.data.team.directReferrals}</p>
              <p><strong>Qualified Directs (3+ sub-referrals):</strong> {mlmStatus.data.team.qualifiedDirects}</p>
              
              {mlmStatus.data.team.directsWithSubTeam.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Direct Referrals Details:</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2">Name</th>
                          <th className="border border-gray-300 px-4 py-2">Active</th>
                          <th className="border border-gray-300 px-4 py-2">Sub-team Count</th>
                          <th className="border border-gray-300 px-4 py-2">Qualified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mlmStatus.data.team.directsWithSubTeam.map((direct) => (
                          <tr key={direct.id}>
                            <td className="border border-gray-300 px-4 py-2">{direct.fullName}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              <span className={`px-2 py-1 rounded text-sm ${
                                direct.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {direct.isActive ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{direct.subTeamCount}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              <span className={`px-2 py-1 rounded text-sm ${
                                direct.subTeamCount >= 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {direct.subTeamCount >= 3 ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Analysis</h2>
              <div className="space-y-2">
                {Object.entries(mlmStatus.data.analysis).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value.toString()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
