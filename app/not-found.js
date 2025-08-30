import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </Link>
          
          <div className="flex justify-center space-x-4 text-sm">
            <Link 
              href="/"
              className="text-blue-600 hover:underline"
            >
              Home
            </Link>
            <Link 
              href="/products"
              className="text-blue-600 hover:underline"
            >
              Products
            </Link>
            <Link 
              href="/contact-us"
              className="text-blue-600 hover:underline"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}