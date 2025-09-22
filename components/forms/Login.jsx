"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { signIn } from "next-auth/react";
import Image from "next/image";
import ForgotPasswordModal from "@/components/ui/ForgotPasswordModal";

// Validation schema using Yup
const schema = Yup.object().shape({
  mobileNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema), // Using the Yup resolver for validation
  });

  // authentication while logging using mobile number and password
  const onSubmit = async (data) => {
    await signIn("credentials", {
      mobileNo: data.mobileNo,
      password: data.password,
      redirect: true,
      callbackUrl: "/", // Redirect to home page with proper layout
    });
  };

  return (
    <div className="flex flex-col items-center sm:justify-center min-h-[60vh] pt-4 sm:pt-0 px-3 sm:px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col items-center">
        <Image src={"/images/brand-logo.png"} width={100} height={100} className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] mb-3 sm:mb-6 rounded-full border-2 border-amber-500 bg-white dark:bg-gray-800" alt="WearEarn Logo" />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 tracking-tight text-center">
          <span className="block text-gray-700 dark:text-gray-200">Welcome to</span>
          <span className="block">
            <span className="text-amber-600 dark:text-amber-400">Wear</span>
            <span className="mx-1 text-gray-600 dark:text-gray-300">and</span>
            <span className="text-purple-600 dark:text-purple-300">Earn</span>
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-8 text-center">Sign in to your account</p>
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 sm:px-4 md:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 text-sm sm:text-base text-center font-medium border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
          {/* Mobile-Enhanced Mobile Number */}
          <div className="mb-4 sm:mb-6">
            <label
              htmlFor="mobileNo"
              className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Mobile Number
            </label>
            <input
              type="text"
              id="mobileNo"
              {...register("mobileNo")}
              className="w-full p-4 sm:p-5 md:p-6 text-lg sm:text-xl border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your mobile number"
            />
            {errors.mobileNo && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                {errors.mobileNo.message}
              </p>
            )}
          </div>

          {/* Mobile-Enhanced Password */}
          <div className="mb-6 sm:mb-8">
            <label
              htmlFor="password"
              className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...register("password")}
                className="w-full p-4 sm:p-5 md:p-6 text-lg sm:text-xl border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.001 12c1.73 4.556 6.1 7.5 10.999 7.5 2.042 0 3.98-.488 5.657-1.354M19.07 15.607A10.45 10.45 0 0 0 21 12c-1.73-4.556-6.1-7.5-10.999-7.5a11.05 11.05 0 0 0-4.118.797M9.88 9.88a3 3 0 1 1 4.24 4.24M15 12a3 3 0 0 1-3 3m0 0a3 3 0 0 1-3-3m3 3L3 3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.001 12C3.73 7.444 8.1 4.5 13 4.5c4.899 0 9.269 2.944 10.999 7.5-1.73 4.556-6.1 7.5-10.999 7.5-4.899 0-9.269-2.944-10.999-7.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-center mb-3 sm:mb-6">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm sm:text-base font-medium transition-colors"
            >
              Forgot your password?
            </button>
          </div>

          {/* Mobile-Enhanced Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 sm:px-10 md:px-12 py-4 sm:py-4 text-lg sm:text-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95 shadow-lg font-semibold"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setError("");
          // Optional: Show success message
        }}
      />
    </div>
  );
};

export default Login;
