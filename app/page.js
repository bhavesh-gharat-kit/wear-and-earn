import HomePage from '@/app/navigations/user/Home-Page/HomePage'

export default function RootPage() {
  try {
    return <HomePage />
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Wear & Earn</h1>
          <p className="text-gray-600 mb-6">Your fashion destination</p>
          <a href="/products" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
            Shop Now
          </a>
        </div>
      </div>
    )
  }
}
