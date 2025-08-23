"use client";

import { useState, useEffect } from 'react';

export default function MLMTreeViewer() {
  const [users, setUsers] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMLMData();
  }, []);

  const fetchMLMData = async () => {
    try {
      const [usersRes, matrixRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/matrix-view')
      ]);
      
      const usersData = await usersRes.json();
      const matrixDataRes = await matrixRes.json();
      
      if (usersData.success) setUsers(usersData.users);
      if (matrixDataRes.success) setMatrixData(matrixDataRes.matrix);
    } catch (err) {
      console.error('Failed to fetch MLM data:', err);
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">MLM Tree Viewer</h1>
      
      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Referral Code</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Wallet Balance</th>
                <th className="text-left py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2">{user.id}</td>
                  <td className="py-2">{user.fullName}</td>
                  <td className="py-2 font-mono text-sm">{user.referralCode}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2">₹{(user.walletBalance / 100).toFixed(2)}</td>
                  <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matrix Structure */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Matrix Structure</h2>
        <div className="space-y-4">
          {matrixData.map((node) => (
            <div key={node.userId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">
                Level {node.level} - Position {node.position}
              </div>
              <div className="font-semibold">{node.user?.fullName}</div>
              <div className="text-sm text-gray-500">({node.user?.referralCode})</div>
              {node.parent && (
                <div className="text-sm text-blue-600">
                  ↳ Parent: {node.parent.user?.fullName}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
