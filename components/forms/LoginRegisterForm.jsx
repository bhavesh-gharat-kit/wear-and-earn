
"use client"

import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';

function LoginRegisterForm() {
  const [isLogin, setIsLogin] = useState(true); // State to toggle between Login and Register components

  return (
    <div className="py-8 flex flex-col items-center w-full max-w-2xl mx-auto px-4 min-h-screen">
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
