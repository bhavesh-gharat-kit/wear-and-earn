"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FaUserAlt, FaLock } from "react-icons/fa";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Page = () => {
  const [mobileNo, setMobileNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    // return
    await signIn("credentials", {
      mobileNo,
      password,
      redirect: true,
      callbackUrl: "/", // Redirect to home page
    });
  };

  return (
    <div>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 to-white px-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <span className="ml-2 text-xl font-semibold text-gray-800">
              Library Login
            </span>
          </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <FaUserAlt className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="mobileNo"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-full border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute top-3.5 left-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-full bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Forgot your password?{" "}
          <Link href="#" className="text-blue-600 hover:underline">
            Reset
          </Link>
        </div>
      </div>
    </main>
    <Footer />
    </div>
  );
};

export default Page;
