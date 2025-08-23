'use client'
import { useState } from 'react'

export default function MLMTestPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testMLMProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/mlm-profile')
      const data = await response.json()
      setResult({ type: 'MLM Profile', data })
    } catch (error) {
      setResult({ type: 'MLM Profile', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testTeamData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/team')
      const data = await response.json()
      setResult({ type: 'Team Data', data })
    } catch (error) {
      setResult({ type: 'Team Data', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testWalletData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/wallet')
      const data = await response.json()
      setResult({ type: 'Wallet Data', data })
    } catch (error) {
      setResult({ type: 'Wallet Data', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testAdminMLM = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/mlm-overview')
      const data = await response.json()
      setResult({ type: 'Admin MLM Overview', data })
    } catch (error) {
      setResult({ type: 'Admin MLM Overview', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            MLM System Test
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Test all MLM API endpoints
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={testMLMProfile}
            disabled={loading}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test MLM Profile API
          </button>
          
          <button
            onClick={testTeamData}
            disabled={loading}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Test Team API
          </button>
          
          <button
            onClick={testWalletData}
            disabled={loading}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Test Wallet API
          </button>
          
          <button
            onClick={testAdminMLM}
            disabled={loading}
            className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Test Admin MLM API
          </button>
        </div>

        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{result.type} Result:</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/login-register" 
              className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border"
            >
              <h3 className="font-medium">User Registration/Login</h3>
              <p className="text-sm text-gray-600">Register new user or login</p>
            </a>
            
            <a 
              href="/admin/login" 
              className="block p-4 bg-red-50 hover:bg-red-100 rounded-lg border"
            >
              <h3 className="font-medium">Admin Login</h3>
              <p className="text-sm text-gray-600">Access admin panel</p>
            </a>
            
            <a 
              href="/account" 
              className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg border"
            >
              <h3 className="font-medium">User Account</h3>
              <p className="text-sm text-gray-600">View MLM dashboard</p>
            </a>
            
            <a 
              href="/admin/mlm-panel" 
              className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border"
            >
              <h3 className="font-medium">MLM Admin Panel</h3>
              <p className="text-sm text-gray-600">Manage MLM system</p>
            </a>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Testing Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
            <li>First, create admin user at <a href="/setup-admin" className="underline">/setup-admin</a></li>
            <li>Register a new user with referral code (optional)</li>
            <li>Place an order to activate MLM system</li>
            <li>Check account page for referral link</li>
            <li>Login as admin to view MLM panel</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
