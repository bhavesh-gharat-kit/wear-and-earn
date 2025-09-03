
"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Register from './Register';
import Login from './Login';

function LoginRegisterForm() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true); // Default to login initially
  
  // Check for referral codes after component mounts to avoid SSR issues
  useEffect(() => {
    if (searchParams) {
      const hasReferralCode = searchParams.get('spid') || searchParams.get('ref');
      if (hasReferralCode) {
        setIsLogin(false); // Switch to registration if referral code exists
      }
    }
  }, [searchParams]);

  return (
    <div className="py-8 flex flex-col items-center w-full max-w-6xl mx-auto px-4 min-h-screen">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 mb-6 border border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 mr-2 cursor-pointer rounded-lg font-medium transition-all ${
              isLogin 
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' 
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`px-6 py-3 cursor-pointer rounded-lg font-medium transition-all ${
              !isLogin 
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' 
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>
      </div>

      {/* Show Login or Register based on state */}
      {isLogin ? <Login /> : <Register setIsLogin={setIsLogin} />}
    </div>
  );
}

export default LoginRegisterForm;
