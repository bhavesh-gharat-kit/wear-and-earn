"use client";

import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-400 mb-4">Oops!</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-8">
                An unexpected error occurred. Please try again or go back to the homepage.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left bg-gray-100 p-4 rounded mb-4">
                  <summary className="cursor-pointer text-red-600 font-semibold">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs mt-2 text-gray-700 overflow-auto">
                    {error?.stack || error?.message || 'Unknown error'}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={reset}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors mr-4"
              >
                Try Again
              </button>
              
              <Link 
                href="/"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}