'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const UserDiagnosePage = () => {
  const { data: session, status } = useSession();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDiagnosis();
    }
  }, [status]);

  const fetchDiagnosis = async () => {
    try {
      const response = await fetch('/api/diagnose-user');
      const data = await response.json();
      setDiagnosis(data);
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualActivation = async () => {
    try {
      const response = await fetch('/api/activate-mlm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      alert(JSON.stringify(result, null, 2));
      // Refresh diagnosis
      fetchDiagnosis();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="p-8">Please login to view diagnosis.</div>;
  }

  if (!diagnosis) {
    return <div className="p-8">Error loading diagnosis.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">User Account Diagnosis</h1>
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Name:</strong> {diagnosis.user.fullName}</div>
          <div><strong>Email:</strong> {diagnosis.user.email}</div>
          <div><strong>Mobile:</strong> {diagnosis.user.mobileNo}</div>
          <div><strong>User ID:</strong> {diagnosis.user.id}</div>
          <div><strong>Referral Code:</strong> {diagnosis.user.referralCode || 'Not Generated'}</div>
          <div><strong>Is Active:</strong> {diagnosis.user.isActive ? 'Yes' : 'No'}</div>
          <div><strong>Wallet Balance:</strong> ₹{diagnosis.user.walletBalance || 0}</div>
          <div><strong>Monthly Purchase:</strong> ₹{diagnosis.user.monthlyPurchase || 0}</div>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Analysis</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><strong>Has Referral Code:</strong> {diagnosis.analysis.hasReferralCode ? 'Yes' : 'No'}</div>
          <div><strong>Is Active:</strong> {diagnosis.analysis.isActive ? 'Yes' : 'No'}</div>
          <div><strong>Paid Orders Count:</strong> {diagnosis.analysis.paidOrdersCount}</div>
          <div><strong>Should Have Referral Code:</strong> {diagnosis.analysis.shouldHaveReferralCode ? 'Yes' : 'No'}</div>
          <div><strong>Referral Code Status:</strong> {diagnosis.analysis.referralCodeStatus}</div>
          <div><strong>Activation Status:</strong> {diagnosis.analysis.activationStatus}</div>
          <div className="col-span-2">
            <strong>Expected Referral Link:</strong> 
            <br />
            {diagnosis.analysis.expectedReferralLink || 'Not available'}
          </div>
          <div><strong>Needs Activation:</strong> {diagnosis.analysis.needsActivation ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-green-50 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        <div className="mb-4">
          <strong>Action:</strong> {diagnosis.recommendations.action}
        </div>
        <div className="mb-4">
          <strong>Reason:</strong> {diagnosis.recommendations.reason}
        </div>
        
        {diagnosis.analysis.needsActivation && (
          <button
            onClick={handleManualActivation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Activate MLM Manually
          </button>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {diagnosis.orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Order ID</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Paid At</th>
                  <th className="px-4 py-2 text-left">Joining Order</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {diagnosis.orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-2">{order.id}</td>
                    <td className="px-4 py-2">₹{order.total}</td>
                    <td className="px-4 py-2">{order.status}</td>
                    <td className="px-4 py-2">
                      {order.paidAt ? new Date(order.paidAt).toLocaleString() : 'Not Paid'}
                    </td>
                    <td className="px-4 py-2">{order.isJoiningOrder ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDiagnosePage;
