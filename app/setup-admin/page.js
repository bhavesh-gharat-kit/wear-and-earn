'use client'
import { useState } from 'react'

export default function CreateAdminPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const checkAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-admin')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Check or create admin user
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={checkAdmin}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check Admin User'}
          </button>
          
          <button
            onClick={createAdmin}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Create Admin User'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Result:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 border rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-2">Admin Access Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click &quot;Create Admin User&quot; to create admin account</li>
            <li>Go to <a href="/admin/login" className="text-blue-600 hover:underline">/admin/login</a></li>
            <li>Use credentials: <code className="bg-gray-200 px-1 rounded">admin / admin123</code></li>
            <li>Access MLM panel at <a href="/admin/mlm-panel" className="text-blue-600 hover:underline">/admin/mlm-panel</a></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
