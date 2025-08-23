"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function AdminOrdersDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Test basic database connection
    testDatabaseConnection();
    
    // Test admin orders API
    if (session?.user?.id) {
      testAdminOrdersAPI();
    }
  }, [session]);

  const testDatabaseConnection = async () => {
    try {
      const response = await axios.get('/api/test/orders');
      setTestResult({
        database: 'Connected',
        orderCount: response.data.totalCount,
        message: response.data.message
      });
    } catch (error) {
      setTestResult({
        database: 'Error',
        error: error.message,
        response: error.response?.data
      });
    }
  };

  const testAdminOrdersAPI = async () => {
    try {
      const response = await axios.get('/api/admin/orders?limit=5');
      setDebugInfo({
        api: 'Working',
        ordersFound: response.data.totalCount,
        data: response.data
      });
    } catch (error) {
      setDebugInfo({
        api: 'Error',
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Orders Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Session Info</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify({
              userId: session?.user?.id,
              email: session?.user?.email,
              role: session?.user?.role,
              isLoggedIn: !!session
            }, null, 2)}
          </pre>
        </div>

        {/* Database Test */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Database Test</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>

        {/* Admin API Test */}
        <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Admin Orders API Test</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => {
            testDatabaseConnection();
            if (session?.user?.id) testAdminOrdersAPI();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Tests
        </button>
      </div>
    </div>
  );
}
