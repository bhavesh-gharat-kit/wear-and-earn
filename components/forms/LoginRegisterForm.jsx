
"use client"

import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';

function LoginRegisterForm() {
  const [isLogin, setIsLogin] = useState(true); // State to toggle between Login and Register components

  return (
    <div className="py-16 flex flex-col items-center w-6/12 mx-auto max-sm:w-full max-sm:px-2 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome to WearEarn</h1>
        <button
          className={`px-8 py-3 mr-4 cursor-pointer rounded-lg font-medium transition-all ${isLogin ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setIsLogin(true)} // Show Login Component
        >
          Login
        </button>
        <button
          className={`px-8 py-3 cursor-pointer rounded-lg font-medium transition-all ${!isLogin ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setIsLogin(false)} // Show Register Component
        >
          Register
        </button>
      </div>

      {/* Show Login or Register based on state */}
      {isLogin ? <Login /> : <Register setIsLogin={setIsLogin} />}
    </div>
  );
}

export default LoginRegisterForm;
