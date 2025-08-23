'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function TestActivation() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/account/mlm-profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleActivation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/activate-mlm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      console.log('Activation result:', result)
      
      if (response.ok) {
        alert(`Success: ${result.message}`)
        await fetchUserData() // Refresh user data
      } else {
        alert(`Error: ${result.error || result.message}`)
      }
    } catch (error) {
      console.error('Activation error:', error)
      alert('Failed to activate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
    }
  }, [session])

  if (!session) {
    return <div className="p-8">Please login first</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test MLM Activation</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
        {userData ? (
          <div className="space-y-2">
            <p><strong>Name:</strong> {userData.user?.fullName}</p>
            <p><strong>Is Active:</strong> {userData.user?.isActive ? 'Yes' : 'No'}</p>
            <p><strong>Referral Code:</strong> {userData.user?.referralCode || 'Not generated'}</p>
            <p><strong>Referral Link:</strong> {userData.user?.referralLink || 'Not available'}</p>
            <p><strong>Wallet Balance:</strong> ₹{userData.user?.wallet?.rupees || 0}</p>
          </div>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="space-y-4">
          <button
            onClick={fetchUserData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
          
          <button
            onClick={handleActivation}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Activating...' : 'Test Activation'}
          </button>
        </div>
      </div>

      {userData?.user?.referralLink && (
        <div className="bg-green-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-green-800">✅ Your Referral Link is Ready!</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code:</label>
              <input
                type="text"
                value={userData.user.referralCode}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link:</label>
              <input
                type="text"
                value={userData.user.referralLink}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
